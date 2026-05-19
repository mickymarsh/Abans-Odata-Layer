require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  await client.connect();
  const r = await client.query(`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public' AND (table_name ILIKE '%salesorder%' OR table_name ILIKE '%sales_order%')
    ORDER BY table_type, table_name
  `);
  console.log('Sales-order-related objects:');
  console.table(r.rows);
  await client.end();
})().catch(e => { console.error(e.message); process.exit(1); });
