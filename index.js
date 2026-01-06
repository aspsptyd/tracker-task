const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const DB_HOST = process.env.DB_HOST || '10.21.124.45';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '!!&21adi';
const DB_NAME = process.env.DB_NAME || 'time_tracker';
const PORT = process.env.PORT || 3000;

async function initDb() {
  // Connect without database to create it if missing
  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    multipleStatements: true
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`);
  await conn.end();

  const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Create tables if not exist
  const createTasks = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;

  const createSessions = `
    CREATE TABLE IF NOT EXISTS task_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      duration INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  await pool.query(createTasks);
  await pool.query(createSessions);

  return pool;
}

function secondsToString(sec) {
  if (!sec) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

async function main() {
  const app = express();
  app.use(express.json());

  const pool = await initDb();

  app.get('/api/ping', (req, res) => res.json({ ok: true, db: DB_HOST }));

  // Create task
  app.post('/api/tasks', async (req, res) => {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const [result] = await pool.query('INSERT INTO tasks (title, description) VALUES (?, ?)', [title, description || null]);
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.json(rows[0]);
  });

  // Create session for task
  app.post('/api/tasks/:id/sessions', async (req, res) => {
    const taskId = req.params.id;
    const { start_time, end_time } = req.body;
    if (!start_time || !end_time) return res.status(400).json({ error: 'start_time and end_time required (ISO string)' });

    const start = new Date(start_time);
    const end = new Date(end_time);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ error: 'invalid date format' });

    const durationSec = Math.max(0, Math.floor((end - start) / 1000));

    // Pass JS Date objects to mysql2 so they are formatted correctly for DATETIME
    await pool.query('INSERT INTO task_sessions (task_id, start_time, end_time, duration) VALUES (?, ?, ?, ?)', [taskId, start, end, durationSec]);
    res.json({ ok: true, duration: durationSec });
  });

  // List tasks with aggregated info
  app.get('/api/tasks', async (req, res) => {
    const sql = `
      SELECT
        t.id,
        t.title,
        t.description,
        t.created_at,
        COALESCE(SUM(ts.duration), 0) AS total_duration,
        MIN(ts.start_time) AS first_start,
        MAX(ts.end_time) AS last_end,
        COUNT(ts.id) AS sessions_count
      FROM tasks t
      LEFT JOIN task_sessions ts ON ts.task_id = t.id
      GROUP BY t.id
      ORDER BY first_start DESC;
    `;
    const [rows] = await pool.query(sql);
    res.json(rows.map(r => ({
      ...r,
      total_duration_readable: secondsToString(r.total_duration)
    })));
  });

  // Get task detail + sessions
  app.get('/api/tasks/:id', async (req, res) => {
    const id = req.params.id;
    const [[task]] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) return res.status(404).json({ error: 'not found' });
    const [sessions] = await pool.query('SELECT * FROM task_sessions WHERE task_id = ? ORDER BY start_time', [id]);
    res.json({ task, sessions });
  });

  // Update task
  app.put('/api/tasks/:id', async (req, res) => {
    const id = req.params.id;
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    await pool.query('UPDATE tasks SET title = ?, description = ? WHERE id = ?', [title, description || null, id]);
    const [[task]] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(task);
  });

  // Delete task
  app.delete('/api/tasks/:id', async (req, res) => {
    const id = req.params.id;
    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ ok: true });
  });

  // Update session
  app.put('/api/tasks/:taskId/sessions/:sessionId', async (req, res) => {
    const { taskId, sessionId } = req.params;
    const { start_time, end_time } = req.body;
    if (!start_time || !end_time) return res.status(400).json({ error: 'start_time and end_time required' });
    const start = new Date(start_time);
    const end = new Date(end_time);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ error: 'invalid date format' });
    const durationSec = Math.max(0, Math.floor((end - start) / 1000));
    await pool.query('UPDATE task_sessions SET start_time = ?, end_time = ?, duration = ? WHERE id = ? AND task_id = ?', [start, end, durationSec, sessionId, taskId]);
    const [[row]] = await pool.query('SELECT * FROM task_sessions WHERE id = ?', [sessionId]);
    res.json(row);
  });

  // Delete session
  app.delete('/api/tasks/:taskId/sessions/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    await pool.query('DELETE FROM task_sessions WHERE id = ?', [sessionId]);
    res.json({ ok: true });
  });

  // Serve static frontend
  app.use(express.static(path.join(__dirname, 'public')));

  app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
    console.log(`DB host: ${DB_HOST}, DB name: ${DB_NAME}`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
