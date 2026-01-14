-- SQL script to add a running_tasks table to track currently running tasks globally
-- This will allow us to show the correct count of running tasks across all users

-- Create running_tasks table to track currently running tasks
CREATE TABLE IF NOT EXISTS running_tasks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one running task per user at a time
  UNIQUE(task_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_running_tasks_user_id ON running_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_running_tasks_task_id ON running_tasks(task_id);

-- Add RLS policy for running_tasks table
ALTER TABLE running_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for running_tasks table
CREATE POLICY "Users can view own running tasks" ON running_tasks
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own running tasks" ON running_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own running tasks" ON running_tasks
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own running tasks" ON running_tasks
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
