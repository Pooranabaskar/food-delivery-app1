import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm]             = useState({ name: '', email: '', password: '' });
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const url  = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await API.post(url, body);

      // Save token and name
      localStorage.setItem('token',    res.data.token);
      localStorage.setItem('userName', res.data.user.name);

      navigate('/'); // Go to home page
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>
          {isRegister ? '📝 Create Account' : '🔐 Login'}
        </h2>

        {isRegister && (
          <input
            name="name" placeholder="Your name"
            value={form.name} onChange={handleChange}
          />
        )}
        <input
          name="email" placeholder="Email" type="email"
          value={form.email} onChange={handleChange}
        />
        <input
          name="password" placeholder="Password" type="password"
          value={form.password} onChange={handleChange}
        />

        {error && <p className="error">{error}</p>}

        <button onClick={handleSubmit} style={{ width: '100%', marginTop: '10px' }}>
          {loading ? 'Please wait...' : (isRegister ? 'Register' : 'Login')}
        </button>

        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{ color: '#e23744', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isRegister ? 'Login' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;