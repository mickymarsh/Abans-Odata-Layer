require('dotenv').config();

module.exports = {
    requires: {
        db: {
            kind: 'postgres',
            credentials: {
                url: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                }
            }
        }
    }
};