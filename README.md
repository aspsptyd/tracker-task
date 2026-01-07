# Time Tracker (Minimal Fullstack)

Run a minimal fullstack Time Tracking app (Express + MySQL + static frontend).

## 🎯 Overview

This is a comprehensive time tracking application designed to help users monitor and analyze their productivity. The application allows users to create tasks, track time spent on each task, and view detailed statistics about their work patterns.

## 🚀 Features

- **Task Management**: Create, edit, and delete tasks with titles and descriptions
- **Time Tracking**: Start and stop timers for individual tasks
- **Session Management**: Track multiple sessions per task with start/end times
- **Statistics Dashboard**: View daily and weekly statistics including total tasks and duration
- **Detailed Task Views**: See all sessions for each task with duration breakdowns
- **Live Timers**: Real-time tracking with persistence in localStorage
- **Dark/Light Theme**: Toggle between themes with persistent preference
- **Responsive UI**: Clean, modern interface optimized for productivity

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MySQL (with mysql2 driver)
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Styling**: Custom CSS with dark/light theme support

## 📋 Prerequisites

- Node.js installed
- MySQL server accessible (default: `10.21.124.45`)

Default DB credentials (can be overridden with env vars):
- host: `10.21.124.45`
- user: `root`
- pass: `!!&21adi`
- db: `time_tracker`

> Note: The remote DB host above may be inaccessible from your machine. For local development it's common to run a local MySQL instance and point `DB_HOST` to `127.0.0.1`.

### Database Schema Update
> If you're updating from a previous version, you'll need to manually add the status column to the tasks table:
> ```sql
> ALTER TABLE tasks ADD COLUMN status ENUM('active', 'completed') DEFAULT 'active';
> ```
>
> A SQL script is provided in `update_schema.sql` that you can run to update your database schema.

## 🚀 Installation & Setup

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Database Setup

The server will auto-create the database `time_tracker` and tables `tasks` and `task_sessions` if they don't already exist.

### 3. Run the Application

```bash
npm start
```

The server will start on http://localhost:3000

## 🌐 API Endpoints

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

## 📊 Database Schema

### `tasks` table
- `id` - INT AUTO_INCREMENT PRIMARY KEY
- `title` - VARCHAR(255) NOT NULL
- `description` - TEXT
- `status` - ENUM('active', 'completed') DEFAULT 'active'
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### `task_sessions` table
- `id` - INT AUTO_INCREMENT PRIMARY KEY
- `task_id` - INT NOT NULL (FK to tasks.id)
- `start_time` - DATETIME NOT NULL
- `end_time` - DATETIME NOT NULL
- `duration` - INT NOT NULL (in seconds)
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## 🎨 Frontend Features

### Dashboard
- **Total Task Today**: Number of tasks completed today and total duration
- **Task Running**: Count of currently active timers
- **Total Task in Week**: Number of tasks completed this week

### Task Management
- Create new tasks with title and description
- Edit existing tasks
- Delete tasks (and all associated sessions)
- Mark tasks as completed/incomplete with "Finish" and "Not Done" buttons
- View detailed information about each task
- Tasks are organized into "Active Tasks" and "Completed Tasks" sections

### Time Tracking
- Start/Stop timers for individual tasks
- Live timer display with real-time updates
- Session history with start/end times and duration
- Local storage persistence for active timers

### User Experience
- Clean, modern UI with card-based layout
- Dark/light theme toggle with persistent preference
- Responsive design for all screen sizes
- Intuitive navigation and controls
- Modal dialogs for task and session editing

## ⚙️ Environment Variables

You can override runtime configuration with environment variables when starting the app:

```bash
# example: run server on port 3001 and connect to local MySQL
PORT=3001 DB_HOST=127.0.0.1 DB_USER=root DB_PASS='!!&21adi' npm start
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port the Express server listens on | 3000 |
| `DB_HOST` | MySQL host | 10.21.124.45 |
| `DB_USER` | MySQL username | root |
| `DB_PASS` | MySQL password | !!&21adi |
| `DB_NAME` | MySQL database name | time_tracker |

## 🧪 Development

### Running Locally
For local development, you can run a local MySQL instance:

```bash
# Start MySQL locally (using Docker, XAMPP, or native installation)
# Then run the app with local DB settings
DB_HOST=127.0.0.1 DB_USER=root DB_PASS=your_local_password npm start
```

### Cross-platform Notes
- The prefix style `VAR=val npm start` works on macOS/Linux
- On Windows PowerShell use:
```powershell
$env:PORT='3001'; npm start
```
- Or use the `cross-env` package to make scripts cross-platform

## 📈 Time Blocking & Tracking Philosophy

This application implements a time blocking approach where:
- Each task can have multiple sessions (time blocks)
- Sessions are consolidated into a single task representation
- Detailed session history is available in task detail views
- Time tracking is precise with start/end time recording
- Statistics provide insights into productivity patterns

## 🔐 Security Notes

- Avoid committing secrets (passwords) into source control
- For production, use secure secret management
- The current implementation uses basic authentication with database credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Known Issues & Future Enhancements

- Export functionality for reports (CSV/PDF)
- Daily/weekly summary charts
- Idle detection to improve accuracy
- Task tagging and categorization
- More advanced filtering and search capabilities