import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [orgs, setOrgs] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', orgId: '',
    bio: '', address: '', city: '', state: '',
  });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/items/organizations').then((res) => setOrgs(res.data));
  }, []);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.orgId) return setError('Please select your organization.');
    try {
      const res = await api.post('/auth/user/register', form);
      login(res.data.token, 'user', res.data.user);
      navigate('/organizations');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  }

  return (
    <div className="page auth-page">
      <h2>Create Your Account</h2>
      <form onSubmit={handleSubmit} className="form">
        <select value={form.orgId} onChange={set('orgId')} required>
          <option value="">-- Select your Organization --</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>{o.name} ({o.type})</option>
          ))}
        </select>
        <input placeholder="Full Name" value={form.name} onChange={set('name')} required />
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
        <input placeholder="Phone (optional)" value={form.phone} onChange={set('phone')} />
        <input type="password" placeholder="Password" value={form.password} onChange={set('password')} required />

        <div className="form-section-title">A little about you (optional)</div>
        <textarea placeholder="Short bio" rows={2} value={form.bio} onChange={set('bio')} />
        <input placeholder="Address" value={form.address} onChange={set('address')} />
        <div className="form-grid-2">
          <input placeholder="City" value={form.city} onChange={set('city')} />
          <input placeholder="State" value={form.state} onChange={set('state')} />
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary">Register</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
      <p className="hint">Don't see your organization listed? <Link to="/org/register">Register it here</Link> (needs admin approval first).</p>
    </div>
  );
}
