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

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM visitors');
    res.send(`<h1>Visitor Log</h1><ul>${result.rows.map(r => `<li>${r.name}</li>`).join('')}</ul>`);
  } catch (err) {
    res.status(500).send("Database not initialized yet. Error: " + err.message);
  }
});

app.post('/add', async (req, res) => {
  const { name } = req.body;
  await pool.query('INSERT INTO visitors (name) VALUES ($1)', [name]);
  res.status(201).send(`Added ${name}`);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});