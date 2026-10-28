import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', description: '', category: 'lost', contactInfo: '' });
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notOwner, setNotOwner] = useState(false);

  useEffect(() => {
    api
      .get(`/items/${id}`)
      .then((res) => {
        const item = res.data;
        if (!item.contactVisible) {
          // contactVisible only tells us if logged in; owner check happens on submit too,
          // but if this item isn't editable by us the PUT will fail with 403 anyway.
        }
        setForm({
          title: item.title,
          description: item.description,
          category: item.category,
          contactInfo: item.contactInfo || '',
        });
        setExistingPhoto(item.photo);
      })
      .catch(() => setError('Item not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (newPhoto) data.append('photo', newPhoto);
      if (removePhoto && !newPhoto) data.append('removePhoto', 'true');

      await api.put(`/items/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/items/${id}`);
    } catch (err) {
      if (err.response?.status === 403) setNotOwner(true);
      setError(err.response?.data?.message || 'Could not update item.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="page">Loading...</p>;
  if (notOwner) return <p className="page error">You can only edit items you posted yourself.</p>;

  return (
    <div className="page auth-page">
      <Link to="/my-items">&larr; My Items</Link>
      <h2>Edit Item</h2>
      <form onSubmit={handleSubmit} className="form" encType="multipart/form-data">
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="lost">I Lost Something</option>
          <option value="found">I Found Something</option>
        </select>
        <input
          placeholder="Item title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <input
          placeholder="Contact info (phone / email)"
          value={form.contactInfo}
          onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
        />

        <div className="photo-edit-block">
          {existingPhoto && !removePhoto && !newPhoto && (
            <div className="current-photo">
              <img src={`/uploads/${existingPhoto}`} alt="Current" />
              <button type="button" className="btn-small btn-danger" onClick={() => setRemovePhoto(true)}>
                Remove Photo
              </button>
            </div>
          )}
          {removePhoto && !newPhoto && <p className="hint">Photo will be removed on save.</p>}
          <label className="file-label">
            {existingPhoto ? 'Replace photo (optional):' : 'Add a photo (optional):'}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setNewPhoto(e.target.files[0]);
                setRemovePhoto(false);
              }}
            />
          </label>
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
