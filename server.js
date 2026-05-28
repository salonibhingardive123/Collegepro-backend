const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

// Use the dynamic port assigned by Azure App Service, or default to 8080 locally
const PORT = process.env.PORT || 8080;

// Enable CORS so your Static Web App frontend can make cross-origin API calls safely
app.use(cors());
app.use(express.json());

// Lifecycle Check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// ROUTE 1: GET - Fetch all reviews sorted by most recent
// ROUTE 1: GET - Fetch all reviews (Supports both raw root and /api paths)
app.get(['/api/reviews', '/reviews'], async (req, res) => {
    try {
        const result = await db.query('SELECT id, title, author, rating, text, created_at AS date FROM reviews ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error executing GET /reviews:", err.message);
        res.status(500).json({ error: "Internal database server retrieval error" });
    }
});

// ROUTE 2: POST - Create and insert a new reader review
app.post(['/api/reviews', '/reviews'], async (req, res) => {
    console.log("Incoming POST payload request body:", req.body);
    const { title, author, rating, text } = req.body;

    if (!title || !author || !rating || !text) {
        return res.status(400).json({ error: "Missing required submission parameters." });
    }

    try {
        const insertQuery = `
            INSERT INTO reviews (title, author, rating, text) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, title, author, rating, text;
        `;
        const values = [title, author, parseInt(rating), text];
        const result = await db.query(insertQuery, values);
        
        res.status(201).json(result.rows);
    } catch (err) {
        console.error("Error executing POST /reviews:", err.message);
        res.status(500).json({ error: "Internal database insert statement breakdown" });
    }
});


// Launch the Express listener
app.listen(PORT, () => {
    console.log(`Backend book review API engine actively listening on port ${PORT}`);
});
