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
    // Handle form submissions for adding or clearing visitors
    if (req.query.name) {
      await pool.query('INSERT INTO visitors (name) VALUES ($1)', [req.query.name]);
      return res.redirect('/'); // Redirect to clean the URL
    } else if (req.query.action === 'clear') {
      await pool.query('DELETE FROM visitors');
      return res.redirect('/');
    }

    // Read all visitors from the DB
    const result = await pool.query('SELECT * FROM visitors ORDER BY id DESC');
    
    // Beautiful HTML with styling, a form to add, and a form to clear
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visitor Log</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f4f8;
            color: #333;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            background: #ffffff;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            width: 100%;
            max-width: 450px;
          }
          h1 {
            text-align: center;
            color: #1a365d;
            margin-top: 0;
            margin-bottom: 25px;
            font-size: 28px;
          }
          .form-group {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
          }
          input[type="text"] {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.3s ease;
          }
          input[type="text"]:focus {
            outline: none;
            border-color: #3182ce;
            box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
          }
          button {
            padding: 12px 20px;
            background-color: #3182ce;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          button:hover {
            background-color: #2b6cb0;
          }
          .btn-danger {
            background-color: #e53e3e;
            padding: 8px 16px;
            font-size: 14px;
          }
          .btn-danger:hover {
            background-color: #c53030;
          }
          .header-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #edf2f7;
          }
          .header-actions h3 {
            margin: 0;
            color: #4a5568;
            font-size: 18px;
          }
          ul {
            list-style-type: none;
            padding: 0;
            margin: 0;
            max-height: 350px;
            overflow-y: auto;
          }
          li {
            background: #f7fafc;
            margin-bottom: 10px;
            padding: 14px 18px;
            border-radius: 8px;
            border-left: 5px solid #4299e1;
            display: flex;
            align-items: center;
            font-weight: 500;
            color: #2d3748;
            animation: fadeIn 0.3s ease-in;
          }
          .empty-state {
            text-align: center;
            color: #a0aec0;
            font-style: italic;
            background: transparent;
            border-left: none;
            justify-content: center;
            padding: 30px 0;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Visitor Log 📖</h1>
          
          <form action="/" method="GET" class="form-group">
            <input type="text" name="name" placeholder="What's your name?" required autocomplete="off">
            <button type="submit">Add Me</button>
          </form>
          
          <div class="header-actions">
            <h3>Recent Visitors</h3>
            <form action="/" method="GET" style="margin: 0;">
              <input type="hidden" name="action" value="clear">
              <button type="submit" class="btn-danger" onclick="return confirm('Are you sure you want to clear all visitors?')">Clear All</button>
            </form>
          </div>

          <ul>
            ${result.rows.length > 0 
              ? result.rows.map(r => `<li>👋 ${r.name}</li>`).join('') 
              : '<li class="empty-state">No visitors yet. Be the first!</li>'}
          </ul>
        </div>
      </body>
      </html>
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