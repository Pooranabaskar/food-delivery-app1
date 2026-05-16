const express = require('express');
const http = require('http');        // Need this for WebSocket
const { Server } = require('socket.io');

const db = require('./db');
const authRoutes = require('./auth');
const orderRoutes = require('./orders');
const trackingRoutes = require('./tracking');
const { initSocket } = require('./socket');
const { protect } = require('./middleware');
require('dotenv').config();

const cors = require('cors');
require('dotenv').config();

const app = express();

// Configure CORS origin from environment variable
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Create HTTP server (WebSocket runs on same server)
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT']
  }
});

// Initialize WebSocket
initSocket(server);

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());
app.set('io', io);

// ── Routes ──
app.use('/auth', authRoutes);
app.use('/', orderRoutes);
app.use('/', trackingRoutes);

// ── Restaurant routes ──
app.get('/restaurants', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM restaurants ORDER BY rating DESC'
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM restaurants WHERE id = $1', [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/restaurants', protect, async (req, res) => {
  try {
    const { name, city, rating } = req.body;
    if (!name || !city) {
      return res.status(400).json({ success: false, message: 'Name and city are required' });
    }
    const result = await db.query(
      `INSERT INTO restaurants (name, city, rating) VALUES ($1, $2, $3) RETURNING *`,
      [name, city, rating || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/profile', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ── Start server ──
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🍕 Food Delivery API running on http://localhost:${PORT}`);
});