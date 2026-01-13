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

// Specific routes for static files to ensure they work in Vercel environment
app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.js'));
});

// Specific routes for HTML pages to ensure they work in Vercel environment
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// Root route to serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all route for other HTML pages - serve index.html for client-side routing
app.get('*', (req, res) => {
  // Check if the requested path corresponds to a static file
  const requestedPath = req.path;
  if (requestedPath.endsWith('.html')) {
    const filePath = path.join(__dirname, requestedPath);
    // Send the specific HTML file if it exists
    res.sendFile(filePath);
  } else {
    // For any other route that doesn't match static assets, serve index.html
    // This enables client-side routing for SPA behavior
    res.sendFile(path.join(__dirname, 'index.html'));
  }
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

    // Set Content Security Policy headers to allow necessary resources
    // Allow inline scripts and unsafe-eval for development compatibility
    // In production, you might want to be more restrictive
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-scripts.com https://*.vercel-insights.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://*.supabase.co https://*.supabase.in; " +
      "frame-src 'self' https://vercel.live https://*.vercel.live; " +
      "object-src 'none';"
    );

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
