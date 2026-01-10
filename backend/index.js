// Vercel-compatible serverless function
// This creates a unified API handler for Vercel deployment
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key for full access
let supabase;
try {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase configuration!');
    console.error('Please check your .env file for:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    console.error('');
  } else {
    console.log('✅ Supabase configuration loaded');
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
} catch (error) {
  console.error('❌ Error initializing Supabase client:', error.message);
  supabase = null;
}

function secondsToString(sec) {
  if (!sec) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

const path = require('path');

// Create an Express app
const app = express();
app.use(express.json());

// Serve static files from the current directory (where frontend files are copied)
app.use(express.static(__dirname));

// Root route to serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Specific routes for static files to ensure they work in Vercel environment
app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.js'));
});


// Define all API routes
app.get('/api/ping', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ ok: false, error: 'Database connection unavailable' });
  }
  res.json({ ok: true, db: 'supabase' });
});

// Dashboard Stats
app.get('/api/stats', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection unavailable' });
  }

  try {
    // 1. Total Task Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: todayTasks, error: todayTasksError } = await supabase
      .from('task_sessions')
      .select(`
        count:task_id,
        total_duration:sum(duration)
      `)
      .join('tasks', 'task_sessions.task_id', 'tasks.id')
      .gte('task_sessions.start_time', todayStart.toISOString())
      .lte('task_sessions.start_time', todayEnd.toISOString());

    if (todayTasksError) throw todayTasksError;

    // 3. Total Task in Week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    const { data: weekTasks, error: weekTasksError } = await supabase
      .from('task_sessions')
      .select('count:task_id')
      .join('tasks', 'task_sessions.task_id', 'tasks.id')
      .gte('task_sessions.start_time', weekStart.toISOString());

    if (weekTasksError) throw weekTasksError;

    res.json({
      today: {
        count: todayTasks[0]?.count || 0,
        duration: parseInt(todayTasks[0]?.total_duration || 0),
        duration_readable: secondsToString(parseInt(todayTasks[0]?.total_duration || 0))
      },
      week: {
        count: weekTasks[0]?.count || 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Create task
app.post('/api/tasks', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection unavailable' });
  }

  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ title, description: description || null }])
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

// Create session for task
app.post('/api/tasks/:id/sessions', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection unavailable' });
  }

  const taskId = req.params.id;
  const { start_time, end_time } = req.body;
  if (!start_time || !end_time) return res.status(400).json({ error: 'start_time and end_time required (ISO string)' });

  const start = new Date(start_time);
  const end = new Date(end_time);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ error: 'invalid date format' });

  const durationSec = Math.max(0, Math.floor((end - start) / 1000));

  const { error } = await supabase
    .from('task_sessions')
    .insert([{
      task_id: parseInt(taskId),
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration: durationSec
    }]);

  if (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.json({ ok: true, duration: durationSec });
});

// List tasks with aggregated info
app.get('/api/tasks', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection unavailable' });
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      status,
      created_at,
      completed_at
    `)
    .order('status', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  // For each task, get aggregated session data
  const tasksWithAggregates = await Promise.all(tasks.map(async (task) => {
    const { data: sessions, error: sessionError } = await supabase
      .from('task_sessions')
      .select('duration, start_time, end_time')
      .eq('task_id', task.id);

    if (sessionError) {
      console.error(sessionError);
      return { ...task, total_duration: 0, total_duration_readable: secondsToString(0), first_start: null, last_end: null, sessions_count: 0 };
    }

    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
    const firstStart = sessions.length > 0 ? new Date(Math.min(...sessions.map(s => new Date(s.start_time)))) : null;
    const lastEnd = sessions.length > 0 ? new Date(Math.max(...sessions.map(s => new Date(s.end_time)))) : null;

    return {
      ...task,
      total_duration: totalDuration,
      total_duration_readable: secondsToString(totalDuration),
      first_start: firstStart ? firstStart.toISOString() : null,
      last_end: lastEnd ? lastEnd.toISOString() : null,
      sessions_count: sessions.length
    };
  }));

  res.json(tasksWithAggregates);
});

// Get task detail + sessions
app.get('/api/tasks/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection unavailable' });
  }

  const id = req.params.id;

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (taskError) {
    console.error(taskError);
    return res.status(404).json({ error: 'not found' });
  }

  const { data: sessions, error: sessionError } = await supabase
    .from('task_sessions')
    .select('*')
    .eq('task_id', id)
    .order('start_time', { ascending: true });

  if (sessionError) {
    console.error(sessionError);
    return res.status(400).json({ error: sessionError.message });
  }

  res.json({ task, sessions });
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection unavailable' });
  }

  const id = req.params.id;
  const { title, description, status } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const updateData = {
    title,
    description: description || null
  };

  if (status) {
    updateData.status = status;
    // Set completed_at when status is 'completed', otherwise set to NULL
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection unavailable' });
  }

  const id = req.params.id;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.json({ ok: true });
});

// Update session (handles both time updates and keterangan updates)
app.put('/api/tasks/:taskId/sessions/:sessionId', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection unavailable' });
  }

  const { taskId, sessionId } = req.params;
  const { start_time, end_time, keterangan } = req.body;

  // Get current session data to use for validation if only keterangan is being updated
  const { data: currentSession, error: currentSessionError } = await supabase
    .from('task_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('task_id', taskId)
    .single();

  if (currentSessionError || !currentSession) {
    return res.status(404).json({ error: 'session not found' });
  }

  // Prepare update data
  const updateData = {};

  // Handle start_time and end_time updates (only if both are provided)
  if (start_time && end_time) {
    const start = new Date(start_time);
    const end = new Date(end_time);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ error: 'invalid date format' });
    const durationSec = Math.max(0, Math.floor((end - start) / 1000));

    updateData.start_time = start.toISOString();
    updateData.end_time = end.toISOString();
    updateData.duration = durationSec;
  } else if (start_time || end_time) {
    // If only one of start_time or end_time is provided, return an error
    return res.status(400).json({ error: 'both start_time and end_time required when updating time' });
  }

  // Add keterangan to update if provided
  if (typeof keterangan !== 'undefined') {
    updateData.keterangan = keterangan || null;
  }

  // If no fields to update, return an error
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'no fields to update' });
  }

  const { data, error } = await supabase
    .from('task_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .eq('task_id', taskId)
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

// Delete session
app.delete('/api/tasks/:taskId/sessions/:sessionId', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection unavailable' });
  }

  const { sessionId } = req.params;

  const { error } = await supabase
    .from('task_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  res.json({ ok: true });
});

// Get task history by date
app.get('/api/history', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection unavailable' });
  }

  try {
    // Get all tasks with their sessions
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        completed_at
      `)
      .order('created_at', { ascending: false });

    if (tasksError) throw tasksError;

    // Get all sessions to join with tasks
    const { data: allSessions, error: sessionsError } = await supabase
      .from('task_sessions')
      .select('task_id, duration');

    if (sessionsError) throw sessionsError;

    // Calculate total duration for each task
    const tasksWithDuration = allTasks.map(task => {
      const taskSessions = allSessions.filter(session => session.task_id === task.id);
      const totalDuration = taskSessions.reduce((sum, session) => sum + session.duration, 0);

      return {
        ...task,
        total_duration: totalDuration
      };
    });

    // Group tasks by creation date
    const tasksByCreationDate = {};
    tasksWithDuration.forEach(task => {
      const creationDate = new Date(task.created_at).toISOString().split('T')[0];
      if (!tasksByCreationDate[creationDate]) {
        tasksByCreationDate[creationDate] = [];
      }
      tasksByCreationDate[creationDate].push(task);
    });

    // Get completed tasks grouped by creation date
    const completedTasksByCreationDate = {};
    tasksWithDuration
      .filter(task => task.status === 'completed' && task.completed_at)
      .forEach(task => {
        const creationDate = new Date(task.created_at).toISOString().split('T')[0];
        if (!completedTasksByCreationDate[creationDate]) {
          completedTasksByCreationDate[creationDate] = [];
        }
        completedTasksByCreationDate[creationDate].push(task);
      });

    // Format the response with date labels and progress
    const historyData = [];
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const options = { day: 'numeric', month: 'short', year: 'numeric' };

    // Process dates that have completed tasks
    for (const creationDate in completedTasksByCreationDate) {
      const allTasksForDate = tasksByCreationDate[creationDate] || [];
      const totalTasksOnDate = allTasksForDate.length;

      const completedTasksForDate = completedTasksByCreationDate[creationDate] || [];
      const completedTasksCount = completedTasksForDate.length;

      // Format date label
      let dateLabel;
      if (creationDate === today) {
        dateLabel = "Hari Ini";
      } else {
        // Convert date string to proper date object for formatting
        const dateObj = new Date(creationDate + 'T00:00:00'); // Add time to ensure proper parsing
        dateLabel = dateObj.toLocaleDateString('id-ID', options);
      }

      historyData.push({
        date: creationDate,
        dateLabel: dateLabel,
        progress: `${completedTasksCount}/${totalTasksOnDate}`,
        tasks: completedTasksForDate  // Only completed tasks for this date
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

// For local development, start the server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || 'localhost';
  const NODE_ENV = process.env.NODE_ENV || 'development';

  app.listen(PORT, HOST, () => {
    const baseUrl = NODE_ENV === 'production'
      ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://${HOST}:${PORT}`)
      : `http://${HOST}:${PORT}`;

    console.log(`✅ Server running on port ${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`API Base URL: ${baseUrl}`);
    console.log('Press Ctrl+C to stop the server');
  });
} else {
  // For Vercel serverless functions, we need to export a handler
  module.exports = (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Route the request to the Express app
    app(req, res);
  };
}

// Export the app for local development compatibility
module.exports.app = app;