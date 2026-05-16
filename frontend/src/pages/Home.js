import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/restaurants')
      .then(res => setRestaurants(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ marginTop: '40px' }}>Loading restaurants...</p>;

  return (
    <div>
      console.log(restaurant_name);
      <h2 style={{ margin: '24px 0 16px' }}>🍽️ Restaurants Near You</h2>
      <div className="grid">
        {restaurants.map(r => (
          <div key={r.id} className="card" style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/menu/${r.id}`)}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🍴</div>
            <h3>{r.name}</h3>
            <p style={{ color: '#666', margin: '6px 0' }}>📍 {r.city}</p>
            <p style={{ color: '#f39c12', fontWeight: 'bold' }}>⭐ {r.rating}</p>
            <button style={{ marginTop: '12px', width: '100%' }}>
              View Menu →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;