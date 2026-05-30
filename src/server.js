require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { authenticate, API_KEY } = require('./middleware/auth');
const { SERVICES } = require('./config/constants');
const { query } = require('./config/database');
const { parseFilter, parseOrderBy, parseSelect, toDbField } = require('./utils/odataParser');
const { buildMetadata, buildServiceDocument } = require('./utils/metadataBuilder');

const app = express();
const PORT = process.env.PORT || 4004;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health — public
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Root — public
app.get('/', (req, res) => {
  res.json({
    name: 'Abans OData V4 Gateway',
    services: Object.values(SERVICES).map(s => s.basePath)
  });
});

// Auth for everything else
app.use(authenticate);

// ============================================================
// OData handler — mounted at exact path prefix
// Uses regex to match /sap/opu/odata4/sap/ followed by anything
// ============================================================
app.get(/\/sap\/opu\/odata4\/sap\/.*/, async (req, res, next) => {
  try {
    // Strip the prefix to get the service-relative path
    const prefix = '/sap/opu/odata4/sap/';
    const relativePath = req.path.slice(prefix.length); // e.g., z_inventory_health/.../0001/$metadata

    function findService(servicePath) {
      return Object.keys(SERVICES).find(name => SERVICES[name].basePath === servicePath);
    }

    function parseKeyValues(keyString) {
      const keys = {};
      const regex = /(\w+)=('([^']*)'|(\d+))/g;
      let m;
      while ((m = regex.exec(keyString)) !== null) {
        keys[m[1]] = m[4] !== undefined ? parseInt(m[4], 10) : m[3];
      }
      return keys;
    }

    function parsePath(path) {
      if (path.endsWith('/$metadata')) {
        return { type: 'metadata', servicePath: path.slice(0, -10) };
      }
      if (path.endsWith('/')) {
        return { type: 'service', servicePath: path.slice(0, -1) };
      }
      const lastSlash = path.lastIndexOf('/');
      if (lastSlash === -1) return { type: 'unknown', servicePath: path };
      
      const servicePath = path.substring(0, lastSlash);
      const remainder = path.substring(lastSlash + 1);
      
      const parenIndex = remainder.indexOf('(');
      if (parenIndex !== -1 && remainder.endsWith(')')) {
        return {
          type: 'entity',
          servicePath,
          entitySetName: remainder.substring(0, parenIndex),
          keyString: remainder.substring(parenIndex + 1, remainder.length - 1)
        };
      }
      return { type: 'entityset', servicePath, entitySetName: remainder };
    }

    function toOData(row, entitySet) {
      const out = {};
      for (const [odataName, cfg] of Object.entries(entitySet.fields)) {
        const dbName = cfg.dbField || toDbField(odataName);
        if (row[dbName] !== undefined) {
          if (cfg.type === 'Edm.Date' && row[dbName] instanceof Date) {
            out[odataName] = row[dbName].toISOString().split('T')[0];
          } else if (cfg.type === 'Edm.Boolean') {
            out[odataName] = !!row[dbName];
          } else if (cfg.type === 'Edm.Decimal' && typeof row[dbName] === 'string') {
            out[odataName] = parseFloat(row[dbName]);
          } else if (cfg.type === 'Edm.Int32') {
            out[odataName] = parseInt(row[dbName], 10);
          } else {
            out[odataName] = row[dbName];
          }
        }
      }
      return out;
    }

    const parsed = parsePath(relativePath);
    const serviceName = findService(parsed.servicePath);

    if (!serviceName) {
      return res.status(404).json({
        error: { code: '404', message: 'Service not found', details: [{ code: 'SERVICE_NOT_FOUND', message: parsed.servicePath }] }
      });
    }

    const service = SERVICES[serviceName];

    if (parsed.type === 'metadata') {
      res.set('Content-Type', 'application/xml');
      return res.send(buildMetadata(serviceName));
    }

    if (parsed.type === 'service') {
      return res.json(buildServiceDocument(serviceName));
    }

    if (parsed.type === 'entityset') {
      const entitySet = service.entitySets[parsed.entitySetName];
      if (!entitySet) {
        return res.status(404).json({
          error: { code: '404', message: 'EntitySet not found', details: [{ code: 'ENTITYSET_NOT_FOUND', message: parsed.entitySetName }] }
        });
      }

      const table = entitySet.sourceTable;
      const { $filter, $orderby, $select, $top, $skip, $count } = req.query;

      let sql = `SELECT ${parseSelect($select, entitySet)} FROM ${table}`;
      const params = [];

      if ($filter) {
        const f = parseFilter($filter);
        if (f.sql) { sql += ` WHERE ${f.sql}`; params.push(...f.params); }
      }

      if ($orderby) sql += ` ORDER BY ${parseOrderBy($orderby)}`;

      const limit = Math.min(parseInt($top, 10) || 1000, 1000);
      const offset = parseInt($skip, 10) || 0;
      sql += ` LIMIT ${limit} OFFSET ${offset}`;

      const result = await query(sql, params);
      const rows = result.rows.map(r => toOData(r, entitySet));

      const response = {
        '@odata.context': `$metadata#${parsed.entitySetName}`,
        value: rows
      };

      if ($count === 'true') {
        let countSql = `SELECT COUNT(*) as c FROM ${table}`;
        const countParams = [];
        if ($filter) {
          const f = parseFilter($filter);
          if (f.sql) { countSql += ` WHERE ${f.sql}`; countParams.push(...f.params); }
        }
        const countResult = await query(countSql, countParams);
        response['@odata.count'] = parseInt(countResult.rows[0].c, 10);
      }

      return res.json(response);
    }

    if (parsed.type === 'entity') {
      const entitySet = service.entitySets[parsed.entitySetName];
      if (!entitySet) {
        return res.status(404).json({
          error: { code: '404', message: 'EntitySet not found', details: [{ code: 'ENTITYSET_NOT_FOUND', message: parsed.entitySetName }] }
        });
      }

      const keys = parseKeyValues(parsed.keyString);
      const table = entitySet.sourceTable;
      const conditions = [];
      const params = [];
      let i = 1;

      for (const key of entitySet.keys) {
        conditions.push(`${entitySet.fields[key].dbField || toDbField(key)} = $${i++}`);
        params.push(keys[key]);
      }

      const sql = `SELECT * FROM ${table} WHERE ${conditions.join(' AND ')}`;
      const result = await query(sql, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: { code: '404', message: 'Entity not found', details: [{ code: 'ENTITY_NOT_FOUND', message: JSON.stringify(keys) }] }
        });
      }

      return res.json({
        '@odata.context': `$metadata#${parsed.entitySetName}/$entity`,
        ...toOData(result.rows[0], entitySet)
      });
    }

    next(); // unknown path type

  } catch (err) { next(err); }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    error: {
      code: String(err.statusCode || 500),
      message: err.message || 'Internal Server Error',
      details: [{ code: 'ERROR', message: err.message }]
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: { code: '404', message: 'Not Found', details: [{ code: 'ROUTE_NOT_FOUND', message: `${req.method} ${req.path}` }] }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 OData Gateway on http://localhost:${PORT}`);
  console.log(`📄 Metadata: http://localhost:${PORT}/sap/opu/odata4/sap/z_inventory_health/srvd_a2x/sap/inventoryhealth/0001/$metadata`);
  console.log(`💡 Health: http://localhost:${PORT}/health (no auth)`);
});