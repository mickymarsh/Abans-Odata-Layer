require('dotenv').config();

console.log('DB CONFIG DEBUG');
console.log({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
});

module.exports = {
  requires: {
    db: {
      kind: 'postgres',
      credentials: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { require: true, rejectUnauthorized: false }
      },
      pool: {
        min: 1,
        max: 10,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 30000,
        idleTimeoutMillis: 30000
      }
    }
  }
};