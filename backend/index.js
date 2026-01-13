// Vercel-compatible serverless function
// This creates a unified API handler for Vercel deployment
require('dotenv').config();
const express = require('express');
const path = require('path');

// Create an Express app
const app = express();
app.use(express.json());

// Import authentication routes and middleware
const authRoutes = require('./src/auth/routes');
const { authenticateUser } = require('./src/middleware/auth');

// Import task routes
const taskRoutes = require('./src/tasks/routes');

// Mount authentication routes BEFORE static middleware to prevent conflicts
app.use('/auth', authRoutes);

// Mount task routes (includes all API endpoints)
app.use('/api', taskRoutes);

// Serve static files from the current directory (where frontend files are copied)
// This should come AFTER all API and auth routes to prevent conflicts
app.use(express.static(__dirname));

// Root route to serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Specific routes for static files to ensure they work in Vercel environment
app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.js'));
});

// For local development, start the server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || 'localhost';
  const NODE_ENV = process.env.NODE_ENV || 'development';

  app.listen(PORT, HOST, () => {
    const baseUrl = NODE_ENV === 'production'
      ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://${HOST}:${PORT}`)
      : `http://${HOST}:${PORT}`;

    console.log(`✅ Server running on port ${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`API Base URL: ${baseUrl}`);
    console.log('Press Ctrl+C to stop the server');
  });
} else {
  // For Vercel serverless functions, we need to export a handler
  module.exports = (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Route the request to the Express app
    app(req, res);
  };
}

// Export the app for local development compatibility
module.exports.app = app;
