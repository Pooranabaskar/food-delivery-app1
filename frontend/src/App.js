import React from 'react';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Menu from './pages/Menu';
import MyOrders from './pages/MyOrders';
import Tracking from './pages/Tracking';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  //const isLoggedIn = !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/menu/:id"    element={<Menu />} />
          <Route path="/my-orders"   element={<MyOrders />} />
          <Route path="/track/:id"   element={<Tracking />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;