const { createClient } = require('@supabase/supabase-js');

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

// Create a session for a task
async function createSession(taskId, sessionData, userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  const { start_time, end_time } = sessionData;
  if (!start_time || !end_time) throw new Error('start_time and end_time required (ISO string)');

  const start = new Date(start_time);
  const end = new Date(end_time);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error('invalid date format');

  const durationSec = Math.max(0, Math.floor((end - start) / 1000));

  // Prepare the insert data with user_id if authenticated
  const insertData = {
    task_id: parseInt(taskId),
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    duration: durationSec
  };

  // Add user_id if the user is authenticated
  if (userId) {
    insertData.user_id = userId;
  }

  const { error } = await supabase
    .from('task_sessions')
    .insert([insertData]);

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
    throw new Error(error.message);
  }

  return { ok: true, duration: durationSec };
}

// Update a session (handles both time updates and keterangan updates)
async function updateSession(taskId, sessionId, sessionData, userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  // Build query to get current session data with user filter if authenticated
  let currentSessionQuery = supabase
    .from('task_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('task_id', taskId)
    .single();

  // Add user filter if authenticated
  if (userId) {
    currentSessionQuery = currentSessionQuery.eq('user_id', userId);
  }

  const { data: currentSession, error: currentSessionError } = await currentSessionQuery;

  if (currentSessionError || !currentSession) {
    throw new Error('session not found');
  }

  // Prepare update data
  const updateData = {};

  // Handle start_time and end_time updates (only if both are provided)
  if (sessionData.start_time && sessionData.end_time) {
    const start = new Date(sessionData.start_time);
    const end = new Date(sessionData.end_time);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error('invalid date format');
    const durationSec = Math.max(0, Math.floor((end - start) / 1000));

    updateData.start_time = start.toISOString();
    updateData.end_time = end.toISOString();
    updateData.duration = durationSec;
  } else if (sessionData.start_time || sessionData.end_time) {
    // If only one of start_time or end_time is provided, return an error
    throw new Error('both start_time and end_time required when updating time');
  }

  // Add keterangan to update if provided
  if (typeof sessionData.keterangan !== 'undefined') {
    updateData.keterangan = sessionData.keterangan || null;
  }

  // If no fields to update, return an error
  if (Object.keys(updateData).length === 0) {
    throw new Error('no fields to update');
  }

  // Build update query with user filter if authenticated
  let updateQuery = supabase
    .from('task_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .eq('task_id', taskId)
    .select()
    .single();

  // Add user filter if authenticated
  if (userId) {
    updateQuery = updateQuery.eq('user_id', userId);
  }

  const { data, error: updateError } = await updateQuery;

  if (updateError) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(updateError);
    }
    throw new Error(updateError.message);
  }

  return data;
}

// Delete a session
async function deleteSession(sessionId, userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  // Build delete query with user filter if authenticated
  let deleteQuery = supabase
    .from('task_sessions')
    .delete()
    .eq('id', sessionId);

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
  createSession,
  updateSession,
  deleteSession
};
