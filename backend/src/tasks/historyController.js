const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
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

// Get task history by date
async function getHistory(userId = null) {
  if (!supabase) {
    throw new Error('Database connection unavailable');
  }

  try {
    // Build tasks query with user filter if authenticated
    let tasksQuery = supabase
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

    // Add user filter if authenticated
    if (userId) {
      tasksQuery = tasksQuery.eq('user_id', userId);
    }

    // Get all tasks with their sessions
    const { data: allTasks, error: tasksError } = await tasksQuery;

    if (tasksError) throw tasksError;

    // Build sessions query with user filter if authenticated
    let sessionsQuery = supabase
      .from('task_sessions')
      .select('task_id, duration');

    // Add user filter if authenticated
    if (userId) {
      sessionsQuery = sessionsQuery.eq('user_id', userId);
    }

    // Get all sessions to join with tasks
    const { data: allSessions, error: sessionsError } = await sessionsQuery;

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

    return historyData;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to fetch history data');
  }
}

module.exports = {
  getHistory
};
