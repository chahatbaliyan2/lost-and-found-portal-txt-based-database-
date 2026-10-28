import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'organizations', label: 'Organizations' },
  { key: 'members', label: 'Members' },
  { key: 'items', label: 'Items' },
];

export default function AdminDashboard() {
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState(null);

  function loadStats() {
    api.get('/admin/stats').then((res) => setStats(res.data));
  }

  useEffect(() => { loadStats(); }, []);

  return (
    <div className="page">
      <div className="dashboard-header">
        <h2>Super Admin Dashboard</h2>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          {SECTIONS.map((s) => (
            <button key={s.key} className={section === s.key ? 'active' : ''} onClick={() => setSection(s.key)}>
              <span>{s.label}</span>
              {s.key === 'organizations' && stats && <span className="count-pill">{stats.totalOrganizations}</span>}
              {s.key === 'organizations' && stats?.pendingOrganizations > 0 && (
                <span className="count-pill" style={{ background: 'var(--amber)', color: 'white' }}>{stats.pendingOrganizations}</span>
              )}
              {s.key === 'members' && stats && <span className="count-pill">{stats.totalUsers}</span>}
              {s.key === 'items' && stats && <span className="count-pill">{stats.totalItems}</span>}
            </button>
          ))}
        </div>

        <div className="dashboard-main">
          {section === 'overview' && <Overview stats={stats} />}
          {section === 'organizations' && <OrganizationsTab onChanged={loadStats} />}
          {section === 'members' && <MembersTab />}
          {section === 'items' && <ItemsTab />}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Overview ---------------------------------- */
function Overview({ stats }) {
  const [analytics, setAnalytics] = useState(null);
  useEffect(() => { api.get('/admin/analytics').then((res) => setAnalytics(res.data)); }, []);

  return (
    <>
      {stats && (
        <div className="stat-cards">
          <div className="stat-card"><span className="stat-icon">🏢</span><strong>{stats.totalOrganizations}</strong><span>Organizations</span></div>
          <div className="stat-card"><span className="stat-icon">⏳</span><strong>{stats.pendingOrganizations}</strong><span>Pending Approval</span></div>
          <div className="stat-card"><span className="stat-icon">✅</span><strong>{stats.approvedOrganizations}</strong><span>Approved</span></div>
          <div className="stat-card"><span className="stat-icon">👥</span><strong>{stats.totalUsers}</strong><span>Users</span></div>
          <div className="stat-card"><span className="stat-icon">📦</span><strong>{stats.totalItems}</strong><span>Items</span></div>
          <div className="stat-card"><span className="stat-icon">🔁</span><strong>{stats.resolvedItems}</strong><span>Resolved</span></div>
        </div>
      )}

      {analytics && (
        <div className="charts-row">
          <div className="chart-card">
            <h4>Platform growth — last 14 days</h4>
            <div className="mini-bars">
              {analytics.dailyGrowth.map((d, idx) => {
                const total = d.organizations + d.users + d.items;
                const max = Math.max(1, ...analytics.dailyGrowth.map((x) => x.organizations + x.users + x.items));
                const h = total ? Math.max(6, (total / max) * 100) : 2;
                return (
                  <div key={idx} className="bar-col" style={{ height: `${h}%` }} title={`${d.date}: ${d.organizations} orgs, ${d.users} users, ${d.items} items`}>
                    {d.items > 0 && <div className="seg items" style={{ height: `${(d.items / total) * 100}%` }} />}
                    {d.users > 0 && <div className="seg users" style={{ height: `${(d.users / total) * 100}%` }} />}
                    {d.organizations > 0 && <div className="seg organizations" style={{ height: `${(d.organizations / total) * 100}%` }} />}
                  </div>
                );
              })}
            </div>
            <div className="chart-x-labels">
              <span>{analytics.dailyGrowth[0]?.date}</span>
              <span>{analytics.dailyGrowth[analytics.dailyGrowth.length - 1]?.date}</span>
            </div>
            <div className="chart-legend">
              <span><span className="legend-dot" style={{ background: 'var(--amber)' }} />Organizations</span>
              <span><span className="legend-dot" style={{ background: 'var(--teal)' }} />Users</span>
              <span><span className="legend-dot" style={{ background: 'var(--teal-dark)' }} />Items</span>
            </div>
          </div>

          <div className="chart-card">
            <h4>Organizations by type</h4>
            <div className="type-bars">
              {analytics.orgTypeSplit.map((t) => {
                const max = Math.max(1, ...analytics.orgTypeSplit.map((x) => x.value));
                return (
                  <div key={t.name} className="type-bar-row">
                    <span>{t.name}</span>
                    <div className="type-bar-track"><div className="type-bar-fill" style={{ width: `${(t.value / max) * 100}%` }} /></div>
                    <span>{t.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {analytics && (
        <div className="charts-row">
          <div className="chart-card">
            <h4>Top organizations by items posted</h4>
            <div className="top-list">
              {analytics.topOrganizations.length === 0 && <p className="hint">No items posted yet.</p>}
              {analytics.topOrganizations.map((o, i) => (
                <div key={o.name} className="top-list-row">
                  <span><span className="rank">#{i + 1}</span>{o.name}</span>
                  <span className="top-list-count">{o.items} item{o.items === 1 ? '' : 's'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-card">
            <h4>Organization approval status</h4>
            <SplitBar data={analytics.statusSplit} colors={['var(--amber)', 'var(--teal)', 'var(--red)']} />
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
        {data.map((d, i) => <span key={d.name} style={{ width: `${(d.value / total) * 100}%`, background: colors[i] }} />)}
      </div>
      <div className="chart-legend">
        {data.map((d, i) => <span key={d.name}><span className="legend-dot" style={{ background: colors[i] }} />{d.name} ({d.value})</span>)}
      </div>
    </>
  );
}

/* ------------------------------- Organizations -------------------------------- */
function OrganizationsTab({ onChanged }) {
  const [orgs, setOrgs] = useState([]);
  const [filters, setFilters] = useState({ q: '', status: '', type: '', city: '', state: '' });
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/admin/organizations', { params }).then((res) => setOrgs(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function set(field) { return (e) => setFilters({ ...filters, [field]: e.target.value }); }

  async function approve(id) { await api.put(`/admin/organizations/${id}/approve`); load(); onChanged(); }
  async function reject(id) { await api.put(`/admin/organizations/${id}/reject`); load(); onChanged(); }
  async function remove(id) {
    if (!window.confirm('Permanently delete this organization and ALL its members/items?')) return;
    await api.delete(`/admin/organizations/${id}`);
    load(); onChanged();
  }

  return (
    <>
      <div className="search-panel">
        <div className="filter-grid">
          <input placeholder="Search name, email, description, city..." value={filters.q} onChange={set('q')} />
          <select value={filters.status} onChange={set('status')}>
            <option value="">Any Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={filters.type} onChange={set('type')}>
            <option value="">Any Type</option>
            <option value="college">College</option>
            <option value="university">University</option>
            <option value="hospital">Hospital</option>
            <option value="company">Company</option>
            <option value="other">Other</option>
          </select>
          <input placeholder="City" value={filters.city} onChange={set('city')} />
          <input placeholder="State" value={filters.state} onChange={set('state')} />
        </div>
      </div>

      <div className="table-toolbar"><span className="result-count">{orgs.length} organization{orgs.length === 1 ? '' : 's'}</span></div>

      {loading && <p>Loading...</p>}
      {!loading && orgs.length === 0 && <p className="empty-state">No organizations match these filters.</p>}

      {!loading && orgs.length > 0 && (
        <table className="data-table">
          <thead><tr><th></th><th>Name</th><th>Type</th><th>Location</th><th>Items</th><th>Members</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {orgs.map((o) => (
              <React.Fragment key={o.id}>
                <tr className="row-clickable" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                  <td>{o.logo ? <img className="table-thumb" src={`/uploads/${o.logo}`} alt="" /> : <div className="org-logo" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>{o.name[0]}</div>}</td>
                  <td>{o.name}</td>
                  <td>{o.type}</td>
                  <td>{[o.city, o.state].filter(Boolean).join(', ') || '-'}</td>
                  <td>{o.itemCount}</td>
                  <td>{o.userCount}</td>
                  <td><span className={`badge status-${o.status}`}>{o.status}</span></td>
                  <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                    {o.status !== 'approved' && <button className="btn-small btn-success" onClick={() => approve(o.id)}>Approve</button>}
                    {o.status !== 'rejected' && <button className="btn-small btn-warning" onClick={() => reject(o.id)}>Reject</button>}
                    <button className="btn-small btn-danger" onClick={() => remove(o.id)}>Delete</button>
                  </td>
                </tr>
                {expanded === o.id && (
                  <tr className="expand-row">
                    <td colSpan="8">
                      <div className="expand-grid">
                        <div><span>Email</span>{o.email}</div>
                        <div><span>Phone</span>{o.phone || '-'}</div>
                        <div><span>Website</span>{o.website ? <a href={o.website} target="_blank" rel="noreferrer">{o.website}</a> : '-'}</div>
                        <div><span>Address</span>{[o.address, o.city, o.district, o.state, o.pincode].filter(Boolean).join(', ') || '-'}</div>
                        <div style={{ gridColumn: '1 / -1' }}><span>Description</span>{o.description || '-'}</div>
                        <div><span>Registered</span>{new Date(o.createdAt).toLocaleString()}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
  const [orgs, setOrgs] = useState([]);
  const [filters, setFilters] = useState({ q: '', orgId: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/admin/organizations').then((res) => setOrgs(res.data)); }, []);

  function load() {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/admin/users', { params }).then((res) => setUsers(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function set(field) { return (e) => setFilters({ ...filters, [field]: e.target.value }); }

  async function remove(id) {
    if (!window.confirm('Remove this user account?')) return;
    await api.delete(`/admin/users/${id}`);
    load();
  }

  return (
    <>
      <div className="search-panel">
        <div className="filter-grid">
          <input placeholder="Search name or email..." value={filters.q} onChange={set('q')} />
          <select value={filters.orgId} onChange={set('orgId')}>
            <option value="">All Organizations</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>
      <div className="table-toolbar"><span className="result-count">{users.length} user{users.length === 1 ? '' : 's'}</span></div>

      {loading && <p>Loading...</p>}
      {!loading && users.length === 0 && <p className="empty-state">No users match these filters.</p>}

      {!loading && users.length > 0 && (
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Organization</th><th>Phone</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.orgName}</td>
                <td>{u.phone || '-'}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td><button className="btn-small btn-danger" onClick={() => remove(u.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

/* ------------------------------------ Items ------------------------------------ */
function ItemsTab() {
  const [items, setItems] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', status: '', orgId: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/admin/organizations').then((res) => setOrgs(res.data)); }, []);

  function load() {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/admin/items', { params }).then((res) => setItems(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function set(field) { return (e) => setFilters({ ...filters, [field]: e.target.value }); }

  async function remove(id) {
    if (!window.confirm('Delete this item?')) return;
    await api.delete(`/items/${id}`);
    load();
  }

  return (
    <>
      <div className="search-panel">
        <div className="filter-grid">
          <input placeholder="Search title or description..." value={filters.q} onChange={set('q')} />
          <select value={filters.category} onChange={set('category')}>
            <option value="">All Categories</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
          <select value={filters.status} onChange={set('status')}>
            <option value="">Any Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <select value={filters.orgId} onChange={set('orgId')}>
            <option value="">All Organizations</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>
      <div className="table-toolbar"><span className="result-count">{items.length} item{items.length === 1 ? '' : 's'}</span></div>

      {loading && <p>Loading...</p>}
      {!loading && items.length === 0 && <p className="empty-state">No items match these filters.</p>}

      {!loading && items.length > 0 && (
        <table className="data-table">
          <thead><tr><th></th><th>Title</th><th>Organization</th><th>Category</th><th>Posted By</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.photo ? <img className="table-thumb" src={`/uploads/${i.photo}`} alt="" /> : <div className="table-thumb" />}</td>
                <td>{i.title}</td>
                <td>{i.orgName}</td>
                <td><span className={`badge ${i.category}`}>{i.category}</span></td>
                <td>{i.postedBy}</td>
                <td>{i.status === 'resolved' ? <span className="badge resolved">Resolved</span> : 'Open'}</td>
                <td>{new Date(i.createdAt).toLocaleDateString()}</td>
                <td><button className="btn-small btn-danger" onClick={() => remove(i.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
