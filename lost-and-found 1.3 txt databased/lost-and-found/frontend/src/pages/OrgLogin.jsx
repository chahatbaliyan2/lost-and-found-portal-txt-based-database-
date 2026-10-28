import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function OrgLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/org/login', form);
      login(res.data.token, 'org', res.data.organization);
      navigate('/org/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    }
  }

  return (
    <div className="page auth-page">
      <h2>Organization Login</h2>
      <form onSubmit={handleSubmit} className="form">
        <input type="email" placeholder="Official Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
      <p>New organization? <Link to="/org/register">Register here</Link></p>
    </div>
  );
}
