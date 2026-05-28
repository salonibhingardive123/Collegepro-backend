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
app.get('/api/reviews', async (req, res) => {
    try {
        const result = await db.query('SELECT id, title, author, rating, text, created_at AS date FROM reviews ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error executing GET /api/reviews:", err.message);
        res.status(500).json({ error: "Internal database server retrieval error" });
    }
});

// ROUTE 2: POST - Create and insert a new reader review
// UPGRADED POST ROUTE WITH EXTENSIVE TRACKING LOGS
app.post('/api/reviews', async (req, res) => {
    console.log("Incoming POST payload request body:", req.body);
    
    // Abstract inputs while accommodating alternative naming variations
    const title = req.body.title;
    const author = req.body.author;
    const rating = req.body.rating;
    const text = req.body.text || req.body.reviewText; // Fallback mapping match

    // Flexible logging validation check parameters
    if (!title || !author || !rating || !text) {
        console.warn("Validation Rejected: Missing one or more payload values.", { title, author, rating, text });
        return res.status(400).json({ 
            error: "Missing parameters.", 
            received: { title, author, rating, text } 
        });
    }

    try {
        const insertQuery = `
            INSERT INTO reviews (title, author, rating, text) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, title, author, rating, text;
        `;
        const values = [title, author, parseInt(rating), text];
        const result = await db.query(insertQuery, values);
        
        console.log("Database write success! Inserted entry row data:", result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Critical insert block error execution exception:", err.message);
        res.status(500).json({ error: "Internal database statement breakdown", details: err.message });
    }
});

// Launch the Express listener
app.listen(PORT, () => {
    console.log(`Backend book review API engine actively listening on port ${PORT}`);
});
