const express = require('express');
const db = require('./db');
const { protect } = require('./middleware');
const { notifyOrderUpdate } = require('./socket');

const router = express.Router();

// Order status flow:
// PENDING → CONFIRMED → PREPARING → READY → PICKED_UP → DELIVERED
const STATUS_FLOW = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'DELIVERED'
];

// Status messages shown to customer
const STATUS_MESSAGES = {
  PENDING:    '⏳ Waiting for restaurant to confirm...',
  CONFIRMED:  '✅ Restaurant confirmed your order!',
  PREPARING:  '👨‍🍳 Chef is preparing your food...',
  READY:      '📦 Food is packed and ready!',
  PICKED_UP:  '🛵 Delivery partner picked up your order!',
  DELIVERED:  '🎉 Order delivered! Enjoy your meal!'
};

// ── ROUTE 1: Update order status ──
// In real app: restaurant dashboard calls this
// For now: we call it manually to simulate
router.put('/orders/:id/status', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status is a valid value
    if (!STATUS_FLOW.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${STATUS_FLOW.join(', ')}`
      });
    }

    // Get current order
    const current = await db.query(
      'SELECT * FROM orders WHERE id = $1', [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const currentOrder = current.rows[0];
    const currentIndex = STATUS_FLOW.indexOf(currentOrder.status);
    const newIndex = STATUS_FLOW.indexOf(status);

    // Prevent going backwards
    // (can't go from DELIVERED back to PREPARING)
    if (newIndex < currentIndex) {
      return res.status(400).json({
        success: false,
        message: `Cannot go from ${currentOrder.status} back to ${status}`
      });
    }

    // Update status in database
    const updated = await db.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    const updatedOrder = updated.rows[0];

    // 🔴 REAL-TIME: Notify everyone watching this order
    notifyOrderUpdate(id, {
      status: updatedOrder.status,
      message: STATUS_MESSAGES[status],
      total_amount: updatedOrder.total_amount
    });

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ROUTE 2: Get order status ──
router.get('/orders/:id/status', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const customer_id = req.user.userId;

    const result = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.placed_at,
              r.name AS restaurant_name
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.id = $1 AND o.customer_id = $2`,
      [id, customer_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = result.rows[0];

    res.json({
      success: true,
      order: {
        ...order,
        message: STATUS_MESSAGES[order.status],
        next_status: STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1] || null
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;