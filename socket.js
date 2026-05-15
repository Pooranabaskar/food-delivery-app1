// This file manages all real-time connections

let io; // Will hold our Socket.io instance

function initSocket(server) {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for now
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    // Customer joins a room to watch their order
    // Room = private channel for one specific order
    socket.on('watch:order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`👀 Someone is watching order ${orderId}`);

      socket.emit('watching', {
        message: `You are now tracking order #${orderId}`,
        orderId
      });
    });

    // Customer stops watching
    socket.on('unwatch:order', (orderId) => {
      socket.leave(`order:${orderId}`);
      console.log(`👋 Someone stopped watching order ${orderId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });

  console.log('⚡ WebSocket server ready!');
  return io;
}

// Send status update to everyone watching an order
function notifyOrderUpdate(orderId, data) {
  if (io) {
    io.to(`order:${orderId}`).emit('order:updated', {
      orderId,
      ...data,
      timestamp: new Date().toISOString()
    });
    console.log(`📢 Notified order ${orderId}: ${data.status}`);
  }
}

module.exports = { initSocket, notifyOrderUpdate };