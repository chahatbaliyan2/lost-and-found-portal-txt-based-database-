// fileDb.js
// Simple "database" implemented on top of plain .txt files.
// Each table (organizations, users, items, admin) is stored as a JSON array
// inside a .txt file under /data. We serialize writes per-file using an
// in-memory promise chain so concurrent requests don't corrupt the file.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Per-file lock chain to avoid two simultaneous writes corrupting a file.
const locks = {};

function filePath(table) {
  return path.join(DATA_DIR, `${table}.txt`);
}

function ensureFile(table, defaultValue) {
  const fp = filePath(table);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, JSON.stringify(defaultValue, null, 2), 'utf-8');
  }
}

function readTable(table) {
  const fp = filePath(table);
  ensureFile(table, []);
  const raw = fs.readFileSync(fp, 'utf-8').trim();
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Corrupt data file: ${table}.txt`, err);
    return [];
  }
}

function writeTable(table, data) {
  const prev = locks[table] || Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(() => {
      const fp = filePath(table);
      fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8');
    });
  locks[table] = next;
  return next;
}

// Generate a reasonably unique id without extra dependencies.
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

async function insert(table, record) {
  const rows = readTable(table);
  const newRecord = { id: generateId(), createdAt: new Date().toISOString(), ...record };
  rows.push(newRecord);
  await writeTable(table, rows);
  return newRecord;
}

async function updateById(table, id, updates) {
  const rows = readTable(table);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...updates, updatedAt: new Date().toISOString() };
  await writeTable(table, rows);
  return rows[idx];
}

async function removeById(table, id) {
  const rows = readTable(table);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  rows.splice(idx, 1);
  await writeTable(table, rows);
  return true;
}

function findById(table, id) {
  return readTable(table).find((r) => r.id === id) || null;
}

function findOne(table, predicate) {
  return readTable(table).find(predicate) || null;
}

function findMany(table, predicate) {
  const rows = readTable(table);
  return predicate ? rows.filter(predicate) : rows;
}

module.exports = {
  ensureFile,
  readTable,
  writeTable,
  insert,
  updateById,
  removeById,
  findById,
  findOne,
  findMany,
  generateId,
};
