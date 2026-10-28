const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../utils/fileDb');
const { signToken } = require('../middleware/auth');

const router = express.Router();

/* ---------------------------- SUPER ADMIN LOGIN --------------------------- */
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required.' });

    const admin = db.findOne('admin', (a) => a.username === username);
    if (!admin) return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = signToken({ role: 'admin', id: admin.id, username: admin.username });
    res.json({ token, user: { id: admin.id, username: admin.username, role: 'admin' } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

/* ------------------------------ ORGANIZATION ------------------------------ */
// Any organization (college / university / hospital / company etc.) registers here.
// Status stays "pending" until the super-admin approves it. A rich profile
// (description + full location) makes the org easy to find in search later.
router.post('/org/register', async (req, res) => {
  try {
    const {
      name, type, email, password, phone,
      description, address, city, district, state, pincode, website,
    } = req.body;

    if (!name || !type || !email || !password) {
      return res.status(400).json({ message: 'Name, type, email and password are required.' });
    }

    const existing = db.findOne('organizations', (o) => o.email.toLowerCase() === email.toLowerCase());
    if (existing) return res.status(409).json({ message: 'An organization with this email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const org = await db.insert('organizations', {
      name,
      type, // college | university | hospital | company | other
      email,
      password: hashed,
      phone: phone || '',
      description: description || '',
      address: address || '',
      city: city || '',
      district: district || '',
      state: state || '',
      pincode: pincode || '',
      website: website || '',
      logo: null,
      status: 'pending', // pending | approved | rejected
    });

    res.status(201).json({
      message: 'Organization registered. Please wait for super-admin approval before logging in.',
      organization: { id: org.id, name: org.name, status: org.status },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

router.post('/org/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const org = db.findOne('organizations', (o) => o.email.toLowerCase() === email.toLowerCase());
    if (!org) return res.status(401).json({ message: 'Invalid credentials.' });

    if (org.status === 'pending') return res.status(403).json({ message: 'Your organization is awaiting admin approval.' });
    if (org.status === 'rejected') return res.status(403).json({ message: 'Your organization registration was rejected by admin.' });

    const match = await bcrypt.compare(password, org.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = signToken({ role: 'org', orgId: org.id, name: org.name });
    res.json({
      token,
      organization: {
        id: org.id, name: org.name, type: org.type, email: org.email,
        city: org.city, state: org.state, logo: org.logo,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

/* --------------------------------- USER ---------------------------------- */
// A "user" is a person (student / staff / patient / employee) belonging to
// one approved organization, chosen at signup time. A short bio + location
// helps other members recognise who they're dealing with.
router.post('/user/register', async (req, res) => {
  try {
    const { name, email, password, phone, orgId, bio, address, city, state } = req.body;
    if (!name || !email || !password || !orgId) {
      return res.status(400).json({ message: 'Name, email, password and organization are required.' });
    }

    const org = db.findById('organizations', orgId);
    if (!org || org.status !== 'approved') {
      return res.status(400).json({ message: 'Selected organization is not valid or not yet approved.' });
    }

    const existing = db.findOne('users', (u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.insert('users', {
      name,
      email,
      password: hashed,
      phone: phone || '',
      bio: bio || '',
      address: address || '',
      city: city || '',
      state: state || '',
      profilePhoto: null,
      orgId,
    });

    const token = signToken({ role: 'user', userId: user.id, orgId, name: user.name });
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, orgId, orgName: org.name },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

router.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const user = db.findOne('users', (u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const org = db.findById('organizations', user.orgId);

    const token = signToken({ role: 'user', userId: user.id, orgId: user.orgId, name: user.name });
    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email, phone: user.phone || '',
        orgId: user.orgId, orgName: org ? org.name : '', profilePhoto: user.profilePhoto || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
