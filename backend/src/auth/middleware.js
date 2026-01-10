const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Authentication middleware
async function authenticateUser(req, res, next) {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For backward compatibility, if no token is provided, 
    // we'll proceed without user-specific filtering
    req.userId = null;
    return next();
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Verify the token using Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: Invalid token' 
      });
    }
    
    req.userId = data.user.id;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Token verification failed' 
    });
  }
}

module.exports = {
  authenticateUser
};
