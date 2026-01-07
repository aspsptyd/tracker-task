# Time Tracker - Split Architecture

This project has been restructured to separate backend and frontend concerns following a modular architecture approach.

## 🏗️ Project Structure

```
time-tracker/
├── backend/                 # Express.js server and database logic
│   ├── index.js            # Main server file
│   ├── src/                # Additional server modules
│   ├── .env               # Environment variables
│   ├── package.json       # Backend dependencies
│   └── *.sql             # Database setup files
├── frontend/              # Client-side application
│   ├── src/               # HTML, CSS, JavaScript files
│   │   ├── index.html    # Main HTML file
│   │   ├── app.js       # Client-side JavaScript
│   │   └── style.css   # Stylesheet
│   └── package.json    # Frontend dependencies
├── docs/                # Documentation files
│   └── instructions/   # Instruction files
└── README.md          # Project documentation
```

## 🚀 Features

- **Task Management**: Create, edit, and delete tasks with titles and descriptions
- **Time Tracking**: Start and stop timers for individual tasks
- **Session Management**: Track multiple sessions per task with start/end times
- **Statistics Dashboard**: View daily and weekly statistics including total tasks and duration
- **Detailed Task Views**: See all sessions for each task with duration breakdowns
- **Live Timers**: Real-time tracking with persistence in localStorage
- **Dark/Light Theme**: Toggle between themes with persistent preference
- **History Task Section**: View task completion history organized by date with progress indicators
- **Responsive UI**: Clean, modern interface optimized for productivity

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MySQL (with mysql2 driver)
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Styling**: Custom CSS with dark/light theme support

## 📋 Prerequisites

- Node.js installed
- MySQL server accessible

### For Network Database Access (Recommended)

This application is configured to connect to a remote MySQL server. To use this setup:

1. Ensure you're on the same network as the database server
2. Verify the database server is running and accessible
3. Default credentials:
   - host: `<DATABASE_HOST>`
   - user: `<DATABASE_USER>`
   - pass: `<DATABASE_PASSWORD>`
   - db: `<DATABASE_NAME>`

### For Local XAMPP Setup (Alternative)

If you want to run locally instead of connecting to the remote server:

1. Make sure XAMPP is installed and running
2. Start Apache and MySQL services in XAMPP Control Panel
3. Create the database using phpMyAdmin:
   - Open your browser and go to `http://localhost/phpmyadmin`
   - Click on the "SQL" tab
   - Copy and paste the SQL commands from `backend/setup_database.sql` file
   - Click "Go" to execute
4. Update your `backend/.env` file with local settings:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=  (empty if using default XAMPP)
   DB_NAME=time_tracker
   PORT=3000
   ```

## 🚀 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd time-tracker

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (optional, for development)
cd ../frontend
npm install
```

### 2. Database Setup

The server will auto-create the database `time_tracker` and tables `tasks` and `task_sessions` if they don't already exist.

### 3. Configure Environment Variables

Copy the `.env` file in the backend directory and configure your database settings:

```bash
cd backend
cp .env.example .env
# Edit .env with your database configuration
```

### 4. Run the Application

#### Backend Server (with frontend served statically)

**Important**: Navigate to the backend directory before running commands:

```bash
cd backend
npm start
```

Or run directly from the project root:

```bash
cd /Users/goodevaninja_mac1/Documents/Asep Septiadi/Portofolio/time-tracker/backend && npm start
```

The server will start on http://localhost:3000

#### Frontend Development Server (Separate)

For development purposes, you can run the frontend separately:

```bash
cd frontend
npm run dev
```

Or run directly from the project root:

```bash
cd /Users/goodevaninja_mac1/Documents/Asep Septiadi/Portofolio/time-tracker/frontend && npm run dev
```

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
| GET | `/api/history` | Get task history organized by completion date | - |

## 📊 Database Schema

### `tasks` table
- `id` - INT AUTO_INCREMENT PRIMARY KEY
- `title` - VARCHAR(255) NOT NULL
- `description` - TEXT
- `status` - ENUM('active', 'completed') DEFAULT 'active'
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `completed_at` - TIMESTAMP NULL

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

### History Task Section
- **Date-based Organization**: Tasks are grouped by completion date
- **Today's Label**: Current day shows as "Hari Ini" (Today in Indonesian)
- **Date Formatting**: Previous days show in "DD MMM YYYY" format (e.g., "6 Jan 2025")
- **Progress Indicators**: Each date group shows progress in "X/Y" format (X = completed tasks, Y = total tasks for that day)
- **Task Lists**: Shows completed tasks under their respective date groups
- **Automatic Updates**: History updates in real-time when tasks are completed or modified

### User Experience
- Clean, modern UI with card-based layout
- Dark/light theme toggle with persistent preference
- Responsive design for all screen sizes
- Intuitive navigation and controls
- Modal dialogs for task and session editing

## ⚙️ Environment Variables

You can override runtime configuration with environment variables when starting the app:

```bash
# For XAMPP users (most common setup):
cd backend
DB_HOST=localhost DB_USER=root DB_PASS= DB_NAME=time_tracker npm start

# example: run server on port 3001 with different DB settings
PORT=3001 DB_HOST=localhost DB_USER=root DB_PASS=<your_password> npm start
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port the Express server listens on | 3000 |
| `DB_HOST` | MySQL host | localhost |
| `DB_USER` | MySQL username | root |
| `DB_PASS` | MySQL password | (empty) |
| `DB_NAME` | MySQL database name | time_tracker |

## 🧪 Development

### Running Locally
For local development, you can run a local MySQL instance:

```bash
# Start MySQL locally (using Docker, XAMPP, or native installation)
# Then run the app with local DB settings
cd backend
DB_HOST=127.0.0.1 DB_USER=root DB_PASS=<your_local_password> npm start
```

### Cross-platform Notes
- The prefix style `VAR=val npm start` works on macOS/Linux
- On Windows PowerShell use:
```powershell
$env:PORT='3001'; cd backend; npm start
```
- Or use the `cross-env` package to make scripts cross-platform

## 📋 API Response Examples

### History Task Response (`GET /api/history`)
```json
[
  {
    "date": "2025-01-07",
    "dateLabel": "Hari Ini",
    "progress": "2/3",
    "tasks": [
      {
        "id": 1,
        "title": "Sample Task",
        "description": "This is a sample task to test the application",
        "status": "completed",
        "created_at": "2025-01-07T08:30:00.000Z",
        "completed_at": "2025-01-07T10:45:00.000Z",
        "total_duration": 7200
      }
    ]
  },
  {
    "date": "2025-01-06",
    "dateLabel": "6 Jan 2025",
    "progress": "5/7",
    "tasks": [
      {
        "id": 2,
        "title": "Another Task",
        "description": "Another task description",
        "status": "completed",
        "created_at": "2025-01-06T09:00:00.000Z",
        "completed_at": "2025-01-06T11:30:00.000Z",
        "total_duration": 5400
      }
    ]
  }
]
```

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

## 🐛 Known Issues & Future Enhancements

- Export functionality for reports (CSV/PDF)
- Daily/weekly summary charts
- Idle detection to improve accuracy
- Task tagging and categorization
- More advanced filtering and search capabilities