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
- **Database**: Supabase (PostgreSQL)
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Styling**: Custom CSS with dark/light theme support

## 📋 Prerequisites

- Node.js installed
- Supabase project with database tables created

### Supabase Setup (Required)

This application is configured to connect to a Supabase project. To use this setup:

1. Ensure you have a Supabase account and project created
2. Create the required database tables in your Supabase SQL editor:
   ```sql
   -- Tasks table
   CREATE TABLE tasks (
     id BIGSERIAL PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     description TEXT,
     status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     completed_at TIMESTAMP WITH TIME ZONE
   );

   -- Task sessions table
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
3. Get your Supabase project URL and API keys from your Supabase dashboard

## 🚀 Installation & Setup

## 🌐 GitHub Pages Deployment

The frontend of this application is deployed to GitHub Pages. Once configured, it will be accessible at:

```
https://aspsptyd.github.io/tracker-task/
```

Note: The frontend needs to connect to a backend server to function properly. See the backend configuration section below.

## ☁️ Deploying Backend to Vercel

This application can be deployed to Vercel for the backend API services. Here's how to deploy:

### Prerequisites
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- The Vercel CLI installed (`npm i -g vercel`)
- Or deploy directly from the Vercel dashboard

### Deployment Steps

1. **Install Vercel CLI** (if deploying from terminal):
   ```bash
   npm i -g vercel
   ```

2. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```

   Follow the prompts to link your project to your Vercel account.

4. **Set Environment Variables** in the Vercel dashboard or during deployment:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

5. **Configure the deployment settings**:
   - Framework: None/Other (since we're using a custom Express setup)
   - Root directory: `/backend`

### Alternative: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your repository (or connect to GitHub)
4. Select the `backend` directory as the root
5. Set the build command to `npm install`
6. Set the output directory to `.` (current directory)
7. Add the required environment variables in the Settings → Environment Variables section

### Using the Deployed Backend

Once deployed, your backend will be accessible at:
```
https://your-project-name.vercel.app
```

Update your GitHub Pages deployment to use the new backend URL by setting the `BACKEND_API_URL` secret in your GitHub repository settings to your Vercel deployment URL.

## 🚀 Local Installation & Setup

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

You need to manually create the database tables in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to Database → SQL Editor
3. Run the following SQL commands to create the required tables:

```sql
-- Tasks table
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Task sessions table
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
- `id` - BIGSERIAL PRIMARY KEY (auto-incrementing)
- `title` - VARCHAR(255) NOT NULL
- `description` - TEXT
- `status` - TEXT DEFAULT 'active' with CHECK constraint ('active' or 'completed')
- `created_at` - TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `completed_at` - TIMESTAMP WITH TIME ZONE NULL

### `task_sessions` table
- `id` - BIGSERIAL PRIMARY KEY (auto-incrementing)
- `task_id` - BIGINT REFERENCES tasks(id) ON DELETE CASCADE
- `start_time` - TIMESTAMP WITH TIME ZONE NOT NULL
- `end_time` - TIMESTAMP WITH TIME ZONE NOT NULL
- `duration` - INTEGER NOT NULL (in seconds)
- `keterangan` - TEXT NULL (session descriptions)
- `created_at` - TIMESTAMP WITH TIME ZONE DEFAULT NOW()

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
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3000
```

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | (required) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for client-side operations | (required) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for server-side operations | (required) |
| `PORT` | HTTP port the Express server listens on | 3000 |

### Running with Environment Variables

You can override runtime configuration with environment variables when starting the app:

```bash
# Example: run server on port 3001 with different Supabase settings
PORT=3001 NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co npm start
```

## 🧪 Development

### Running Locally
For local development:

```bash
# Navigate to the backend directory and start the server
cd backend
npm start
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


## 🔄 Database Migration

For a detailed migration plan from MySQL to Supabase, see [docs/instruction-plan-migration-to-supabase.md](docs/instruction-plan-migration-to-supabase.md).

## ☁️ Vercel Deployment

The application has been successfully deployed to Vercel. Here's the current deployment status:

### Deployment Information
- **Production URL**: https://tracker-task-taupe.vercel.app
- **Status**: Fully operational with proper styling and Supabase connectivity
- **Last Updated**: January 10, 2026

### Deployment Configuration
The application is configured for deployment with the following settings:
- Static files (CSS, JS, HTML) are properly served
- API routes are accessible at `/api/*`
- Supabase database connection is active
- CORS headers are configured for cross-origin requests

### Known Issues & Solutions
- **Issue**: Previously, CSS and JavaScript files were not loading correctly due to routing conflicts in the Vercel serverless environment
- **Solution**: Added specific routes for static files to ensure proper content type delivery

### Redeployment Instructions
To redeploy the application after making changes:

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Verify the deployment** by checking that:
   - The homepage loads correctly
   - CSS styling is applied properly
   - API endpoints return data
   - Supabase connection is active

### Troubleshooting
If styling is not appearing after deployment:
1. Check that static file routes are properly configured
2. Verify that CSS and JS files return with correct content types (`text/css` and `application/javascript`)
3. Ensure the catch-all route doesn't interfere with static file serving
