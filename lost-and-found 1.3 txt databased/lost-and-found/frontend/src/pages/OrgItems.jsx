import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import ItemCard from '../components/ItemCard.jsx';

export default function OrgItems() {
  const { orgId } = useParams();
  const [org, setOrg] = useState(null);
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: '', q: '', sort: 'newest', dateFrom: '', dateTo: '' });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/items/organizations').then((res) => setOrg(res.data.find((o) => o.id === orgId)));
  }, [orgId]);

  function load() {
    setLoading(true);
    const params = { orgId };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api
      .get('/items', { params })
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, filters]);

  function set(field) {
    return (e) => setFilters({ ...filters, [field]: e.target.value });
  }

  return (
    <div className="page">
      <Link to="/organizations">&larr; All organizations</Link>

      {org && (
        <div className="org-banner">
          <div className="org-logo large">
            {org.logo ? <img src={`/uploads/${org.logo}`} alt={org.name} /> : <span>{org.name[0]}</span>}
          </div>
          <div>
            <h2>{org.name}</h2>
            <span className="org-type">{org.type}</span>
            {org.description && <p className="org-desc">{org.description}</p>}
            {(org.city || org.state || org.address) && (
              <p className="meta">📍 {[org.address, org.city, org.district, org.state, org.pincode].filter(Boolean).join(', ')}</p>
            )}
            {org.website && <p className="meta"><a href={org.website} target="_blank" rel="noreferrer">{org.website}</a></p>}
          </div>
        </div>
      )}

      <h3>Lost & Found Items</h3>

      <div className="search-panel">
        <div className="filter-bar">
          <input placeholder="Search items..." value={filters.q} onChange={set('q')} />
          <select value={filters.category} onChange={set('category')}>
            <option value="">All</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
          <button type="button" className="btn-small btn-outline-small" onClick={() => setShowAdvanced((s) => !s)}>
            {showAdvanced ? 'Fewer Filters' : 'More Filters'}
          </button>
        </div>

        {showAdvanced && (
          <div className="filter-grid">
            <select value={filters.status} onChange={set('status')}>
              <option value="">Any Status</option>
              <option value="open">Still Open</option>
              <option value="resolved">Resolved</option>
            </select>
            <select value={filters.sort} onChange={set('sort')}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <label className="inline-date-label">
              From <input type="date" value={filters.dateFrom} onChange={set('dateFrom')} />
            </label>
            <label className="inline-date-label">
              To <input type="date" value={filters.dateTo} onChange={set('dateTo')} />
            </label>
          </div>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <p>No items match your search.</p>}

      <div className="items-grid">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
