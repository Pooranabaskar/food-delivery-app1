const express = require('express');
const db = require('./db');
const { protect } = require('./middleware');

const router = express.Router();

// ── ROUTE 1: Get menu of a restaurant ──
// Public — anyone can see the menu
router.get('/restaurants/:id/menu', async (req, res) => {
  try {
    const { id } = req.params;

    // Check restaurant exists
    const restaurant = await db.query(
      'SELECT * FROM restaurants WHERE id = $1', [id]
    );
    if (restaurant.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Get menu items
    const menu = await db.query(
      `SELECT * FROM menu_items
       WHERE restaurant_id = $1
       AND is_available = true
       ORDER BY is_veg DESC, price ASC`,
      [id]
    );

    res.json({
      success: true,
      restaurant: restaurant.rows[0].name,
      count: menu.rows.length,
      menu: menu.rows
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ROUTE 2: Place an order ──
// Protected — must be logged in
router.post('/orders', protect, async (req, res) => {
  // Start a database transaction
  // Transaction = "do ALL of this, or do NONE of it"
  console.log(req.body);
  const client = await db.connect();

  try {
    const { restaurant_id, items, delivery_address } = req.body;
    const customer_id = req.user.userId; // From JWT token

    // ── Validate input ──
    if (!restaurant_id || !items || !delivery_address) {
      return res.status(400).json({
        success: false,
        message: 'restaurant_id, items and delivery_address are required'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items must be a non-empty array'
      });
    }

    // ── Check restaurant exists and is open ──
    const restaurant = await client.query(
      'SELECT * FROM restaurants WHERE id = $1', [restaurant_id]
    );
    if (restaurant.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // ── Begin transaction ──
    await client.query('BEGIN');

    // ── Calculate total & validate items ──
    let total_amount = 0;
    const validatedItems = [];

    for (let item of items) {
      // Check each menu item exists and belongs to this restaurant
      const menuItem = await client.query(
        `SELECT * FROM menu_items
         WHERE id = $1
         AND restaurant_id = $2
         AND is_available = true`,
        [item.menu_item_id, restaurant_id]
      );

      if (menuItem.rows.length === 0) {
        await client.query('ROLLBACK'); // Undo everything
        return res.status(400).json({
          success: false,
          message: `Menu item ${item.menu_item_id} not found or unavailable`
        });
      }

      const menuData = menuItem.rows[0];
      const quantity = item.quantity || 1;

      // Use price from DATABASE (not from user request — security!)
      total_amount += menuData.price * quantity;

      validatedItems.push({
        menu_item_id: menuData.id,
        name: menuData.name,      // Snapshot name
        price: menuData.price,    // Snapshot price
        quantity
      });
    }

    // ── Create the order ──
    const orderResult = await client.query(
      `INSERT INTO orders
         (customer_id, restaurant_id, total_amount, delivery_address, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING *`,
      [customer_id, restaurant_id, total_amount, delivery_address]
    );

    const order = orderResult.rows[0];

    // ── Save each order item ──
    for (let item of validatedItems) {
      await client.query(
        `INSERT INTO order_items
           (order_id, menu_item_id, name, price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.menu_item_id, item.name, item.price, item.quantity]
      );
    }

    // ── Commit transaction (save everything) ──
    await client.query('COMMIT');

    // ── Return full order details ──
    res.status(201).json({
      success: true,
      message: '🎉 Order placed successfully!',
      order: {
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        delivery_address: order.delivery_address,
        placed_at: order.placed_at,
        restaurant: restaurant.rows[0].name,
        items: validatedItems
      }
    });

  } catch (err) {
    await client.query('ROLLBACK'); // Undo on any error
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release(); // Always release connection back to pool
  }
});

// ── ROUTE 3: Get MY orders ──
// Protected — users see only their own orders
router.get('/orders/my', protect, async (req, res) => {
  try {
    const customer_id = req.user.userId;

    const orders = await db.query(
      `SELECT
         o.id,
         o.status,
         o.total_amount,
         o.delivery_address,
         o.placed_at,
         r.name AS restaurant_name
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.customer_id = $1
       ORDER BY o.placed_at DESC`,
      [customer_id]
    );

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.rows.map(async (order) => {
        const items = await db.query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [order.id]
        );
        return { ...order, items: items.rows };
      })
    );

    res.json({
      success: true,
      count: ordersWithItems.length,
      orders: ordersWithItems
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ROUTE 4: Track one order ──
router.get('/orders/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const customer_id = req.user.userId;

    const result = await db.query(
      `SELECT
         o.*,
         r.name AS restaurant_name
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.id = $1 AND o.customer_id = $2`,
      [id, customer_id]
      // customer_id check = you can only see YOUR order!
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = result.rows[0];

    // Get order items
    const items = await db.query(
      'SELECT * FROM order_items WHERE order_id = $1', [id]
    );

    res.json({
      success: true,
      order: {
        ...order,
        items: items.rows
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;