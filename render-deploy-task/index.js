const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});

// Updated Route to include a Form for Writing to the DB
app.get('/', async (req, res) => {
  try {
    // Add a new visitor if the form was submitted via URL
    if (req.query.name) {
      await pool.query('INSERT INTO visitors (name) VALUES ($1)', [req.query.name]);
    }

    // Read all visitors from the DB
    const result = await pool.query('SELECT * FROM visitors');
    
    // Simple HTML with a form and a list
    const html = `
      <h1>Visitor Log</h1>
      <form action="/" method="GET">
        <input type="text" name="name" placeholder="Enter your name" required>
        <button type="submit">Add Visitor</button>
      </form>
      <hr>
      <ul>
        ${result.rows.map(r => `<li>${r.name}</li>`).join('')}
      </ul>
    `;
    res.send(html);
  } catch (err) {
    res.status(500).send("Database Error: " + err.message);
  }
});

app.post('/add', async (req, res) => {
  const { name } = req.body;
  await pool.query('INSERT INTO visitors (name) VALUES ($1)', [name]);
  res.status(201).send(`Added ${name}`);
});

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);
    console.log("Database table 'visitors' is ready.");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

initDb().then(() => {
  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });
});