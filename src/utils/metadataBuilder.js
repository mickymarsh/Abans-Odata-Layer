/**
 * OData $metadata XML Generator
 */
const { ODATA_NAMESPACE, SERVICES } = require('../config/constants');

function buildMetadata(serviceName) {
  const service = SERVICES[serviceName];
  const entityTypes = [];
  const entitySets = [];

  for (const [setName, config] of Object.entries(service.entitySets)) {
    const props = Object.entries(config.fields).map(([name, cfg]) => {
      let type = cfg.type;
      if (cfg.type === 'Edm.Decimal') type = `Edm.Decimal(${cfg.precision},${cfg.scale})`;
      if (cfg.type === 'Edm.String' && cfg.maxLength) type = `Edm.String(${cfg.maxLength})`;
      const nullable = cfg.nullable !== false ? 'Nullable="true"' : 'Nullable="false"';
      return `        <Property Name="${name}" Type="${type}" ${nullable}/>`;
    }).join('\n');

    const keyRefs = config.keys.map(k => `          <PropertyRef Name="${k}"/>`).join('\n');

    entityTypes.push(`      <EntityType Name="${setName}">\n        <Key>\n${keyRefs}\n        </Key>\n${props}\n      </EntityType>`);
    entitySets.push(`      <EntitySet Name="${setName}" EntityType="${ODATA_NAMESPACE}.${setName}"/>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0">\n  <edmx:DataServices>\n    <Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="${ODATA_NAMESPACE}">\n${entityTypes.join('\n\n')}\n      <EntityContainer Name="EntityContainer">\n${entitySets.join('\n')}\n      </EntityContainer>\n    </Schema>\n  </edmx:DataServices>\n</edmx:Edmx>`;
}

function buildServiceDocument(serviceName) {
  const service = SERVICES[serviceName];
  return {
    '@odata.context': '$metadata',
    value: Object.keys(service.entitySets).map(name => ({ name, url: name }))
  };
}

module.exports = { buildMetadata, buildServiceDocument };
