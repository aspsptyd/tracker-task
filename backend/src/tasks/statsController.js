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

// Get dashboard statistics
async function getStats(userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  try {
    // 1. Total Task Today - Calculate total accumulated time across ALL tasks for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Query for task sessions that occurred today by the current user
    let todayQuery = supabase
      .from('task_sessions')
      .select('task_id, duration, start_time')
      .gte('start_time', todayStart.toISOString())
      .lt('start_time', todayEnd.toISOString());

    const { data: todaySessions, error: todaySessionsError } = await todayQuery;

    if (todaySessionsError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error fetching today sessions:', todaySessionsError);
      }
      throw new Error('Failed to fetch today sessions');
    }

    // Filter by user if authenticated
    let filteredTodaySessions = todaySessions || [];

    if (userId && filteredTodaySessions.length > 0) {
      // If user is authenticated, we need to join with tasks to filter by user
      // Get the task_ids from today's sessions
      const taskIds = [...new Set(filteredTodaySessions.map(session => session.task_id))].filter(id => id !== undefined);

      if (taskIds.length > 0) {
        // Get tasks that belong to the current user
        const { data: userTasks, error: userTasksError } = await supabase
          .from('tasks')
          .select('id')
          .in('id', taskIds)
          .eq('user_id', userId);

        if (userTasksError) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching user tasks:', userTasksError);
          }
          throw new Error('Failed to fetch user tasks');
        }

        // Filter sessions to only include those belonging to user's tasks
        const userTaskIds = userTasks ? userTasks.map(task => task.id) : [];
        filteredTodaySessions = filteredTodaySessions.filter(session => userTaskIds.includes(session.task_id));
      } else {
        filteredTodaySessions = []; // No task IDs to check
      }
    }

    // Calculate total accumulated time for all tasks worked on today
    let todayTotalDuration = 0;
    if (filteredTodaySessions && filteredTodaySessions.length > 0) {
      todayTotalDuration = filteredTodaySessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    }

    // Also calculate total accumulated time across ALL tasks (not just today's)
    let allTasksQuery = supabase
      .from('task_sessions')
      .select('duration');

    // Add user filter if authenticated
    if (userId) {
      allTasksQuery = allTasksQuery.eq('user_id', userId);
    }

    const { data: allTaskSessions, error: allTasksError } = await allTasksQuery;

    if (allTasksError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error fetching all task sessions:', allTasksError);
      }
      throw new Error('Failed to fetch all task sessions');
    }

    let totalAccumulatedTime = 0;
    if (allTaskSessions && allTaskSessions.length > 0) {
      totalAccumulatedTime = allTaskSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    }

    // 2. Total Task in Week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    // Query for task sessions that occurred this week by the current user
    let weekQuery = supabase
      .from('task_sessions')
      .select('task_id, start_time')
      .gte('start_time', weekStart.toISOString());

    const { data: weekSessions, error: weekSessionsError } = await weekQuery;

    if (weekSessionsError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error fetching week sessions:', weekSessionsError);
      }
      throw new Error('Failed to fetch week sessions');
    }

    // Filter by user if authenticated
    let filteredWeekSessions = weekSessions || [];

    if (userId && filteredWeekSessions.length > 0) {
      // Get the task_ids from week's sessions
      const taskIds = [...new Set(filteredWeekSessions.map(session => session.task_id))].filter(id => id !== undefined);

      if (taskIds.length > 0) {
        // Get tasks that belong to the current user
        const { data: userTasks, error: userTasksError } = await supabase
          .from('tasks')
          .select('id')
          .in('id', taskIds)
          .eq('user_id', userId);

        if (userTasksError) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching user tasks for week:', userTasksError);
          }
          throw new Error('Failed to fetch user tasks for week');
        }

        // Filter sessions to only include those belonging to user's tasks
        const userTaskIds = userTasks ? userTasks.map(task => task.id) : [];
        filteredWeekSessions = filteredWeekSessions.filter(session => userTaskIds.includes(session.task_id));
      } else {
        filteredWeekSessions = []; // No task IDs to check
      }
    }

    // Count unique tasks that had sessions worked on this week
    let weekCount = 0;
    if (filteredWeekSessions && filteredWeekSessions.length > 0) {
      const uniqueWeekTaskIds = [...new Set(filteredWeekSessions.map(session => session.task_id))].filter(id => id !== undefined);
      weekCount = uniqueWeekTaskIds.length;
    }

    return {
      today: {
        count: filteredTodaySessions ? filteredTodaySessions.length : 0, // Number of sessions today
        duration: todayTotalDuration,
        duration_readable: secondsToString(todayTotalDuration),
        total_accumulated: totalAccumulatedTime, // Total time across all tasks
        total_accumulated_readable: secondsToString(totalAccumulatedTime)
      },
      week: {
        count: weekCount
      }
    };
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error in getStats:', err);
    }
    throw new Error('Failed to fetch stats');
  }
}

module.exports = {
  getStats
};
