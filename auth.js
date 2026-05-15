const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const router = express.Router();

// ── ROUTE 1: Register a new user ──
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    // 2. Check if email already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // 3. Encrypt the password
    // 10 = "salt rounds" (how hard to crack — higher = safer but slower)
    const password_hash = await bcrypt.hash(password, 10);

    // 4. Save user to database
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, password_hash]
    );

    const user = result.rows[0];

    // 5. Create a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,  // Send token to frontend
      user
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ROUTE 2: Login ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // 2. Find user by email
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
        // Note: don't say "email not found" — security risk!
      });
    }

    const user = result.rows[0];

    // 3. Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 4. Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;