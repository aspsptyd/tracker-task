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

// Start a task - add it to running_tasks table
async function startRunningTask(taskId, userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  try {
    // First, ensure this user doesn't already have a running task
    // If they do, stop it before starting the new one
    if (userId) {
      const { data: existingRunningTasks, error: existingTaskError } = await supabase
        .from('running_tasks')
        .select('id, task_id')
        .eq('user_id', userId);

      if (existingTaskError) {
        console.error('Error checking existing running tasks:', existingTaskError);
      } else if (existingRunningTasks && existingRunningTasks.length > 0) {
        // Stop all existing running tasks for this user (there should be only one, but just in case)
        for (const existingTask of existingRunningTasks) {
          await stopRunningTask(existingTask.task_id, userId);
        }
      }
    }

    // Insert the new running task
    const insertData = {
      task_id: parseInt(taskId),
      start_time: new Date().toISOString()
    };

    // Add user_id if the user is authenticated
    if (userId) {
      insertData.user_id = userId;
    }

    const { data, error } = await supabase
      .from('running_tasks')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation - task is already running for this user
        throw new Error('Task is already running');
      }
      throw error;
    }

    return data;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error starting running task:', err);
    }
    throw new Error(err.message || 'Failed to start running task');
  }
}

// Stop a running task - remove it from running_tasks table
async function stopRunningTask(taskId, userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  try {
    // Build delete query
    let deleteQuery = supabase
      .from('running_tasks')
      .delete()
      .eq('task_id', parseInt(taskId));

    // Add user filter if authenticated
    if (userId) {
      deleteQuery = deleteQuery.eq('user_id', userId);
    }

    const { error } = await deleteQuery;

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error stopping running task:', error);
      }
      throw new Error(error.message);
    }

    return { ok: true };
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error in stopRunningTask:', err);
    }
    throw new Error(err.message || 'Failed to stop running task');
  }
}

// Get count of running tasks for a user (or globally if no user specified)
async function getRunningTaskCount(userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  try {
    let query = supabase
      .from('running_tasks')
      .select('*', { count: 'exact', head: true });

    // Add user filter if authenticated
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { count, error } = await query;

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error getting running task count:', error);
      }
      throw new Error(error.message);
    }

    return count || 0;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error in getRunningTaskCount:', err);
    }
    throw new Error(err.message || 'Failed to get running task count');
  }
}

// Get all running tasks for a user (or all if no user specified)
async function getRunningTasks(userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  try {
    let query = supabase
      .from('running_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    // Add user filter if authenticated
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error getting running tasks:', error);
      }
      throw new Error(error.message);
    }

    // If we need task details, we'll fetch them separately
    const runningTasksWithDetails = [];
    for (const runningTask of data || []) {
      try {
        // Fetch task details separately
        let taskQuery = supabase
          .from('tasks')
          .select('title, description')
          .eq('id', runningTask.task_id)
          .single();

        if (userId) {
          taskQuery = taskQuery.eq('user_id', userId);
        }

        const { data: taskData, error: taskError } = await taskQuery;

        if (!taskError && taskData) {
          runningTasksWithDetails.push({
            ...runningTask,
            task_title: taskData.title,
            task_description: taskData.description
          });
        } else {
          runningTasksWithDetails.push({
            ...runningTask,
            task_title: 'Unknown Task',
            task_description: ''
          });
        }
      } catch (taskErr) {
        console.error('Error fetching task details:', taskErr);
        runningTasksWithDetails.push({
          ...runningTask,
          task_title: 'Unknown Task',
          task_description: ''
        });
      }
    }

    return runningTasksWithDetails;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error in getRunningTasks:', err);
    }
    throw new Error(err.message || 'Failed to get running tasks');
  }
}

module.exports = {
  startRunningTask,
  stopRunningTask,
  getRunningTaskCount,
  getRunningTasks
};
