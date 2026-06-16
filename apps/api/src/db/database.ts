import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const db = new Database(path.join(__dirname, '../../meditrack.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin','doctor','receptionist')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    dob TEXT,
    gender TEXT,
    phone TEXT,
    address TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES users(id),
    scheduled_at TEXT NOT NULL,
    status TEXT CHECK(status IN ('scheduled','completed','cancelled')) DEFAULT 'scheduled',
    reason TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    notes TEXT,
    file_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const adminCount = db
  .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
  .get() as { count: number };

if (adminCount.count === 0) {
  const hashed = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    .run('Admin', 'admin@meditrack.local', hashed, 'admin');
  console.log('Seeded default admin -> admin@meditrack.local / admin123');
}

export default db;
