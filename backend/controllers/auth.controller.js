const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, password, role } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    console.log('📝 Registration attempt:', { name, email, role });

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Registration failed: Email already exists');
      return res.status(409).json({ success: false, error: 'Email already registered.' });
    }

    // Only allow citizen/authority on self-registration; admin must be set manually
    const allowedRoles = ['citizen', 'authority'];
    const userRole = allowedRoles.includes(role) ? role : 'citizen';

    const user = await User.create({ name, email, password, role: userRole });
    const token = generateToken(user);

    console.log(`Registration successful: ${email} (normalized)`);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Register error DETAILS:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    console.log(`Login attempt: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`Login failed: User not found (${email})`);
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const isMatch = await user.comparePassword(password);
    console.log(`Password comparison for ${email}: ${isMatch ? 'MATCH' : 'MISMATCH'}`);

    if (!isMatch) {
      console.log(`Login failed: Password mismatch for ${email}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { register, login, getMe };
