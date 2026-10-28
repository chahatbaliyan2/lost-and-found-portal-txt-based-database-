import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function OrgRegister() {
  const [form, setForm] = useState({
    name: '', type: 'college', email: '', password: '', phone: '',
    description: '', address: '', city: '', district: '', state: '', pincode: '', website: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/org/register', form);
      setSuccess(res.data.message);
      setTimeout(() => navigate('/org/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  }

  return (
    <div className="page auth-page wide">
      <h2>Register Your Organization</h2>
      <p className="hint">
        College, University, Hospital, Company or any other organization can register here.
        A good description and full location help members and visitors find you in search.
        An account activates only after super-admin approval.
      </p>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-section-title">Basic Info</div>
        <div className="form-grid-2">
          <input placeholder="Organization Name" value={form.name} onChange={set('name')} required />
          <select value={form.type} onChange={set('type')}>
            <option value="college">College</option>
            <option value="university">University</option>
            <option value="hospital">Hospital</option>
            <option value="company">Company</option>
            <option value="other">Other</option>
          </select>
        </div>
        <textarea
          placeholder="Short description - what is this organization, who is it for? (shown in search results)"
          rows={3}
          value={form.description}
          onChange={set('description')}
        />

        <div className="form-section-title">Location</div>
        <input placeholder="Full Address" value={form.address} onChange={set('address')} />
        <div className="form-grid-2">
          <input placeholder="City" value={form.city} onChange={set('city')} />
          <input placeholder="District" value={form.district} onChange={set('district')} />
        </div>
        <div className="form-grid-2">
          <input placeholder="State" value={form.state} onChange={set('state')} />
          <input placeholder="Pincode" value={form.pincode} onChange={set('pincode')} />
        </div>

        <div className="form-section-title">Contact & Login</div>
        <div className="form-grid-2">
          <input type="email" placeholder="Official Email" value={form.email} onChange={set('email')} required />
          <input placeholder="Phone" value={form.phone} onChange={set('phone')} />
        </div>
        <input placeholder="Website (optional)" value={form.website} onChange={set('website')} />
        <input type="password" placeholder="Password" value={form.password} onChange={set('password')} required />

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit" className="btn btn-primary">Register Organization</button>
      </form>
      <p>Already registered? <Link to="/org/login">Login here</Link></p>
    </div>
  );
}
