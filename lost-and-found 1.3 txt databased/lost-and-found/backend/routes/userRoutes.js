const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('../utils/fileDb');
const { requireAuth, signToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(requireAuth('user'));

/* Get my own full profile */
router.get('/me', (req, res) => {
  const user = db.findById('users', req.user.userId);
  if (!user) return res.status(404).json({ message: 'Account not found.' });
  const org = db.findById('organizations', user.orgId);
  const { password, ...safe } = user;
  res.json({ ...safe, orgName: org ? org.name : '' });
});

/* Edit my own profile: name, phone, bio, location, profile photo,
   and optionally change password. OLX-style "my account" page. */
router.put('/me', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, phone, bio, address, city, state, currentPassword, newPassword, removePhoto } = req.body;
    const user = db.findById('users', req.user.userId);
    if (!user) return res.status(404).json({ message: 'Account not found.' });

    const updates = {};
    if (name !== undefined && name.trim() !== '') updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;

    if (req.file) {
      if (user.profilePhoto) {
        const oldPath = path.join(__dirname, '..', 'uploads', user.profilePhoto);
        fs.existsSync(oldPath) && fs.unlink(oldPath, () => {});
      }
      updates.profilePhoto = req.file.filename;
    } else if (removePhoto === 'true' && user.profilePhoto) {
      const oldPath = path.join(__dirname, '..', 'uploads', user.profilePhoto);
      fs.existsSync(oldPath) && fs.unlink(oldPath, () => {});
      updates.profilePhoto = null;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Enter your current password to set a new one.' });
      }
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(401).json({ message: 'Current password is incorrect.' });
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      }
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await db.updateById('users', req.user.userId, updates);
    const org = db.findById('organizations', updated.orgId);

    // Re-issue token in case the name changed (name is embedded in token/UI state)
    const token = signToken({ role: 'user', userId: updated.id, orgId: updated.orgId, name: updated.name });

    res.json({
      token,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone || '',
        bio: updated.bio || '',
        address: updated.address || '',
        city: updated.city || '',
        state: updated.state || '',
        profilePhoto: updated.profilePhoto || null,
        orgId: updated.orgId,
        orgName: org ? org.name : '',
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
