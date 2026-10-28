// initData.js
// Makes sure all data/*.txt files exist, and seeds a default super-admin
// account (from .env) the very first time the server runs.

const bcrypt = require('bcryptjs');
const db = require('./fileDb');

async function initData() {
  db.ensureFile('organizations', []);
  db.ensureFile('users', []);
  db.ensureFile('items', []);
  db.ensureFile('admin', []);
  db.ensureFile('conversations', []);
  db.ensureFile('messages', []);

  const admins = db.readTable('admin');
  if (admins.length === 0) {
    const username = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
    const password = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const hashed = await bcrypt.hash(password, 10);
    await db.insert('admin', { username, password: hashed });
    console.log(`Default super-admin created -> username: "${username}", password: "${password}"`);
    console.log('(Change these in production by editing data/admin.txt or .env before first run.)');
  }
}

module.exports = initData;
