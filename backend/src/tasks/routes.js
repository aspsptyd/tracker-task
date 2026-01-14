const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
} = require('../tasks/controller');
const { getStats } = require('../tasks/statsController');
const { getHistory } = require('../tasks/historyController');
const { createSession, updateSession, deleteSession } = require('../sessions/controller');
const { startRunningTask, stopRunningTask, getRunningTasks } = require('../runningTasks/controller');

const router = express.Router();

// Health check
router.get('/ping', async (req, res) => {
  res.json({ ok: true, db: 'supabase' });
});

// Dashboard Stats
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const stats = await getStats(req.userId);
    res.json(stats);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error in /api/stats:', err);
    }
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// List tasks with aggregated info
router.get('/tasks', authenticateUser, async (req, res) => {
  try {
    const tasks = await getAllTasks(req.userId);
    res.json(tasks);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    res.status(400).json({ error: error.message });
  }
});

// Get task detail + sessions
router.get('/tasks/:id', authenticateUser, async (req, res) => {
  try {
    const taskDetail = await getTaskById(req.params.id, req.userId);
    res.json(taskDetail);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    res.status(404).json({ error: 'not found' });
  }
});

// Create task
router.post('/tasks', authenticateUser, async (req, res) => {
  try {
    const task = await createTask(req.body, req.userId);
    res.status(201).json(task);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    res.status(400).json({ error: error.message });
  }
});

// Update task
router.put('/tasks/:id', authenticateUser, async (req, res) => {
  try {
    const task = await updateTask(req.params.id, req.body, req.userId);
    res.json(task);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete task
router.delete('/tasks/:id', authenticateUser, async (req, res) => {
  try {
    await deleteTask(req.params.id, req.userId);
    res.json({ ok: true });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    res.status(400).json({ error: error.message });
  }
});

// Create session for task
router.post('/tasks/:id/sessions', authenticateUser, async (req, res) => {
  try {
    const result = await createSession(req.params.id, req.body, req.userId);
    res.json(result);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    res.status(400).json({ error: error.message });
  }
});

// Update session
router.put('/tasks/:taskId/sessions/:sessionId', authenticateUser, async (req, res) => {
  try {
    const session = await updateSession(req.params.taskId, req.params.sessionId, req.body, req.userId);
    res.json(session);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete session
router.delete('/tasks/:taskId/sessions/:sessionId', authenticateUser, async (req, res) => {
  try {
    await deleteSession(req.params.sessionId, req.userId);
    res.json({ ok: true });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    res.status(400).json({ error: error.message });
  }
});

// Get task history
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const history = await getHistory(req.userId);
    res.json(history);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    res.status(500).json({ error: 'Failed to fetch history data' });
  }
});

// Start a running task
router.post('/tasks/:id/start', authenticateUser, async (req, res) => {
  try {
    const result = await startRunningTask(req.params.id, req.userId);
    res.json(result);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    res.status(400).json({ error: error.message });
  }
});

// Stop a running task
router.post('/tasks/:id/stop', authenticateUser, async (req, res) => {
  try {
    const result = await stopRunningTask(req.params.id, req.userId);
    res.json(result);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    res.status(400).json({ error: error.message });
  }
});

// Get running tasks for the user
router.get('/running-tasks', authenticateUser, async (req, res) => {
  try {
    const runningTasks = await getRunningTasks(req.userId);
    res.json(runningTasks);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    res.status(500).json({ error: 'Failed to fetch running tasks' });
  }
});

module.exports = router;
