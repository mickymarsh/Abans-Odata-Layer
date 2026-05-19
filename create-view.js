require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  await client.connect();

  // Drop any prior attempts (both casings)
  await client.query(`DROP VIEW IF EXISTS "CE_SALESORDER_0001_SALES_ORDERS"`);
  await client.query(`DROP VIEW IF EXISTS "ce_salesorder_0001_sales_orders"`);

  // CAP (@cap-js/postgres) always references identifiers in lowercase.
  // The source table from SAP replication is uppercase-quoted.
  // Bridge them with a lowercase view that aliases columns.
  await client.query(`
    CREATE VIEW "ce_salesorder_0001_sales_orders" AS
    SELECT
      "VBELN" AS "vbeln",
      "POSNR" AS "posnr",
      "MATNR" AS "matnr",
      "WERKS" AS "werks",
      "KUNNR" AS "kunnr",
      "MENGE" AS "menge",
      "NETPR" AS "netpr",
      "AUDAT" AS "audat",
      "EDATU" AS "edatu"
    FROM "SALES_ORDERS"
  `);
  console.log('Lowercase view "ce_salesorder_0001_sales_orders" created.');

  const r = await client.query(`
    SELECT table_name, table_type FROM information_schema.tables
    WHERE table_schema='public' AND lower(table_name) LIKE '%sales%order%'
    ORDER BY table_type, table_name
  `);
  console.table(r.rows);

  const rc = await client.query(`SELECT COUNT(*)::int AS row_count FROM "ce_salesorder_0001_sales_orders"`);
  console.log('Rows accessible via view:', rc.rows[0].row_count);

  const sample = await client.query(`SELECT * FROM "ce_salesorder_0001_sales_orders" LIMIT 3`);
  console.log('Sample rows:');
  console.table(sample.rows);

  await client.end();
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
