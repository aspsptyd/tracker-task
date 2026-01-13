const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  logoutUser 
} = require('./controller');

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    const user = await registerUser(userData);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Registration error:', error); // Log the full error for debugging
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const credentials = req.body;
    const user = await loginUser(credentials);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user
    });
  } catch (error) {
    console.error('Login error:', error); // Log the full error for debugging
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    // In a real implementation, you would extract the user ID from the JWT token
    // For now, this is a placeholder - you'd need to implement proper authentication middleware
    const userId = req.headers['user-id']; // This is just a placeholder
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const profile = await getUserProfile(userId);
    res.status(200).json({ 
      success: true, 
      profile 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    // In a real implementation, you would extract the user ID from the JWT token
    // For now, this is a placeholder
    const userId = req.headers['user-id']; // This is just a placeholder
    const profileData = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const updatedProfile = await updateUserProfile(userId, profileData);
    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully', 
      profile: updatedProfile 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    const result = logoutUser();
    res.status(200).json({ 
      success: true, 
      message: 'Logout successful',
      ...result
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
