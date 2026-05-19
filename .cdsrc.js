require('dotenv').config();

module.exports = {
    requires: {
        db: {
            kind: 'postgres',
            credentials: {
                url: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                },
                // Kill queries that run longer than 30 s so UI5 gets a proper error
                // instead of a silent "ResourceRequest timed out"
                statement_timeout: 30000,
                connectionTimeoutMillis: 10000
            },
            pool: {
                min: 2,
                max: 10,
                acquireTimeoutMillis: 10000,
                idleTimeoutMillis: 30000
            }
        }
    }
};