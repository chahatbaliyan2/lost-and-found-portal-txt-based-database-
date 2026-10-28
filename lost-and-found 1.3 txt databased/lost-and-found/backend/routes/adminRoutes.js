const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../utils/fileDb');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth('admin'));

/* List organizations with advanced filters: status, type, city/state, free text */
router.get('/organizations', (req, res) => {
  const { status, type, city, state, q } = req.query;
  let orgs = db.readTable('organizations').map(({ password, ...safe }) => safe);

  if (status) orgs = orgs.filter((o) => o.status === status);
  if (type) orgs = orgs.filter((o) => o.type === type);
  if (city) orgs = orgs.filter((o) => (o.city || '').toLowerCase() === city.toLowerCase());
  if (state) orgs = orgs.filter((o) => (o.state || '').toLowerCase() === state.toLowerCase());
  if (q) {
    const term = q.toLowerCase();
    orgs = orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(term) ||
        o.email.toLowerCase().includes(term) ||
        (o.description || '').toLowerCase().includes(term) ||
        (o.city || '').toLowerCase().includes(term)
    );
  }

  orgs = orgs
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((o) => ({ ...o, itemCount: db.findMany('items', (i) => i.orgId === o.id).length, userCount: db.findMany('users', (u) => u.orgId === o.id).length }));

  res.json(orgs);
});

router.put('/organizations/:id/approve', async (req, res) => {
  const updated = await db.updateById('organizations', req.params.id, { status: 'approved' });
  if (!updated) return res.status(404).json({ message: 'Organization not found.' });
  res.json({ message: 'Organization approved.', organization: updated });
});

router.put('/organizations/:id/reject', async (req, res) => {
  const updated = await db.updateById('organizations', req.params.id, { status: 'rejected' });
  if (!updated) return res.status(404).json({ message: 'Organization not found.' });
  res.json({ message: 'Organization rejected.', organization: updated });
});

router.delete('/organizations/:id', async (req, res) => {
  const org = db.findById('organizations', req.params.id);
  if (!org) return res.status(404).json({ message: 'Organization not found.' });

  // Cascade cleanup: remove this org's users and items (and their photos) so
  // deleting an organization doesn't leave orphaned data behind.
  const items = db.findMany('items', (i) => i.orgId === req.params.id);
  for (const item of items) {
    if (item.photo) {
      const p = path.join(__dirname, '..', 'uploads', item.photo);
      fs.existsSync(p) && fs.unlink(p, () => {});
    }
    await db.removeById('items', item.id);
  }
  const users = db.findMany('users', (u) => u.orgId === req.params.id);
  for (const user of users) {
    if (user.profilePhoto) {
      const p = path.join(__dirname, '..', 'uploads', user.profilePhoto);
      fs.existsSync(p) && fs.unlink(p, () => {});
    }
    await db.removeById('users', user.id);
  }
  if (org.logo) {
    const p = path.join(__dirname, '..', 'uploads', org.logo);
    fs.existsSync(p) && fs.unlink(p, () => {});
  }

  await db.removeById('organizations', req.params.id);
  res.json({ message: 'Organization and all its members/items deleted.' });
});

/* Every user across the whole platform, searchable/filterable by organization */
router.get('/users', (req, res) => {
  const { q, orgId } = req.query;
  let users = db.readTable('users').map(({ password, ...safe }) => safe);

  if (orgId) users = users.filter((u) => u.orgId === orgId);
  if (q) {
    const term = q.toLowerCase();
    users = users.filter((u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
  }

  const orgsById = Object.fromEntries(db.readTable('organizations').map((o) => [o.id, o.name]));
  users = users
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((u) => ({ ...u, orgName: orgsById[u.orgId] || 'Unknown' }));

  res.json(users);
});

router.delete('/users/:id', async (req, res) => {
  const user = db.findById('users', req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  if (user.profilePhoto) {
    const p = path.join(__dirname, '..', 'uploads', user.profilePhoto);
    fs.existsSync(p) && fs.unlink(p, () => {});
  }
  await db.removeById('users', req.params.id);
  res.json({ message: 'User removed.' });
});

/* Every item across the whole platform, searchable/filterable - for moderation */
router.get('/items', (req, res) => {
  const { q, category, status, orgId } = req.query;
  let items = db.readTable('items');

  if (orgId) items = items.filter((i) => i.orgId === orgId);
  if (category) items = items.filter((i) => i.category === category);
  if (status) items = items.filter((i) => i.status === status);
  if (q) {
    const term = q.toLowerCase();
    items = items.filter((i) => i.title.toLowerCase().includes(term) || i.description.toLowerCase().includes(term));
  }

  const orgsById = Object.fromEntries(db.readTable('organizations').map((o) => [o.id, o.name]));
  items = items
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((i) => ({ ...i, orgName: orgsById[i.orgId] || 'Unknown' }));

  res.json(items);
});

/* Platform-wide stats for the admin dashboard header cards */
router.get('/stats', (_req, res) => {
  const orgs = db.readTable('organizations');
  const users = db.readTable('users');
  const items = db.readTable('items');
  res.json({
    totalOrganizations: orgs.length,
    pendingOrganizations: orgs.filter((o) => o.status === 'pending').length,
    approvedOrganizations: orgs.filter((o) => o.status === 'approved').length,
    rejectedOrganizations: orgs.filter((o) => o.status === 'rejected').length,
    totalUsers: users.length,
    totalItems: items.length,
    lostItems: items.filter((i) => i.category === 'lost').length,
    foundItems: items.filter((i) => i.category === 'found').length,
    resolvedItems: items.filter((i) => i.status === 'resolved').length,
  });
});

/* Analytics for the admin dashboard charts */
router.get('/analytics', (_req, res) => {
  const orgs = db.readTable('organizations');
  const users = db.readTable('users');
  const items = db.readTable('items');

  const days = 14;
  const dailyGrowth = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    dailyGrowth.push({
      date: label,
      organizations: orgs.filter((o) => o.createdAt.slice(0, 10) === key).length,
      users: users.filter((u) => u.createdAt.slice(0, 10) === key).length,
      items: items.filter((i) => i.createdAt.slice(0, 10) === key).length,
    });
  }

  const orgTypeSplit = ['college', 'university', 'hospital', 'company', 'other'].map((type) => ({
    name: type[0].toUpperCase() + type.slice(1),
    value: orgs.filter((o) => o.type === type).length,
  }));

  const orgsById = Object.fromEntries(orgs.map((o) => [o.id, o.name]));
  const topOrganizations = Object.entries(
    items.reduce((acc, i) => {
      acc[i.orgId] = (acc[i.orgId] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([orgId, count]) => ({ name: orgsById[orgId] || 'Unknown', items: count }))
    .sort((a, b) => b.items - a.items)
    .slice(0, 5);

  res.json({
    dailyGrowth,
    orgTypeSplit,
    topOrganizations,
    statusSplit: [
      { name: 'Pending', value: orgs.filter((o) => o.status === 'pending').length },
      { name: 'Approved', value: orgs.filter((o) => o.status === 'approved').length },
      { name: 'Rejected', value: orgs.filter((o) => o.status === 'rejected').length },
    ],
  });
});

module.exports = router;
