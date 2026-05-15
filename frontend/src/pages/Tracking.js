import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../api';

const statusSteps = ['PENDING','CONFIRMED','PREPARING','READY','PICKED_UP','DELIVERED'];
const statusEmoji = {
  PENDING: '⏳', CONFIRMED: '✅', PREPARING: '👨‍🍳',
  READY: '📦', PICKED_UP: '🛵', DELIVERED: '🎉', CANCELLED: '❌'
};

function Tracking() {
  const { id } = useParams();
  const [order, setOrder]   = useState(null);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial order data
    API.get(`/orders/${id}`)
      .then(res => {
        setOrder(res.data.order);
        setStatus(res.data.order.status);
      })
      .finally(() => setLoading(false));

    // Connect WebSocket and watch this order
    const socket = io('food-delivery-app1-production.up.railway.app');
    socket.emit('watch:order', id);

    // Listen for live updates
    socket.on('order:status:updated', (data) => {
      setStatus(data.status);
      setMessage(data.message);
    });

    // Cleanup on page leave
    return () => socket.disconnect();
  }, [id]);

  const currentStep = statusSteps.indexOf(status);

  if (loading) return <p style={{ marginTop: '40px' }}>Loading order...</p>;
  if (!order)  return <p style={{ marginTop: '40px' }}>Order not found.</p>;

  return (
    <div style={{ maxWidth: '600px', margin: '30px auto' }}>
      <h2>🗺️ Tracking Order #{id}</h2>

      {/* Status Progress Bar */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          {statusSteps.map((step, index) => (
            <div key={step} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: index <= currentStep ? '#e23744' : '#ddd',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto', fontSize: '16px'
              }}>
                {statusEmoji[step]}
              </div>
              <p style={{ fontSize: '10px', marginTop: '4px', color: index <= currentStep ? '#e23744' : '#999' }}>
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Message */}
      {message && (
        <div className="card" style={{ borderLeft: '4px solid #e23744', marginTop: '16px' }}>
          <p style={{ fontSize: '18px' }}>{message}</p>
        </div>
      )}

      {/* Order Details */}
      <div className="card" style={{ marginTop: '16px' }}>
        <h3>Order Details</h3>
        <p style={{ color: '#666', margin: '8px 0' }}>📍 {order.delivery_address}</p>
        <p style={{ color: '#666', margin: '8px 0' }}>🍴 {order.restaurant_name}</p>
        <hr style={{ margin: '12px 0' }} />
        {order.items.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}>
            <span>{item.name} x{item.quantity}</span>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <hr style={{ margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px' }}>
          <span>Total</span>
          <span>₹{order.total_amount}</span>
        </div>
      </div>
    </div>
  );
}

export default Tracking;