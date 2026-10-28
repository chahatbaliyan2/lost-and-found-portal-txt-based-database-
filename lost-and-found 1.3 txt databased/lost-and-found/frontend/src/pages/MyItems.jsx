import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function MyItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api
      .get('/items/mine')
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load your items.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    await api.delete(`/items/${id}`);
    load();
  }

  async function handleResolve(id) {
    await api.put(`/items/${id}/resolve`);
    load();
  }

  return (
    <div className="page">
      <div className="page-header-row">
        <h2>My Items</h2>
        <Link to="/post-item" className="btn btn-primary">+ Post New Item</Link>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && items.length === 0 && (
        <p>You haven't posted anything yet. <Link to="/post-item">Post your first item</Link>.</p>
      )}

      <div className="my-items-list">
        {items.map((item) => (
          <div key={item.id} className="my-item-row">
            <div className="my-item-photo">
              {item.photo ? <img src={`/uploads/${item.photo}`} alt={item.title} /> : <div className="no-photo">No Photo</div>}
            </div>
            <div className="my-item-info">
              <span className={`badge ${item.category}`}>{item.category === 'lost' ? 'Lost' : 'Found'}</span>
              {item.status === 'resolved' && <span className="badge resolved">Resolved</span>}
              <h3><Link to={`/items/${item.id}`}>{item.title}</Link></h3>
              <p>{item.description.slice(0, 100)}{item.description.length > 100 ? '…' : ''}</p>
              <p className="meta">Posted {new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="my-item-actions">
              <Link to={`/items/${item.id}/edit`} className="btn-small btn-outline-small">Edit</Link>
              {item.status !== 'resolved' && (
                <button className="btn-small btn-success" onClick={() => handleResolve(item.id)}>Mark Resolved</button>
              )}
              <button className="btn-small btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
