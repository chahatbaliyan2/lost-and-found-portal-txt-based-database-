import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'items', label: 'Items' },
  { key: 'members', label: 'Members' },
  { key: 'settings', label: 'Organization Profile' },
];

export default function OrgDashboard() {
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/org/stats').then((res) => setStats(res.data));
  }, []);

  return (
    <div className="page">
      <div className="dashboard-header">
        <h2>Organization Dashboard</h2>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              className={section === s.key ? 'active' : ''}
              onClick={() => setSection(s.key)}
            >
              <span>{s.label}</span>
              {s.key === 'items' && stats && <span className="count-pill">{stats.totalItems}</span>}
              {s.key === 'members' && stats && <span className="count-pill">{stats.totalUsers}</span>}
            </button>
          ))}
        </div>

        <div className="dashboard-main">
          {section === 'overview' && <Overview stats={stats} />}
          {section === 'items' && <ItemsTab />}
          {section === 'members' && <MembersTab />}
          {section === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Overview ---------------------------------- */
function Overview({ stats }) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.get('/org/analytics').then((res) => setAnalytics(res.data));
  }, []);

  return (
    <>
      {stats && (
        <div className="stat-cards">
          <div className="stat-card"><span className="stat-icon">👥</span><strong>{stats.totalUsers}</strong><span>Members</span></div>
          <div className="stat-card"><span className="stat-icon">📦</span><strong>{stats.totalItems}</strong><span>Total Items</span></div>
          <div className="stat-card"><span className="stat-icon">🔴</span><strong>{stats.lostItems}</strong><span>Lost</span></div>
          <div className="stat-card"><span className="stat-icon">🟢</span><strong>{stats.foundItems}</strong><span>Found</span></div>
          <div className="stat-card"><span className="stat-icon">✅</span><strong>{stats.resolvedItems}</strong><span>Resolved</span></div>
          <div className="stat-card"><span className="stat-icon">🕓</span><strong>{stats.openItems}</strong><span>Still Open</span></div>
        </div>
      )}

      {analytics && (
        <div className="charts-row">
          <div className="chart-card">
            <h4>Activity — last 14 days</h4>
            <div className="mini-bars">
              {analytics.dailyItems.map((d, idx) => {
                const max = Math.max(1, ...analytics.dailyItems.map((x) => x.lost + x.found));
                const total = d.lost + d.found;
                const h = total ? Math.max(6, (total / max) * 100) : 2;
                return (
                  <div key={idx} className="bar-col" style={{ height: `${h}%` }} title={`${d.date}: ${d.lost} lost, ${d.found} found`}>
                    {d.found > 0 && <div className="seg found" style={{ height: `${(d.found / total) * 100}%` }} />}
                    {d.lost > 0 && <div className="seg lost" style={{ height: `${(d.lost / total) * 100}%` }} />}
                  </div>
                );
              })}
            </div>
            <div className="chart-x-labels">
              <span>{analytics.dailyItems[0]?.date}</span>
              <span>{analytics.dailyItems[analytics.dailyItems.length - 1]?.date}</span>
            </div>
            <div className="chart-legend">
              <span><span className="legend-dot" style={{ background: 'var(--amber)' }} />Lost</span>
              <span><span className="legend-dot" style={{ background: 'var(--teal)' }} />Found</span>
            </div>
          </div>

          <div className="chart-card">
            <h4>Category & Status split</h4>
            <p className="hint">Lost vs Found</p>
            <SplitBar data={analytics.categorySplit} colors={['var(--amber)', 'var(--teal)']} />
            <p className="hint" style={{ marginTop: 16 }}>Open vs Resolved</p>
            <SplitBar data={analytics.statusSplit} colors={['var(--ink-soft)', 'var(--teal-dark)']} />
          </div>
        </div>
      )}
    </>
  );
}

function SplitBar({ data, colors }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <>
      <div className="split-bar">
        {data.map((d, i) => (
          <span key={d.name} style={{ width: `${(d.value / total) * 100}%`, background: colors[i] }} />
        ))}
      </div>
      <div className="chart-legend">
        {data.map((d, i) => (
          <span key={d.name}><span className="legend-dot" style={{ background: colors[i] }} />{d.name} ({d.value})</span>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------ Items ------------------------------------ */
function ItemsTab() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', status: '', sort: 'newest', dateFrom: '', dateTo: '' });
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/org/items', { params }).then((res) => setItems(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function set(field) {
    return (e) => setFilters({ ...filters, [field]: e.target.value });
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this item?')) return;
    await api.delete(`/items/${id}`);
    load();
  }

  return (
    <>
      <div className="search-panel">
        <div className="filter-grid">
          <input placeholder="Search title / description / poster..." value={filters.q} onChange={set('q')} />
          <select value={filters.category} onChange={set('category')}>
            <option value="">All Categories</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
          <select value={filters.status} onChange={set('status')}>
            <option value="">Any Status</option>
            <option value="open">Still Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <select value={filters.sort} onChange={set('sort')}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <label className="inline-date-label">From <input type="date" value={filters.dateFrom} onChange={set('dateFrom')} /></label>
          <label className="inline-date-label">To <input type="date" value={filters.dateTo} onChange={set('dateTo')} /></label>
        </div>
      </div>

      <div className="table-toolbar">
        <span className="result-count">{items.length} item{items.length === 1 ? '' : 's'}</span>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <p className="empty-state">No items match these filters.</p>}

      {!loading && items.length > 0 && (
        <table className="data-table">
          <thead>
            <tr><th></th><th>Title</th><th>Category</th><th>Posted By</th><th>Status</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.photo ? <img className="table-thumb" src={`/uploads/${i.photo}`} alt="" /> : <div className="table-thumb" />}</td>
                <td>{i.title}</td>
                <td><span className={`badge ${i.category}`}>{i.category}</span></td>
                <td>{i.postedBy}</td>
                <td>{i.status === 'resolved' ? <span className="badge resolved">Resolved</span> : 'Open'}</td>
                <td>{new Date(i.createdAt).toLocaleDateString()}</td>
                <td><button className="btn-small btn-danger" onClick={() => handleDelete(i.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

/* ----------------------------------- Members ----------------------------------- */
function MembersTab() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/org/users', { params: q ? { q } : {} }).then((res) => setUsers(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <>
      <div className="search-panel">
        <input placeholder="Search members by name, email or city..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="table-toolbar"><span className="result-count">{users.length} member{users.length === 1 ? '' : 's'}</span></div>

      {loading && <p>Loading...</p>}
      {!loading && users.length === 0 && <p className="empty-state">No members found.</p>}

      {!loading && users.length > 0 && (
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>Joined</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone || '-'}</td>
                <td>{u.city || '-'}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

/* ---------------------------------- Settings ---------------------------------- */
function SettingsTab() {
  const { auth, updateProfile } = useAuth();
  const [form, setForm] = useState({ description: '', phone: '', address: '', city: '', district: '', state: '', pincode: '', website: '' });
  const [org, setOrg] = useState(null);
  const [newLogo, setNewLogo] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/org/me').then((res) => {
      const d = res.data;
      setOrg(d);
      setForm({
        description: d.description || '', phone: d.phone || '', address: d.address || '',
        city: d.city || '', district: d.district || '', state: d.state || '', pincode: d.pincode || '', website: d.website || '',
      });
    }).finally(() => setLoading(false));
  }, []);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (newLogo) data.append('logo', newLogo);
      if (removeLogo && !newLogo) data.append('removeLogo', 'true');

      const res = await api.put('/org/me', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setOrg(res.data);
      setNewLogo(null);
      setRemoveLogo(false);
      updateProfile({ ...auth.profile, logo: res.data.logo });
      setSuccess('Organization profile updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="auth-page wide" style={{ margin: 0 }}>
      <p className="hint">This information is shown publicly when someone browses or searches for your organization.</p>
      <form onSubmit={handleSubmit} className="form" encType="multipart/form-data">
        <div className="photo-edit-block">
          {org?.logo && !removeLogo && !newLogo && (
            <div className="current-photo">
              <img src={`/uploads/${org.logo}`} alt="Logo" />
              <button type="button" className="btn-small btn-danger" onClick={() => setRemoveLogo(true)}>Remove Logo</button>
            </div>
          )}
          <label className="file-label">
            {org?.logo ? 'Replace logo:' : 'Add a logo (optional):'}
            <input type="file" accept="image/*" onChange={(e) => { setNewLogo(e.target.files[0]); setRemoveLogo(false); }} />
          </label>
        </div>

        <div className="form-section-title">About</div>
        <textarea rows={3} placeholder="Description shown in search results" value={form.description} onChange={set('description')} />

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

        <div className="form-section-title">Contact</div>
        <input placeholder="Phone" value={form.phone} onChange={set('phone')} />
        <input placeholder="Website" value={form.website} onChange={set('website')} />

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </div>
  );
}
