import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function PostItem() {
  const [form, setForm] = useState({ title: '', description: '', category: 'lost', contactInfo: '' });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (photo) data.append('photo', photo);

      const res = await api.post('/items', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/items/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post item.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page auth-page">
      <h2>Post a Lost / Found Item</h2>
      <form onSubmit={handleSubmit} className="form" encType="multipart/form-data">
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="lost">I Lost Something</option>
          <option value="found">I Found Something</option>
        </select>
        <input
          placeholder="Item title (e.g. Black wallet, Blue umbrella)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Describe the item, where and when it was lost/found..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          required
        />
        <input
          placeholder="Contact info (phone / email) - shown only to logged-in users"
          value={form.contactInfo}
          onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
        />
        <label className="file-label">
          Photo (optional):
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
        </label>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post Item'}
        </button>
      </form>
    </div>
  );
}
