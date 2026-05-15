import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    API.get('/orders/my')
      .then(res => setOrders(res.data.orders))
      .finally(() => setLoading(false));
  }, [navigate]);

  const statusColor = {
    PENDING: '#f39c12', CONFIRMED: '#3498db', PREPARING: '#9b59b6',
    READY: '#1abc9c', PICKED_UP: '#e67e22', DELIVERED: '#27ae60', CANCELLED: '#e74c3c'
  };

  if (loading) return <p style={{ marginTop: '40px' }}>Loading orders...</p>;

  return (
    <div>
      <h2 style={{ margin: '24px 0 16px' }}>📦 My Orders</h2>
      {orders.length === 0 && (
        <div className="card">
          <p>No orders yet! <span style={{ color: '#e23744', cursor: 'pointer' }}
            onClick={() => navigate('/')}>Order now →</span></p>
        </div>
      )}
      {orders.map(order => (
        <div key={order.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Order #{order.id} — {order.restaurant_name}</h3>
              <p style={{ color: '#666', margin: '4px 0' }}>
                {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
              </p>
              <p style={{ fontWeight: 'bold', marginTop: '6px' }}>₹{order.total_amount}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                background: statusColor[order.status] || '#999',
                color: 'white', padding: '4px 12px',
                borderRadius: '20px', fontSize: '13px'
              }}>
                {order.status}
              </span>
              <br />
              <button
                onClick={() => navigate(`/track/${order.id}`)}
                style={{ marginTop: '10px', padding: '6px 14px', fontSize: '13px' }}>
                Track →
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MyOrders;