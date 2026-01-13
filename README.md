# ⏰ Time Tracker Application

A full-stack time tracking and task management application with user authentication, built using Node.js/Express.js backend with Supabase database and vanilla JavaScript frontend.

## 🚀 Features

- **Task Management**: Create, edit, and delete tasks with titles and descriptions
- **Time Tracking**: Start and stop timers for individual tasks with live updates
- **Session Management**: Track multiple sessions per task with start/end times and durations
- **User Authentication**: Secure registration and login functionality with user management
- **Statistics Dashboard**: View daily and weekly statistics including total tasks and duration
- **History Task Section**: View task completion history organized by creation date
- **Dark/Light Theme**: Toggle between themes with persistent preference
- **Responsive UI**: Clean, modern interface optimized for productivity

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Deployment**: Vercel (Backend), GitHub Pages (Frontend)

## 📋 Prerequisites

- Node.js installed
- Supabase project with database tables created
- Supabase Auth enabled for user authentication

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd time-tracker
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Supabase configuration
```

### 3. Database Setup

Create the required database tables in your Supabase project:

```sql
-- Tasks table
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id)
);

-- Task sessions table
CREATE TABLE task_sessions (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Profiles table for user information
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  nama_lengkap TEXT NOT NULL,
  alamat TEXT,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);
```

### 4. Environment Configuration

Configure your `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3000
NODE_ENV=development

# API Base URL (for frontend to connect to backend)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 5. Run the Application

```bash
# Navigate to backend directory and start the server
cd backend
npm start
```

The application will be available at `http://localhost:3000`

## 🔐 Authentication System

The application includes a comprehensive authentication system:

### Registration
- User fields: email, nama_lengkap, alamat, username, password
- Validation: Email format validation, password strength requirements
- Security: Passwords are securely hashed using Supabase Auth

### Login
- Credentials: Accepts email or username with password
- Session Management: Secure session handling with JWT tokens

### API Endpoints for Authentication

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | `{ email, nama_lengkap, alamat, username, password }` |
| POST | `/auth/login` | Authenticate user | `{ email_or_username, password }` |
| POST | `/auth/logout` | End user session | - |
| GET | `/auth/me` | Get current user profile | - (requires authentication) |
| PUT | `/auth/profile` | Update user profile | `{ nama_lengkap, alamat, username }` |

## 🌐 API Endpoints

### Task Management Endpoints

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/api/ping` | Health check | - |
| GET | `/api/stats` | Dashboard statistics | - |
| GET | `/api/tasks` | List all tasks with aggregated info | - |
| POST | `/api/tasks` | Create new task | `{ title, description }` |
| GET | `/api/tasks/:id` | Get task detail with sessions | - |
| PUT | `/api/tasks/:id` | Update task | `{ title, description }` |
| DELETE | `/api/tasks/:id` | Delete task | - |
| POST | `/api/tasks/:id/sessions` | Add session to task | `{ start_time, end_time }` (ISO) |
| PUT | `/api/tasks/:taskId/sessions/:sessionId` | Update session | `{ start_time, end_time }` |
| DELETE | `/api/tasks/:taskId/sessions/:sessionId` | Delete session | - |
| PUT | `/api/tasks/:id` | Update task (including status) | `{ title, description, status }` |
| GET | `/api/history` | Get task history organized by completion date | - |

## 🎨 Frontend Features

### Dashboard
- **Total Hari Ini**: Shows the total accumulated time worked today
- **Total Keseluruhan**: Shows the total accumulated time across all tasks
- **Task Running**: Count of currently active timers
- **Total Task in Week**: Number of tasks completed this week

### Task Management
- Create new tasks with title and description
- Edit existing tasks
- Delete tasks (and all associated sessions)
- Mark tasks as completed/incomplete
- Tasks are organized into "Active Tasks" and "Completed Tasks" sections

### Time Tracking
- Start/Stop timers for individual tasks
- Dynamic button visibility: When a task is running, the "Start" button is hidden and replaced with a "Stop" button
- Live timer display with real-time updates
- Session history with start/end times and duration

### History Task Section
- **Date-based Organization**: Tasks are grouped by creation date
- **Today's Label**: Current day shows as "Hari Ini" (Today in Indonesian)
- **Date Formatting**: Previous days show in "DD MMM YYYY" format
- **Progress Indicators**: Each date group shows progress in "X/Y" format

## ☁️ Deploying to Vercel

### Prerequisites
- A Vercel account
- The Vercel CLI installed (`npm i -g vercel`)

### Deployment Steps

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Set Environment Variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## 🧪 Testing

### Running Unit Tests

To run the existing unit tests:

```bash
cd backend
node test/secondsToString.test.js
```

This will run the unit tests for the `secondsToString` function and display the results.

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use Error
If you encounter `listen EADDRINUSE: address already in use ::1:3000`:
```bash
# Identify the process using port 3000
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill <PID>

# Or use a different port
PORT=3001 npm start
```

#### Registration Error: "Unexpected token '<'"
Common causes and solutions:
1. Ensure the backend server is running
2. Verify your Supabase configuration in `.env` file
3. Check that the `profiles` table exists in your Supabase database
4. Look at server console for specific error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Known Issues & Future Enhancements

- Export functionality for reports (CSV/PDF)
- Daily/weekly summary charts
- Idle detection to improve accuracy
- Task tagging and categorization
- More advanced filtering and search capabilities

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.