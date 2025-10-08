import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../authentication/user.js';
import { Sequelize } from 'sequelize';

const router = express.Router();

// @route   POST api/auth/signup
// @desc    Register a user (Staff accounts)
// @access  Private (Role 3 - Account Manager only)
router.post('/signup', async (req, res) => {
  // Check for authentication token
  const token = req.header('x-auth-token');
  
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  
  try {
    // Verify token and check role
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Only role 3 (Account Manager) can create accounts
    if (decoded.user.role !== 3) {
      return res.status(403).json({ msg: 'Access denied. Only account managers can create staff accounts.' });
    }
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
  
  const { name, username, email, phone, address, password } = req.body;

  try {
    let user = await User.findOne({
      where: {
        [Sequelize.Op.or]: [{ username: username }, { email: email }]
      }
    });

    if (user) {
      return res.status(400).json({ msg: 'User with that username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      name,
      username,
      email,
      phone,
      address,
      password: hashedPassword,
    });

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Signup error:', err);
    
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const errors = err.errors.map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Note: The login form uses 'username', but the model uses 'email'. Adjusting here.
    let user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Signup error:', err);
    
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const errors = err.errors.map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/auth/me
// @desc    Get authenticated user's profile
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // The auth middleware should add the user ID to the request
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the database
      const user = await User.findByPk(decoded.user.id, {
        attributes: { exclude: ['password'] } // Exclude password from the response
      });

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      res.json(user);
    } catch (err) {
      res.status(401).json({ msg: 'Token is not valid' });
    }
  } catch (err) {
    console.error('Server Error:', err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
