const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database/medxnet.db');
console.log('Opening DB at:', dbPath);

try {
  const db = new Database(dbPath);
  const rows = db.prepare('SELECT id, medicine, quantity, ece_level, status FROM orders').all();
  console.log('Orders inside SQLite database:');
  console.log(JSON.stringify(rows, null, 2));
} catch (e) {
  console.error('Error reading DB:', e);
}
