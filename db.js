const { Pool } = require('pg');

// Configurations are read directly from runtime environment variables
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'dbadmin',
    password: process.env.DB_PASSWORD || 'YourSecurePassword123',
    database: process.env.DB_DATABASE || 'bookreviews',
    port: process.env.DB_PORT || 5432,
    max: 20, // Max connection pool clients
    idleTimeoutMillis: 30000
});

// Automated table initialization database lifecycle script
const initializeDatabase = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            author VARCHAR(255) NOT NULL,
            rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
            text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        const client = await pool.connect();
        await client.query(createTableQuery);
        console.log("Database lifecycle verified: 'reviews' table active.");
        client.release();
    } catch (err) {
        console.error("Critical: Failed to connect or initialize database schema:", err.message);
    }
};

initializeDatabase();

module.exports = {
    query: (text, params) => pool.query(text, params)
};
