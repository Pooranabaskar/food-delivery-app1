import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

function Menu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu]           = useState([]);
  const [restaurant, setRestaurant] = useState('');
  const [cart, setCart]           = useState([]);
  const [address, setAddress]     = useState('');
  const [message, setMessage]     = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    API.get(`/restaurants/${id}/menu`)
      .then(res => {
        setMenu(res.data.menu);
        setRestaurant(res.data.restaurant);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function addToCart(item) {
    setCart(prev => {
      const existing = prev.find(i => i.menu_item_id === item.id);
      if (existing) {
        return prev.map(i =>
          i.menu_item_id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }

  function getTotal() {
    return cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);
  }

  async function placeOrder() {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    if (cart.length === 0) { setMessage('Add items to cart first!'); return; }
    if (!address)          { setMessage('Enter delivery address!');   return; }

    try {
      const res = await API.post('/orders', {
        restaurant_id: parseInt(id),
        delivery_address: address,
        items: cart.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity }))
      });
      setMessage('🎉 Order placed!');
      setTimeout(() => navigate(`/track/${res.data.order.id}`), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error placing order');
    }
  }

  if (loading) return <p style={{ marginTop: '40px' }}>Loading menu...</p>;

  return (
    <div>
      <h2 style={{ margin: '24px 0 16px' }}>🍴 {restaurant}</h2>

      {/* Menu Items */}
      <div className="grid">
        {menu.map(item => (
          <div key={item.id} className="card">
            <span style={{ fontSize: '12px', background: item.is_veg ? '#27ae60' : '#e23744',
              color: 'white', padding: '2px 8px', borderRadius: '4px' }}>
              {item.is_veg ? '🌿 VEG' : '🍖 NON-VEG'}
            </span>
            <h3 style={{ margin: '10px 0 4px' }}>{item.name}</h3>
            <p style={{ color: '#e23744', fontWeight: 'bold', fontSize: '18px' }}>
              ₹{item.price}
            </p>
            <button onClick={() => addToCart(item)} style={{ marginTop: '10px', width: '100%' }}>
              + Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="card" style={{ marginTop: '30px', borderLeft: '4px solid #e23744' }}>
          <h3>🛒 Your Cart</h3>
          {cart.map(i => (
            <div key={i.menu_item_id} style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
              <span>{i.name} x{i.quantity}</span>
              <span>₹{(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <hr style={{ margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px' }}>
            <span>Total</span>
            <span>₹{getTotal()}</span>
          </div>
          <input
            placeholder="Enter delivery address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            style={{ marginTop: '12px' }}
          />
          {message && <p className={message.includes('🎉') ? 'success' : 'error'}>{message}</p>}
          <button onClick={placeOrder} style={{ width: '100%', marginTop: '10px', fontSize: '17px' }}>
            Place Order →
          </button>
        </div>
      )}
    </div>
  );
}

export default Menu;