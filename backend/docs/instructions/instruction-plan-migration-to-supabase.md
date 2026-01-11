# Migration Plan: MySQL to Supabase

## Overview
This document outlines the plan for migrating the current MySQL database to Supabase, which is built on PostgreSQL. This migration will provide enhanced features like real-time subscriptions, authentication, and a user-friendly dashboard.

## Prerequisites
- Active Supabase account
- Supabase project created
- Database connection details (URL, API keys)
- Local MySQL dump of current data

## Step-by-Step Migration Process

### 1. Database Schema Conversion
- Convert MySQL schema to PostgreSQL-compatible syntax
- Map MySQL data types to PostgreSQL equivalents:
  - \`INT AUTO_INCREMENT\` → \`SERIAL\` or \`BIGSERIAL\`
  - \`DATETIME\` → \`TIMESTAMP WITH TIME ZONE\`
  - \`TEXT\` → \`TEXT\`
  - \`VARCHAR(255)\` → \`VARCHAR(255)\`
  - \`ENUM\` → \`ENUM\` or \`TEXT CHECK constraint\`
- Update foreign key constraints and indexes

### 2. Update Application Code
- Replace MySQL-specific queries with PostgreSQL-compatible ones
- Update connection pooling configuration
- Modify date/time functions (MySQL \`DATE()\` becomes PostgreSQL \`DATE()\`)
- Adjust any MySQL-specific functions to PostgreSQL equivalents

### 3. Environment Configuration
- Update \`.env\` file with your Supabase project details:
  \`\`\`
  NEXT_PUBLIC_SUPABASE_URL=https://rtpgsabublodclwrmgxb.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  \`\`\`
- To get your keys:
  1. Go to your Supabase dashboard at https://supabase.com/dashboard/project/rtpgsabublodclwrmgxb/settings/api
  2. Find the "Project API Keys" section
  3. Use the "anon" key as your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  4. Use the "service_role" key as your `SUPABASE_SERVICE_ROLE_KEY`
- Note: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is typically used for client-side operations, while `SUPABASE_SERVICE_ROLE_KEY` is for server-side operations with full privileges
- Replace MySQL connection variables with Supabase equivalents

### 4. Database Migration Script
Create a migration script to transfer data from MySQL to Supabase:
- Export current MySQL data as JSON or CSV
- Transform data to match new schema if needed
- Insert data into Supabase tables

### 5. Testing Strategy
- Test all CRUD operations with Supabase
- Verify real-time functionality if implemented
- Ensure all API endpoints work correctly
- Validate data integrity after migration

### 6. Deployment Steps
- Set up Supabase tables and relationships
- Run migration script to populate data
- Update production environment variables
- Deploy updated application code
- Monitor for any issues post-migration

## Required Information for Execution

To execute this migration, I would need:

1. **Supabase Project Details**:
   - Project URL
   - API keys (anon and service_role)
   - Database connection string

2. **Current Database Access**:
   - MySQL dump of current database
   - Understanding of current schema structure

3. **Application Code Access**:
   - Permission to modify database connection code
   - Ability to update environment variables

4. **Testing Environment**:
   - Staging environment to test migration
   - Backup of current data before migration

## Supabase Connection and Configuration Process

### 1. Get Your Supabase API Keys
Since you already have a Supabase project at https://rtpgsabublodclwrmgxb.supabase.co, follow these steps to get your API keys:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rtpgsabublodclwrmgxb
2. Navigate to **Settings** → **API** in the left sidebar
3. Under "Project API Keys", you'll find:
   - **anon (Public)**: Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side operations
   - **service_role (Secret)**: Use as `SUPABASE_SERVICE_ROLE_KEY` for server-side operations
4. Copy both keys for the next steps

### 2. Install Supabase Client Library
```bash
npm install @supabase/supabase-js
```

### 3. Initialize Supabase Client
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 4. Configure Database Tables
For your Time Tracker application, you'll need to create the following tables in Supabase:

#### Create Tables via SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/rtpgsabublodclwrmgxb
2. Navigate to **Database** → **SQL Editor**
3. Run the following SQL commands:

##### Tasks Table
```sql
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

##### Task Sessions Table
```sql
CREATE TABLE task_sessions (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Environment Variables Setup
Create or update your `.env` file with your specific project details:
```
NEXT_PUBLIC_SUPABASE_URL=https://rtpgsabublodclwrmgxb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-copied-anon-key-from-dashboard
SUPABASE_SERVICE_ROLE_KEY=your-copied-service-role-key-from-dashboard
```

### 6. Database Connection Code
Replace your current MySQL connection code with Supabase client initialization:

```javascript
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for server-side operations
);
```

### 7. Query Migration Examples
Convert your MySQL queries to Supabase queries:

**MySQL:**
```javascript
const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
```

**Supabase:**
```javascript
const { data: tasks, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('id', id);

if (error) throw error;
```

### 8. Testing Your Connection
After setting up the environment variables and installing the library, test your connection:

```javascript
// Test connection by inserting a sample task
const { data, error } = await supabase
  .from('tasks')
  .insert([
    { title: 'Test Task', description: 'This is a test task' }
  ]);

if (error) {
  console.error('Error inserting test task:', error);
} else {
  console.log('Test task inserted successfully:', data);
}
```

### 9. Authentication (Optional)
If you want to use Supabase Auth for user management:
```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'email@example.com',
  password: 'password',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'email@example.com',
  password: 'password',
});
```

### 10. RLS (Row Level Security) - Optional
If you want to enable Row Level Security for multi-user support:
1. Go to your Supabase Dashboard → Database → Tables
2. Enable RLS on your tables
3. Create policies to control access
```sql
-- Example policy to allow users to only see their own data
CREATE POLICY "Allow logged-in user access" ON tasks
FOR ALL USING (auth.uid() = id);
```

## Benefits of Migration to Supabase

- **Real-time capabilities**: Built-in real-time subscriptions
- **Authentication**: Integrated user authentication system
- **Dashboard**: Visual database management
- **Scalability**: Automatic scaling features
- **PostgreSQL**: More robust and feature-rich database engine
- **Edge Functions**: Serverless functions running close to users
- **Storage**: Integrated file storage solution

## Potential Challenges

- **SQL Syntax Differences**: Minor differences between MySQL and PostgreSQL
- **Data Type Mapping**: Ensuring compatibility between MySQL and PostgreSQL types
- **Connection Handling**: Different connection pooling strategies
- **Migration Downtime**: Planning for minimal service disruption
