const jwt = require('jsonwebtoken');
require('dotenv').config();

function protect(req, res, next) {
  // 1. Get token from request header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  // Header format: "Bearer eyJhbGci..."

  // 2. No token = not logged in
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Please login to access this'
    });
  }

  // 3. Verify token is real and not expired
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next(); // Continue to the route
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.'
    });
  }
}

module.exports = { protect };