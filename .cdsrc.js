require('dotenv').config();

module.exports = {
  requires: {
    db: {
      kind: 'postgres',
      credentials: {
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        statement_timeout: 30000,
        connectionTimeoutMillis: 10000
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
