import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function OrgSelect() {
  const [orgs, setOrgs] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ types: [], cities: [], districts: [], states: [] });
  const [filters, setFilters] = useState({ q: '', type: '', city: '', district: '', state: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/items/organizations/filters').then((res) => setFilterOptions(res.data));
  }, []);

  function load() {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api
      .get('/items/organizations', { params })
      .then((res) => setOrgs(res.data))
      .catch(() => setError('Could not load organizations. Is the backend running?'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce free-text search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function set(field) {
    return (e) => setFilters({ ...filters, [field]: e.target.value });
  }

  function clearFilters() {
    setFilters({ q: '', type: '', city: '', district: '', state: '' });
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="page">
      <h2>Browse Organizations</h2>

      <div className="search-panel">
        <input
          className="search-box"
          placeholder="Search by name, description, city or address..."
          value={filters.q}
          onChange={set('q')}
        />
        <div className="filter-grid">
          <select value={filters.type} onChange={set('type')}>
            <option value="">All Types</option>
            {filterOptions.types.map((t) => (
              <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <select value={filters.state} onChange={set('state')}>
            <option value="">All States</option>
            {filterOptions.states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.district} onChange={set('district')}>
            <option value="">All Districts</option>
            {filterOptions.districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filters.city} onChange={set('city')}>
            <option value="">All Cities</option>
            {filterOptions.cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {activeFilterCount > 0 && (
            <button type="button" className="btn-small btn-outline-small" onClick={clearFilters}>
              Clear filters ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && orgs.length === 0 && <p>No organizations match your search.</p>}

      <div className="org-grid">
        {orgs.map((org) => (
          <Link key={org.id} to={`/organizations/${org.id}`} className="org-card">
            <div className="org-card-top">
              <div className="org-logo">
                {org.logo ? <img src={`/uploads/${org.logo}`} alt={org.name} /> : <span>{org.name[0]}</span>}
              </div>
              <div>
                <h3>{org.name}</h3>
                <span className="org-type">{org.type}</span>
              </div>
            </div>
            {org.description && <p className="org-desc">{org.description.slice(0, 110)}{org.description.length > 110 ? '…' : ''}</p>}
            <div className="org-card-footer">
              {(org.city || org.state) && <span className="org-location">📍 {[org.city, org.state].filter(Boolean).join(', ')}</span>}
              <span className="org-item-count">{org.itemCount} item{org.itemCount === 1 ? '' : 's'}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
