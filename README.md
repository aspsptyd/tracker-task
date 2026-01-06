# Time Tracker (Minimal Fullstack)

Run a minimal fullstack Time Tracking app (Express + MySQL + static frontend).

Prereqs:
- Node.js installed
- Network access to MySQL host `10.21.124.45` (phpMyAdmin URL provided)

Default DB credentials (can be overridden with env vars):
- host: `10.21.124.45`
- user: `root`
- pass: `!!&21adi`
- db: `time_tracker`

Install & run:

```bash
npm install
npm start
```

The server will auto-create the database `time_tracker` and tables `tasks` and `task_sessions` if they don't already exist.

Open: http://localhost:3000

API endpoints (basic):
- `GET /api/tasks` - list tasks with aggregated info
- `POST /api/tasks` - create task { title, description }
- `POST /api/tasks/:id/sessions` - add session { start_time, end_time } (ISO)

Environment & Running
---------------------

You can override runtime configuration with environment variables when starting the app. Prefixing the start command with variables sets them for that single invocation:

```bash
# example: run server on port 3001 and connect to local MySQL
PORT=3001 DB_HOST=127.0.0.1 DB_USER=root DB_PASS='!!&21adi' npm start
```

What this does:
- `PORT`: HTTP port the Express server listens on (default 3000)
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`: MySQL connection used by the server

Difference vs plain `npm start`:
- `npm start` runs the `start` script in `package.json` (here: `node index.js`).
- When you prefix the command with `ENV=val`, those env vars are available to the process only for that command.
- Without the prefix, the process inherits environment values from your shell/session.

Cross-platform notes:
- The prefix style `VAR=val npm start` works on macOS/Linux. On Windows PowerShell use:

```powershell
$env:PORT='3001'; npm start
```

Or use the `cross-env` package to make scripts cross-platform.

Security note:
- Avoid committing secrets (passwords) into source control. For production, use secure secret management.

