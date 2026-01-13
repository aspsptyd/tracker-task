const { createClient } = require('@supabase/supabase-js');
const { secondsToString } = require('../utils/format');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key for full access
let supabase;
try {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Missing Supabase configuration!');
      console.error('Please check your .env file for:');
      console.error('- NEXT_PUBLIC_SUPABASE_URL');
      console.error('- SUPABASE_SERVICE_ROLE_KEY');
      console.error('');
    }
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Supabase configuration loaded');
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error initializing Supabase client:', error.message);
  }
  supabase = null;
}

// Get all tasks with aggregated info
async function getAllTasks(userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  // Build query based on whether user is authenticated
  let query = supabase
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

  // Add user filter if authenticated
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: tasks, error } = await query;

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    throw new Error(error.message);
  }

  // For each task, get aggregated session data
  const tasksWithAggregates = await Promise.all(tasks.map(async (task) => {
    // Build session query with user filter if authenticated
    let sessionQuery = supabase
      .from('task_sessions')
      .select('duration, start_time, end_time')
      .eq('task_id', task.id);

    // Add user filter if authenticated
    if (userId) {
      sessionQuery = sessionQuery.eq('user_id', userId);
    }

    const { data: sessions, error: sessionError } = await sessionQuery;

    if (sessionError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(sessionError);
      }
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

  return tasksWithAggregates;
}

// Get a single task with its sessions
async function getTaskById(id, userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  // Build task query with user filter if authenticated
  let taskQuery = supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  // Add user filter if authenticated
  if (userId) {
    taskQuery = taskQuery.eq('user_id', userId);
  }

  const { data: task, error: taskError } = await taskQuery;

  if (taskError) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(taskError);
    }
    throw new Error('not found');
  }

  // Build session query with user filter if authenticated
  let sessionQuery = supabase
    .from('task_sessions')
    .select('*')
    .eq('task_id', id)
    .order('start_time', { ascending: true });

  // Add user filter if authenticated
  if (userId) {
    sessionQuery = sessionQuery.eq('user_id', userId);
  }

  const { data: sessions, error: sessionError } = await sessionQuery;

  if (sessionError) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(sessionError);
    }
    throw new Error(sessionError.message);
  }

  return { task, sessions };
}

// Create a new task
async function createTask(taskData, userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  const { title, description } = taskData;
  if (!title) throw new Error('title required');

  // Prepare the insert data with user_id if authenticated
  const insertData = {
    title,
    description: description || null
  };

  // Add user_id if the user is authenticated
  if (userId) {
    insertData.user_id = userId;
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    throw new Error(error.message);
  }

  return data;
}

// Update a task
async function updateTask(id, taskData, userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  const { title, description, status } = taskData;
  if (!title) throw new Error('title required');

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

  // Build update query with user filter if authenticated
  let updateQuery = supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  // Add user filter if authenticated
  if (userId) {
    updateQuery = updateQuery.eq('user_id', userId);
  }

  const { data, error } = await updateQuery;

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    throw new Error(error.message);
  }

  return data;
}

// Delete a task
async function deleteTask(id, userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  // Build delete query with user filter if authenticated
  let deleteQuery = supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  // Add user filter if authenticated
  if (userId) {
    deleteQuery = deleteQuery.eq('user_id', userId);
  }

  const { error } = await deleteQuery;

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    throw new Error(error.message);
  }

  return { ok: true };
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
