const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../utils/fileDb');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(requireAuth('org'));

/* Organization's own full profile (for the Settings page) */
router.get('/me', (req, res) => {
  const org = db.findById('organizations', req.user.orgId);
  if (!org) return res.status(404).json({ message: 'Organization not found.' });
  const { password, ...safe } = org;
  res.json(safe);
});

/* Edit organization profile: description, full location, website, phone, logo.
   Name/type/email/status are NOT editable here (name/type changes go through
   admin to prevent an org quietly rebranding after approval; email/status
   are identity/administrative fields). */
router.put('/me', upload.single('logo'), async (req, res) => {
  try {
    const org = db.findById('organizations', req.user.orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found.' });

    const { description, phone, address, city, district, state, pincode, website, removeLogo } = req.body;
    const updates = {};
    if (description !== undefined) updates.description = description;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (district !== undefined) updates.district = district;
    if (state !== undefined) updates.state = state;
    if (pincode !== undefined) updates.pincode = pincode;
    if (website !== undefined) updates.website = website;

    if (req.file) {
      if (org.logo) {
        const oldPath = path.join(__dirname, '..', 'uploads', org.logo);
        fs.existsSync(oldPath) && fs.unlink(oldPath, () => {});
      }
      updates.logo = req.file.filename;
    } else if (removeLogo === 'true' && org.logo) {
      const oldPath = path.join(__dirname, '..', 'uploads', org.logo);
      fs.existsSync(oldPath) && fs.unlink(oldPath, () => {});
      updates.logo = null;
    }

    const updated = await db.updateById('organizations', req.user.orgId, updates);
    const { password, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

/* All items posted under this organization, with advanced filters for the dashboard */
router.get('/items', (req, res) => {
  const { category, status, q, sort, dateFrom, dateTo } = req.query;
  let items = db.findMany('items', (i) => i.orgId === req.user.orgId);

  if (category) items = items.filter((i) => i.category === category);
  if (status) items = items.filter((i) => i.status === status);
  if (q) {
    const term = q.toLowerCase();
    items = items.filter(
      (i) => i.title.toLowerCase().includes(term) || i.description.toLowerCase().includes(term) || i.postedBy.toLowerCase().includes(term)
    );
  }
  if (dateFrom) items = items.filter((i) => new Date(i.createdAt) >= new Date(dateFrom));
  if (dateTo) items = items.filter((i) => new Date(i.createdAt) <= new Date(dateTo + 'T23:59:59'));

  items.sort((a, b) => (sort === 'oldest' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt)));

  res.json(items);
});

/* All members (students/staff) registered under this organization, searchable */
router.get('/users', (req, res) => {
  const { q } = req.query;
  let users = db.findMany('users', (u) => u.orgId === req.user.orgId);

  if (q) {
    const term = q.toLowerCase();
    users = users.filter(
      (u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || (u.city || '').toLowerCase().includes(term)
    );
  }

  users = users
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ password, ...safe }) => safe);

  res.json(users);
});

/* Simple stats for the org dashboard header cards */
router.get('/stats', (req, res) => {
  const items = db.findMany('items', (i) => i.orgId === req.user.orgId);
  const users = db.findMany('users', (u) => u.orgId === req.user.orgId);
  res.json({
    totalUsers: users.length,
    totalItems: items.length,
    lostItems: items.filter((i) => i.category === 'lost').length,
    foundItems: items.filter((i) => i.category === 'found').length,
    resolvedItems: items.filter((i) => i.status === 'resolved').length,
    openItems: items.filter((i) => i.status !== 'resolved').length,
  });
});

/* Analytics for charts: daily activity (last 14 days), category split, resolution rate */
router.get('/analytics', (req, res) => {
  const items = db.findMany('items', (i) => i.orgId === req.user.orgId);
  const users = db.findMany('users', (u) => u.orgId === req.user.orgId);

  const days = 14;
  const dailyItems = [];
  const dailyUsers = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    dailyItems.push({
      date: label,
      lost: items.filter((it) => it.createdAt.slice(0, 10) === key && it.category === 'lost').length,
      found: items.filter((it) => it.createdAt.slice(0, 10) === key && it.category === 'found').length,
    });
    dailyUsers.push({
      date: label,
      signups: users.filter((u) => u.createdAt.slice(0, 10) === key).length,
    });
  }

  res.json({
    dailyItems,
    dailyUsers,
    categorySplit: [
      { name: 'Lost', value: items.filter((i) => i.category === 'lost').length },
      { name: 'Found', value: items.filter((i) => i.category === 'found').length },
    ],
    statusSplit: [
      { name: 'Open', value: items.filter((i) => i.status !== 'resolved').length },
      { name: 'Resolved', value: items.filter((i) => i.status === 'resolved').length },
    ],
  });
});

module.exports = router;
