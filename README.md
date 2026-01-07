# Time Tracker - Split Architecture

This project has been restructured to separate backend and frontend concerns.

## Structure

- \`backend/\` - Contains the Express.js server and database logic
- \`frontend/\` - Contains the static HTML, CSS, and JavaScript files

## Backend Setup

Navigate to the backend directory and install dependencies:

\`\`\`bash
cd backend
npm install
\`\`\`

## Frontend Setup

Navigate to the frontend directory and install dependencies:

\`\`\`bash
cd frontend
npm install
\`\`\`

## Running the Application

### Backend

\`\`\`bash
cd backend
npm start
\`\`\`

The backend will serve the frontend files statically.

### Frontend (Development)

For development purposes, you can run the frontend separately:

\`\`\`bash
cd frontend
npm run dev
\`\`\`
