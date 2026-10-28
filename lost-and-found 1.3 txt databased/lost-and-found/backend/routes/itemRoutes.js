const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../utils/fileDb');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

/* Public: search/browse all approved organizations with rich filters.
   Supports free-text search across name + description, plus exact filters
   for type / city / district / state so a visitor can narrow down quickly. */
router.get('/organizations', (req, res) => {
  const { q, type, city, district, state } = req.query;
  let orgs = db.findMany('organizations', (o) => o.status === 'approved');

  if (type) orgs = orgs.filter((o) => o.type === type);
  if (city) orgs = orgs.filter((o) => (o.city || '').toLowerCase() === city.toLowerCase());
  if (district) orgs = orgs.filter((o) => (o.district || '').toLowerCase() === district.toLowerCase());
  if (state) orgs = orgs.filter((o) => (o.state || '').toLowerCase() === state.toLowerCase());
  if (q) {
    const term = q.toLowerCase();
    orgs = orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(term) ||
        (o.description || '').toLowerCase().includes(term) ||
        (o.city || '').toLowerCase().includes(term) ||
        (o.address || '').toLowerCase().includes(term)
    );
  }

  const result = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    type: o.type,
    description: o.description || '',
    address: o.address || '',
    city: o.city || '',
    district: o.district || '',
    state: o.state || '',
    pincode: o.pincode || '',
    website: o.website || '',
    logo: o.logo || null,
    itemCount: db.findMany('items', (i) => i.orgId === o.id).length,
  }));

  res.json(result);
});

/* Public: list every distinct city/state/type currently in use, to populate
   filter dropdowns on the frontend without hardcoding values. */
router.get('/organizations/filters', (_req, res) => {
  const orgs = db.findMany('organizations', (o) => o.status === 'approved');
  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();
  res.json({
    types: uniq(orgs.map((o) => o.type)),
    cities: uniq(orgs.map((o) => o.city)),
    districts: uniq(orgs.map((o) => o.district)),
    states: uniq(orgs.map((o) => o.state)),
  });
});

/* Public: list items for one organization, with rich filters */
router.get('/', (req, res) => {
  const { orgId, category, status, q, sort, dateFrom, dateTo } = req.query;
  if (!orgId) return res.status(400).json({ message: 'orgId query param is required.' });

  let items = db.findMany('items', (i) => i.orgId === orgId);

  if (category && (category === 'lost' || category === 'found')) {
    items = items.filter((i) => i.category === category);
  }
  if (status && (status === 'open' || status === 'resolved')) {
    items = items.filter((i) => i.status === status);
  }
  if (q) {
    const term = q.toLowerCase();
    items = items.filter(
      (i) => i.title.toLowerCase().includes(term) || i.description.toLowerCase().includes(term)
    );
  }
  if (dateFrom) items = items.filter((i) => new Date(i.createdAt) >= new Date(dateFrom));
  if (dateTo) items = items.filter((i) => new Date(i.createdAt) <= new Date(dateTo + 'T23:59:59'));

  // newest first (default) or oldest first, hide poster's private contact info in list view
  items = items
    .sort((a, b) => (sort === 'oldest' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt)))
    .map(({ contactInfo, ...rest }) => rest);

  res.json(items);
});

/* Protected (user only): all items posted by the logged-in user - "My Items" (OLX-style) */
router.get('/mine', requireAuth('user'), (req, res) => {
  const items = db
    .findMany('items', (i) => i.userId === req.user.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items);
});

/* Public (contact info hidden) / logged-in user (contact info shown): item detail */
router.get('/:id', optionalAuth, (req, res) => {
  const item = db.findById('items', req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });

  const org = db.findById('organizations', item.orgId);
  const canSeeContact = !!req.user; // any logged-in user/org/admin can see contact details
  const payload = canSeeContact ? item : { ...item, contactInfo: undefined };
  res.json({ ...payload, orgName: org ? org.name : '', contactVisible: canSeeContact });
});

/* Protected (user only): create a lost/found item post, with optional photo */
router.post('/', requireAuth('user'), upload.single('photo'), async (req, res) => {
  try {
    const { title, description, category, contactInfo } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description and category (lost/found) are required.' });
    }
    if (category !== 'lost' && category !== 'found') {
      return res.status(400).json({ message: 'Category must be "lost" or "found".' });
    }

    const item = await db.insert('items', {
      title,
      description,
      category,
      photo: req.file ? req.file.filename : null,
      contactInfo: contactInfo || '',
      orgId: req.user.orgId,
      userId: req.user.userId,
      postedBy: req.user.name,
      status: 'open', // open | resolved
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

/* Protected (user only, own item): edit an item - OLX-style "edit my listing".
   Photo is optional on edit; if a new one is sent, the old file is removed. */
router.put('/:id', requireAuth('user'), upload.single('photo'), async (req, res) => {
  try {
    const item = db.findById('items', req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (item.userId !== req.user.userId) {
      return res.status(403).json({ message: 'You can only edit your own items.' });
    }

    const { title, description, category, contactInfo, removePhoto } = req.body;
    if (category && category !== 'lost' && category !== 'found') {
      return res.status(400).json({ message: 'Category must be "lost" or "found".' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (contactInfo !== undefined) updates.contactInfo = contactInfo;

    // Replace photo if a new file was uploaded, or remove it if asked to.
    if (req.file) {
      if (item.photo) {
        const oldPath = path.join(__dirname, '..', 'uploads', item.photo);
        fs.existsSync(oldPath) && fs.unlink(oldPath, () => {});
      }
      updates.photo = req.file.filename;
    } else if (removePhoto === 'true' && item.photo) {
      const oldPath = path.join(__dirname, '..', 'uploads', item.photo);
      fs.existsSync(oldPath) && fs.unlink(oldPath, () => {});
      updates.photo = null;
    }

    const updated = await db.updateById('items', req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

/* Protected (user only, own item): mark resolved / delete */
router.put('/:id/resolve', requireAuth('user'), async (req, res) => {
  const item = db.findById('items', req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  if (item.userId !== req.user.userId) return res.status(403).json({ message: 'Not your item.' });

  const updated = await db.updateById('items', req.params.id, { status: 'resolved' });
  res.json(updated);
});

router.delete('/:id', requireAuth('user', 'org', 'admin'), async (req, res) => {
  const item = db.findById('items', req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });

  const isOwner = req.user.role === 'user' && item.userId === req.user.userId;
  const isOrgOwner = req.user.role === 'org' && item.orgId === req.user.orgId;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isOrgOwner && !isAdmin) return res.status(403).json({ message: 'Not allowed to delete this item.' });

  if (item.photo) {
    const photoPath = path.join(__dirname, '..', 'uploads', item.photo);
    fs.existsSync(photoPath) && fs.unlink(photoPath, () => {});
  }

  await db.removeById('items', req.params.id);
  res.json({ message: 'Item deleted.' });
});

module.exports = router;
