import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate   = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const userName   = localStorage.getItem('userName');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/login');
  }

  return (
    <nav style={{
      background: '#e23744', padding: '15px 30px',
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', color: 'white'
    }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '22px', fontWeight: 'bold' }}>
        🍕 FoodApp
      </Link>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
        {isLoggedIn ? (
          <>
            <Link to="/my-orders" style={{ color: 'white', textDecoration: 'none' }}>My Orders</Link>
            <span>Hi, {userName}!</span>
            <button onClick={logout} style={{ background: 'white', color: '#e23744', padding: '6px 14px' }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;