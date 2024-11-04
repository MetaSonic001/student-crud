require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database table
async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      course VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// API Routes
app.get('/api/students', async (req, res) => {
  try {
    const students = await sql`SELECT * FROM students ORDER BY created_at DESC`;
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  const { name, email, course } = req.body;
  try {
    const newStudent = await sql`
      INSERT INTO students (name, email, course)
      VALUES (${name}, ${email}, ${course})
      RETURNING *
    `;
    res.json(newStudent[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, course } = req.body;
  try {
    const updatedStudent = await sql`
      UPDATE students 
      SET name = ${name}, email = ${email}, course = ${course}
      WHERE id = ${id}
      RETURNING *
    `;
    res.json(updatedStudent[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM students WHERE id = ${id}`;
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initDB().then(() => {
  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
});