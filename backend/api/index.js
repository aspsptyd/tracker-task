// Vercel API route handler
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

// Create an Express app
const app = express();

// Enable CORS for all routes
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

app.use(express.json());

try {
  // Import authentication routes
  const authRoutes = require('../src/auth/routes');

  // Import task routes
  const taskRoutes = require('../src/tasks/routes');

  // Mount authentication routes BEFORE static middleware to prevent conflicts
  app.use('/auth', authRoutes);

  // Mount task routes (includes all API endpoints)
  app.use('/api', taskRoutes);
} catch (error) {
  console.error('Error importing routes:', error.message);
  // If routes fail to import, we'll skip mounting them but still serve static files
}

// Serve static files from the current directory (where frontend files are copied)
// This should come AFTER all API and auth routes to prevent conflicts
app.use(express.static(path.join(__dirname, '..')));

// Specific routes for static files to ensure they work in Vercel environment
app.get('/style.css', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', 'style.css'));
  } catch (error) {
    res.status(500).send('Error serving CSS file');
  }
});

app.get('/app.js', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', 'app.js'));
  } catch (error) {
    res.status(500).send('Error serving JS file');
  }
});

// Specific routes for HTML pages to ensure they work in Vercel environment
app.get('/login.html', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
  } catch (error) {
    res.status(500).send('Error serving login page');
  }
});

app.get('/register.html', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', 'register.html'));
  } catch (error) {
    res.status(500).send('Error serving register page');
  }
});

// Root route to serve the main HTML file
app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  } catch (error) {
    res.status(500).send('Error serving main page');
  }
});

// Catch-all route for other HTML pages - serve index.html for client-side routing
app.get('*', (req, res) => {
  try {
    // Check if the requested path corresponds to a static file
    const requestedPath = req.path;
    if (requestedPath.endsWith('.html')) {
      const filePath = path.join(__dirname, '..', requestedPath);
      // Send the specific HTML file if it exists
      res.sendFile(filePath, (err) => {
        if (err) {
          // If the file doesn't exist, serve the main index.html
          res.sendFile(path.join(__dirname, '..', 'index.html'));
        }
      });
    } else {
      // For any other route that doesn't match static assets, serve index.html
      // This enables client-side routing for SPA behavior
      res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
  } catch (error) {
    res.status(500).send('Error serving page');
  }
});

// For Vercel serverless functions, we need to export a handler
module.exports = async (req, res) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Route the request to the Express app
  app(req, res);
};
