# ⏰ Time Tracker - Split Architecture

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
- **Dynamic Button Visibility**: When a task is running, the "Start" button is hidden and replaced with a "Stop" button, and vice versa
- **Session Management**: Track multiple sessions per task with start/end times
- **Statistics Dashboard**: View daily and weekly statistics including total tasks and duration
- **Detailed Task Views**: See all sessions for each task with duration breakdowns
- **Live Timers**: Real-time tracking with persistence in localStorage
- **Dark/Light Theme**: Toggle between themes with persistent preference
- **History Task Section**: View task completion history organized by creation date with progress indicators, showing tasks under the date they were created regardless of when they were completed
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
- `keterangan` - TEXT NULL (session descriptions)
- `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## 🎨 Frontend Features

### Dashboard
- **Total Task Today**: Number of tasks completed today and total duration
- **Task Running**: Count of currently active timers
- **Total Task in Week**: Number of tasks completed this week

### Session Descriptions (Keterangan)
- **'+ Keterangan' Button**: Appears next to 'Edit' button in session detail popup
- **Description Dialog**: Separate dialog without closing main detail popup
- **Input Field**: Textarea for entering session descriptions
- **Action Buttons**: 'Batalkan' (Cancel) and 'Tambahkan' (Add) buttons
- **Visual Display**: Descriptions shown in silver text below session range
- **Persistent Storage**: Descriptions saved to database and retrieved on reload

### Task Management
- Create new tasks with title and description
- Edit existing tasks
- Delete tasks (and all associated sessions)
- Mark tasks as completed/incomplete with "Finish" and "Not Done" buttons
- View detailed information about each task
- Tasks are organized into "Active Tasks" and "Completed Tasks" sections
- **Text Wrapping**: Long task titles now properly wrap to multiple lines instead of being truncated
- **Improved Placeholder**: Changed placeholder text from "Task title" to "Mau ngerjain apa hari ini?" for better user experience
- **Improved Description Placeholder**: Changed placeholder text from "Description" to "Tambahkan keterangan / catatan" for better user experience
- **Enhanced Create Button**: Changed button text from "Create" to "Buat Task Sekarang" and added a pencil icon for better visual indication

### Time Tracking
- Start/Stop timers for individual tasks
- Dynamic button visibility: When a task is running, the "Start" button is hidden and replaced with a "Stop" button, and vice versa
- Live timer display with real-time updates
- Session history with start/end times and duration
- Local storage persistence for active timers

### History Task Section
- **Date-based Organization**: Tasks are grouped by completion date
- **Today's Label**: Current day shows as "Hari Ini" (Today in Indonesian)
- **Date Formatting**: Previous days show in "DD MMM YYYY" format (e.g., "6 Jan 2025")
- **Progress Indicators**: Each date group shows progress in "X/Y" format (X = completed tasks created on that date, Y = total tasks created on that date)
- **Task Lists**: Shows completed tasks under their respective date groups
- **Automatic Updates**: History updates in real-time when tasks are completed or modified
- **Accurate Counting**: Fixed logic to properly calculate completed vs total tasks per date, ensuring correct progress ratios (e.g., if 3 tasks were created on a date and all 3 were completed, it shows 3/3)

### User Experience
- Clean, modern UI with card-based layout
- Dark/light theme toggle with persistent preference
- Responsive design for all screen sizes
- Intuitive navigation and controls
- Modal dialogs for task and session editing

## ⚙️ Environment Variables

### .env File Template

Create a `.env` file in the `backend` directory with the following template:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=time_tracker

# Server Configuration
PORT=3000
```

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | localhost |
| `DB_USER` | MySQL username | root |
| `DB_PASS` | MySQL password | (empty) |
| `DB_NAME` | MySQL database name | time_tracker |
| `PORT` | HTTP port the Express server listens on | 3000 |

### Running with Environment Variables

You can override runtime configuration with environment variables when starting the app:

```bash
# For XAMPP users (most common setup):
cd backend
DB_HOST=localhost DB_USER=root DB_PASS= DB_NAME=time_tracker npm start

# example: run server on port 3001 with different DB settings
PORT=3001 DB_HOST=localhost DB_USER=root DB_PASS=<your_password> npm start
```

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
      },
      {
        "id": 3,
        "title": "Task Created Yesterday, Completed Today",
        "description": "This task was created on Jan 6 but completed on Jan 7",
        "status": "completed",
        "created_at": "2025-01-06T15:00:00.000Z",
        "completed_at": "2025-01-07T09:15:00.000Z",
        "total_duration": 3600
      }
    ]
  }
]
```

### History Task Features

- **Date-based Organization**: Tasks are grouped by creation date, regardless of when they were completed
- **Cross-date Completion**: Tasks created on one date but completed on another date appear under their creation date
- **Today's Label**: Current day shows as "Hari Ini" (Today in Indonesian)
- **Date Formatting**: Previous days show in "DD MMM YYYY" format (e.g., "6 Jan 2025")
- **Progress Indicators**: Each date group shows progress in "X/Y" format (X = completed tasks created on that date, Y = total tasks created on that date)
- **Task Lists**: Shows completed tasks under their respective date groups
- **Automatic Updates**: History updates in real-time when tasks are completed or modified
- **Accurate Counting**: Fixed logic to properly calculate completed vs total tasks per date, ensuring correct progress ratios

## 📈 Time Blocking & Tracking Philosophy

This application implements a time blocking approach where:
- Each task can have multiple sessions (time blocks)
- Sessions are consolidated into a single task representation
- Detailed session history is available in task detail views
- Time tracking is precise with start/end time recording
- Statistics provide insights into productivity patterns

## 📝 Session Descriptions (Keterangan)

New functionality added to enhance session tracking:
- Each session can have additional descriptions/keterangan
- '+ Keterangan' button allows adding descriptions to individual sessions
- Descriptions appear in silver text below the session time range
- Descriptions are stored in the database and persist between sessions
- Separate dialog with 'Batalkan' (Cancel) and 'Tambahkan' (Add) buttons

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

## 🧪 Testing

### Running Tests

To run the existing unit tests, navigate to the backend directory and execute the test file directly with Node.js:

```bash
cd backend
node test/secondsToString.test.js
```

This will run the unit tests for the `secondsToString` function and display the results in the console.

When you run the test, you should see output like this:

```
✓ should convert 0 seconds to "0s"
✓ should convert null to "0s"
✓ should convert undefined to "0s"
✓ should convert 30 seconds to "0h 0m 30s"
✓ should convert 65 seconds to "0h 1m 5s"
✓ should convert 3661 seconds to "1h 1m 1s"
✓ should convert 7200 seconds to "2h 0m 0s"
✓ should convert 3665 seconds to "1h 1m 5s"

Unit tests completed!
```

### Interpreting Test Results

- **✓** (checkmark) indicates that a test passed successfully
- **✗** (cross) would indicate that a test failed
- If a test fails, an error message will show what was expected vs. what was actually returned
- All tests passing means the `secondsToString` function is working correctly for the tested scenarios

### Unit Test Example

A unit test example has been created for the `secondsToString` function in the backend. The test file can be found at `backend/test/secondsToString.test.js`.

Here's an example of how to create unit tests for the `secondsToString` function in the backend:

```javascript
/**
 * Unit tests for the secondsToString function
 * This function converts seconds to a human-readable format (e.g., "1h 2m 3s")
 */

// Mock the secondsToString function implementation for testing
function secondsToString(sec) {
  if (!sec) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

// Simple test runner
function runTest(testName, testFunction) {
  try {
    testFunction();
    console.log(`✓ ${testName}`);
  } catch (error) {
    console.log(`✗ ${testName}: ${error.message}`);
  }
}

// Test cases
runTest('should convert 0 seconds to "0s"', () => {
  const result = secondsToString(0);
  if (result !== '0s') {
    throw new Error(`Expected "0s", got "${result}"`);
  }
});

runTest('should convert null to "0s"', () => {
  const result = secondsToString(null);
  if (result !== '0s') {
    throw new Error(`Expected "0s", got "${result}"`);
  }
});

runTest('should convert undefined to "0s"', () => {
  const result = secondsToString(undefined);
  if (result !== '0s') {
    throw new Error(`Expected "0s", got "${result}"`);
  }
});

runTest('should convert 30 seconds to "0h 0m 30s"', () => {
  const result = secondsToString(30);
  if (result !== '0h 0m 30s') {
    throw new Error(`Expected "0h 0m 30s", got "${result}"`);
  }
});

runTest('should convert 65 seconds to "0h 1m 5s"', () => {
  const result = secondsToString(65);
  if (result !== '0h 1m 5s') {
    throw new Error(`Expected "0h 1m 5s", got "${result}"`);
  }
});

runTest('should convert 3661 seconds to "1h 1m 1s"', () => {
  const result = secondsToString(3661);
  if (result !== '1h 1m 1s') {
    throw new Error(`Expected "1h 1m 1s", got "${result}"`);
  }
});

runTest('should convert 7200 seconds to "2h 0m 0s"', () => {
  const result = secondsToString(7200);
  if (result !== '2h 0m 0s') {
    throw new Error(`Expected "2h 0m 0s", got "${result}"`);
  }
});

runTest('should convert 3665 seconds to "1h 1m 5s"', () => {
  const result = secondsToString(3665);
  if (result !== '1h 1m 5s') {
    throw new Error(`Expected "1h 1m 5s", got "${result}"`);
  }
});

console.log('\nUnit tests completed!');
```

This example demonstrates how to test the `secondsToString` function with various inputs to ensure it behaves correctly. The function takes seconds as input and returns a human-readable string showing hours, minutes, and seconds.

The actual test file is located at `backend/test/secondsToString.test.js` and can be run with Node.js to validate the function's behavior.

### Adding More Tests

To add more unit tests to the project:

1. Create new test files in the `backend/test/` directory with the naming pattern `*.test.js`
2. Follow the same testing pattern shown in the example
3. Use the simple test runner function or integrate with a testing framework like Jest if preferred
4. Run tests individually with `node test/your-test-file.test.js`

For a more comprehensive testing setup, you can install and use Jest or other testing frameworks:

```bash
cd backend
npm install --save-dev jest
```

Then create a `package.json` with test scripts if one doesn't exist:

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest test/unit"
  }
}
```

## 🔄 Migration Plan: MySQL to Supabase

### Overview
This section outlines the plan for migrating the current MySQL database to Supabase, which is built on PostgreSQL. This migration will provide enhanced features like real-time subscriptions, authentication, and a user-friendly dashboard.

### Prerequisites
- Active Supabase account
- Supabase project created
- Database connection details (URL, API keys)
- Local MySQL dump of current data

### Step-by-Step Migration Process

#### 1. Database Schema Conversion
- Convert MySQL schema to PostgreSQL-compatible syntax
- Map MySQL data types to PostgreSQL equivalents:
  - `INT AUTO_INCREMENT` → `SERIAL` or `BIGSERIAL`
  - `DATETIME` → `TIMESTAMP WITH TIME ZONE`
  - `TEXT` → `TEXT`
  - `VARCHAR(255)` → `VARCHAR(255)`
  - `ENUM` → `ENUM` or `TEXT CHECK constraint`
- Update foreign key constraints and indexes

#### 2. Update Application Code
- Replace MySQL-specific queries with PostgreSQL-compatible ones
- Update connection pooling configuration
- Modify date/time functions (MySQL `DATE()` becomes PostgreSQL `DATE()`)
- Adjust any MySQL-specific functions to PostgreSQL equivalents

#### 3. Environment Configuration
- Update `.env` file with Supabase connection details:
  ```
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```
- Replace MySQL connection variables with Supabase equivalents

#### 4. Database Migration Script
Create a migration script to transfer data from MySQL to Supabase:
- Export current MySQL data as JSON or CSV
- Transform data to match new schema if needed
- Insert data into Supabase tables

#### 5. Testing Strategy
- Test all CRUD operations with Supabase
- Verify real-time functionality if implemented
- Ensure all API endpoints work correctly
- Validate data integrity after migration

#### 6. Deployment Steps
- Set up Supabase tables and relationships
- Run migration script to populate data
- Update production environment variables
- Deploy updated application code
- Monitor for any issues post-migration

### Required Information for Execution

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

### Benefits of Migration to Supabase

- **Real-time capabilities**: Built-in real-time subscriptions
- **Authentication**: Integrated user authentication system
- **Dashboard**: Visual database management
- **Scalability**: Automatic scaling features
- **PostgreSQL**: More robust and feature-rich database engine
- **Edge Functions**: Serverless functions running close to users
- **Storage**: Integrated file storage solution

### Potential Challenges

- **SQL Syntax Differences**: Minor differences between MySQL and PostgreSQL
- **Data Type Mapping**: Ensuring compatibility between MySQL and PostgreSQL types
- **Connection Handling**: Different connection pooling strategies
- **Migration Downtime**: Planning for minimal service disruption