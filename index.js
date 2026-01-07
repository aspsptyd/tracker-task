require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || ''; // Kosongkan jika tidak menggunakan password
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL
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

  // Check if status column exists, if not add it
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM tasks LIKE 'status'");
    if (columns.length === 0) {
      await pool.query("ALTER TABLE tasks ADD COLUMN status ENUM('active', 'completed') DEFAULT 'active'");
    }
  } catch (err) {
    console.error('Error checking/adding status column:', err);
  }

  // Check if completed_at column exists, if not add it
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM tasks LIKE 'completed_at'");
    if (columns.length === 0) {
      await pool.query("ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP NULL");
    }
  } catch (err) {
    console.error('Error checking/adding completed_at column:', err);
  }

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

  // Dashboard Stats
  app.get('/api/stats', async (req, res) => {
    try {
      // 1. Total Task Today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [todayTasks] = await pool.query(`
        SELECT COUNT(DISTINCT t.id) as count, COALESCE(SUM(ts.duration), 0) as total_duration
        FROM tasks t
        JOIN task_sessions ts ON t.id = ts.task_id
        WHERE ts.start_time >= ? AND ts.start_time <= ?
      `, [todayStart, todayEnd]);

      // 2. Task Running (We can't know for sure from DB only as running state is client-side mostly, 
      // but we can check if there are sessions that started but not ended? 
      // Actually the current implementation sends start/end only when stopped.
      // So "Task Running" is better tracked by client or we need a different DB structure.
      // However, the requirement asks for "Task Running". 
      // Since the current backend only stores COMPLETED sessions (start+end), 
      // the backend doesn't know about currently running tasks unless we change the architecture.
      // BUT, the prompt asks to "update codenya sekalian".
      // For now, let's assume the client will handle "Task Running" count or we just return 0 from backend 
      // and let client override if it has local state. 
      // OR we can count tasks modified/created today as "active" context.
      // Let's stick to what we can calculate:
      
      // 3. Total Task in Week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
      weekStart.setHours(0, 0, 0, 0);
      
      const [weekTasks] = await pool.query(`
        SELECT COUNT(DISTINCT t.id) as count
        FROM tasks t
        JOIN task_sessions ts ON t.id = ts.task_id
        WHERE ts.start_time >= ?
      `, [weekStart]);

      res.json({
        today: {
          count: todayTasks[0].count,
          duration: todayTasks[0].total_duration,
          duration_readable: secondsToString(todayTasks[0].total_duration)
        },
        week: {
          count: weekTasks[0].count
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

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
        t.status,
        t.created_at,
        t.completed_at,
        COALESCE(SUM(ts.duration), 0) AS total_duration,
        MIN(ts.start_time) AS first_start,
        MAX(ts.end_time) AS last_end,
        COUNT(ts.id) AS sessions_count
      FROM tasks t
      LEFT JOIN task_sessions ts ON ts.task_id = t.id
      GROUP BY t.id
      ORDER BY t.status ASC, first_start DESC;
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
    const { title, description, status } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const updateFields = [];
    const updateValues = [];

    updateFields.push('title = ?');
    updateValues.push(title);

    updateFields.push('description = ?');
    updateValues.push(description || null);

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);

      // Set completed_at when status is 'completed', otherwise set to NULL
      if (status === 'completed') {
        updateFields.push('completed_at = NOW()');
      } else {
        updateFields.push('completed_at = NULL');
      }
    }

    await pool.query(`UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`, [...updateValues, id]);
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

  // Get task history by date
  app.get('/api/history', async (req, res) => {
    try {
      // Get all completed tasks with their session data
      const [completedRows] = await pool.query(`
        SELECT
          t.id,
          t.title,
          t.description,
          t.status,
          t.created_at,
          t.completed_at,
          DATE(t.completed_at) as completion_date,
          COALESCE(SUM(ts.duration), 0) AS total_duration
        FROM tasks t
        LEFT JOIN task_sessions ts ON ts.task_id = t.id
        WHERE t.status = 'completed' AND t.completed_at IS NOT NULL
        GROUP BY t.id
        ORDER BY t.completed_at DESC
      `);

      // Get all tasks (both active and completed) grouped by creation date to calculate total per date
      const [allRows] = await pool.query(`
        SELECT
          t.id,
          t.title,
          t.description,
          t.status,
          t.created_at,
          t.completed_at,
          DATE(t.created_at) as creation_date,
          COALESCE(SUM(ts.duration), 0) AS total_duration
        FROM tasks t
        LEFT JOIN task_sessions ts ON ts.task_id = t.id
        WHERE DATE(t.created_at) IN (
          SELECT DISTINCT DATE(completed_at)
          FROM tasks
          WHERE status = 'completed' AND completed_at IS NOT NULL
        )  -- Only get tasks from dates that have completed tasks
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `);

      // Group completed tasks by completion date
      const completedTasksByDate = {};
      completedRows.forEach(task => {
        const date = task.completion_date;
        if (!completedTasksByDate[date]) {
          completedTasksByDate[date] = [];
        }
        completedTasksByDate[date].push(task);
      });

      // Group all tasks by creation date (for calculating total tasks per date)
      const allTasksByDate = {};
      allRows.forEach(task => {
        const date = task.creation_date;
        if (!allTasksByDate[date]) {
          allTasksByDate[date] = [];
        }
        allTasksByDate[date].push(task);
      });

      // Format the response with date labels and progress
      const historyData = [];
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const options = { day: 'numeric', month: 'short', year: 'numeric' };

      // Process each date that has completed tasks
      for (const [date, completedTasks] of Object.entries(completedTasksByDate)) {
        // Get all tasks for this date (both completed and not completed)
        const allTasksForDate = allTasksByDate[date] || [];
        const totalTasks = allTasksForDate.length;
        const completedTasksCount = completedTasks.length;

        // Format date label
        let dateLabel;
        if (date === today) {
          dateLabel = "Hari Ini";
        } else {
          // Convert date string to proper date object for formatting
          const dateObj = new Date(date);
          dateLabel = dateObj.toLocaleDateString('id-ID', options);
        }

        historyData.push({
          date: date,
          dateLabel: dateLabel,
          progress: `${completedTasksCount}/${totalTasks}`,
          tasks: completedTasks
        });
      }

      // Sort by date descending (most recent first)
      historyData.sort((a, b) => new Date(b.date) - new Date(a.date));

      res.json(historyData);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch history data' });
    }
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
