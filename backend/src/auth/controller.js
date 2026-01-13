const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize two Supabase clients: one for admin operations and one for auth operations
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate password strength
function isValidPassword(password) {
  // At least 8 characters, with at least one uppercase, one lowercase, and one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Register a new user
async function registerUser(userData) {
  const { email, nama_lengkap, alamat, username, password } = userData;

  // Validate input
  if (!email || !nama_lengkap || !username || !password) {
    throw new Error('All fields are required: email, nama_lengkap, username, password');
  }

  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  if (!isValidPassword(password)) {
    throw new Error('Password must be at least 8 characters with at least one uppercase, one lowercase, and one number');
  }

  // Check if user already exists in profiles table
  const { data: existingUserByEmail, error: emailError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUserByEmail && !emailError) {
    throw new Error('Email already registered');
  }

  // Check if username already exists
  const { data: existingUsername, error: usernameError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  if (existingUsername && !usernameError) {
    throw new Error('Username already taken');
  }

  try {
    // Create user with Supabase Auth using the admin API
    let userId;

    // First, try using the admin API if available
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
      });

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }

      userId = authData.user.id;
    } catch (adminError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Admin API registration failed:', adminError);
      }
      // If admin API is not available, we should provide a more specific error
      throw new Error(`Registration failed: ${adminError.message}. Ensure your Supabase SERVICE_ROLE_KEY has admin privileges.`);
    }

    // Insert profile data
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: userId,
        email,
        nama_lengkap,
        alamat: alamat || null, // Allow null for alamat
        username,
      }]);

    if (profileError) {
      // Clean up the auth user if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (cleanupError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to clean up user after profile creation failure:', cleanupError);
        }
      }
      throw new Error(`Profile creation error: ${profileError.message}`);
    }

    // Return user data without sensitive information
    return {
      id: userId,
      email,
      nama_lengkap,
      alamat,
      username,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Registration error:', error);
    }
    // Ensure we always throw an error with a message that can be returned to the client
    const errorMessage = error.message || 'Registration failed due to an unknown error';
    throw new Error(errorMessage);
  }
}

// Login user
async function loginUser(credentials) {
  const { email_or_username, password } = credentials;

  if (!email_or_username || !password) {
    throw new Error('Email/username and password are required');
  }

  // Determine if the input is an email or username
  const isEmail = isValidEmail(email_or_username);
  let userEmail = email_or_username;

  if (!isEmail) {
    // If it's not an email, treat it as username and get the corresponding email
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('username', email_or_username)
      .single();

    if (error || !profile) {
      throw new Error('Invalid credentials');
    }

    userEmail = profile.email;
  }

  // Attempt to sign in with Supabase Auth
  const { data: signInData, error } = await supabaseAuth.auth.signInWithPassword({
    email: userEmail,
    password: password,
  });

  if (error) {
    throw new Error('Invalid credentials');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', signInData.user.id)
    .single();

  if (profileError) {
    throw new Error('Profile retrieval error');
  }

  // Return user data along with the access token for authorization
  // The session object should contain the access token
  const session = signInData.session;
  return {
    id: signInData.user.id,
    email: signInData.user.email,
    nama_lengkap: profile.nama_lengkap,
    alamat: profile.alamat,
    username: profile.username,
    created_at: signInData.user.created_at,
    // Include the access token for authorization headers
    access_token: session?.access_token,
    refresh_token: session?.refresh_token
  };
}

// Get user profile by ID
async function getUserProfile(userId) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('User not found');
  }

  return profile;
}

// Update user profile
async function updateUserProfile(userId, profileData) {
  const { nama_lengkap, alamat, username } = profileData;

  // Check if username is being updated and if it's already taken by another user
  if (username) {
    const { data: existingUser, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', userId) // Exclude current user
      .single();

    if (existingUser && !error) {
      throw new Error('Username already taken');
    }
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      nama_lengkap: nama_lengkap || undefined,
      alamat: alamat || undefined,
      username: username || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Update error: ${error.message}`);
  }

  return data;
}

// Logout user (client-side operation, no server-side session to clear in Supabase Auth)
function logoutUser() {
  // In Supabase Auth, logout is typically handled client-side
  // This function can be extended to handle any server-side cleanup if needed
  return { success: true };
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser
};
