require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const initData = require('./utils/initData');

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const orgRoutes = require('./routes/orgRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded photos statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Public site metadata (e.g. the support/contact email shown on the Help page)
app.get('/api/meta', (_req, res) => {
  res.json({ supportEmail: process.env.SUPPORT_EMAIL || 'support@findit.example' });
});

// Generic error handler (e.g. multer file-type errors)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Something went wrong.' });
});

initData().then(() => {
  app.listen(PORT, () => {
    console.log(`Lost & Found backend running on http://localhost:${PORT}`);
  });
});
