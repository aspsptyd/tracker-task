-- Add user_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add user_id column to task_sessions table
ALTER TABLE task_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing records to associate with a default user if needed (this would be for migration purposes)
-- In practice, you would need to handle existing data appropriately

-- Create indexes for better performance with user associations
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_task_sessions_user_id ON task_sessions(user_id);

-- Update RLS policies to enforce user-specific access
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks table
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policies for task_sessions table
CREATE POLICY "Users can view own task sessions" ON task_sessions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own task sessions" ON task_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own task sessions" ON task_sessions
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own task sessions" ON task_sessions
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
