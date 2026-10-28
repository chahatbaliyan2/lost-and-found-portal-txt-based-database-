import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: '', phone: '', bio: '', address: '', city: '', state: '',
    currentPassword: '', newPassword: '',
  });
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [newPhoto, setNewPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/user/me')
      .then((res) => {
        const d = res.data;
        setForm((f) => ({
          ...f, name: d.name, phone: d.phone || '', bio: d.bio || '',
          address: d.address || '', city: d.city || '', state: d.state || '',
        }));
        setOrgName(d.orgName);
        setEmail(d.email);
        setExistingPhoto(d.profilePhoto);
      })
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const data = new FormData();
      ['name', 'phone', 'bio', 'address', 'city', 'state'].forEach((k) => data.append(k, form[k]));
      if (form.newPassword) {
        data.append('currentPassword', form.currentPassword);
        data.append('newPassword', form.newPassword);
      }
      if (newPhoto) data.append('profilePhoto', newPhoto);
      if (removePhoto && !newPhoto) data.append('removePhoto', 'true');

      const res = await api.put('/user/me', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateProfile(res.data.user, res.data.token);
      setExistingPhoto(res.data.user.profilePhoto);
      setNewPhoto(null);
      setRemovePhoto(false);
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="page">Loading...</p>;

  return (
    <div className="page auth-page">
      <h2>My Profile</h2>
      <p className="hint">{email} &middot; {orgName}</p>

      <form onSubmit={handleSubmit} className="form" encType="multipart/form-data">
        <div className="photo-edit-block">
          {existingPhoto && !removePhoto && !newPhoto && (
            <div className="current-photo round">
              <img src={`/uploads/${existingPhoto}`} alt="Profile" />
              <button type="button" className="btn-small btn-danger" onClick={() => setRemovePhoto(true)}>Remove Photo</button>
            </div>
          )}
          <label className="file-label">
            {existingPhoto ? 'Replace profile photo:' : 'Add a profile photo (optional):'}
            <input type="file" accept="image/*" onChange={(e) => { setNewPhoto(e.target.files[0]); setRemovePhoto(false); }} />
          </label>
        </div>

        <label className="field-label">
          Full Name
          <input value={form.name} onChange={set('name')} required />
        </label>
        <label className="field-label">
          Phone
          <input value={form.phone} onChange={set('phone')} />
        </label>
        <label className="field-label">
          Bio
          <textarea rows={2} value={form.bio} onChange={set('bio')} />
        </label>
        <label className="field-label">
          Address
          <input value={form.address} onChange={set('address')} />
        </label>
        <div className="form-grid-2">
          <label className="field-label">
            City
            <input value={form.city} onChange={set('city')} />
          </label>
          <label className="field-label">
            State
            <input value={form.state} onChange={set('state')} />
          </label>
        </div>

        <hr className="divider" />
        <p className="hint">Leave the password fields blank if you don't want to change it.</p>

        <label className="field-label">
          Current Password
          <input type="password" value={form.currentPassword} onChange={set('currentPassword')} />
        </label>
        <label className="field-label">
          New Password
          <input type="password" value={form.newPassword} onChange={set('newPassword')} />
        </label>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
