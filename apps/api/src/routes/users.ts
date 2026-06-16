import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

// Lightweight doctor list for scheduling — admin + receptionist
router.get('/doctors', requireRole('admin', 'receptionist'), (req, res) => {
  const doctors = db.prepare("SELECT id, name FROM users WHERE role = 'doctor' ORDER BY name").all();
  res.json(doctors);
});

router.get('/', requireRole('admin'), (req, res) => {
  const users = db.prepare('SELECT id, name, email, role FROM users ORDER BY id').all();
  res.json(users);
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }

  if (!['admin', 'doctor', 'receptionist'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    .run(name, email, hashed, role);

  res.status(201).json({ id: result.lastInsertRowid, name, email, role });
});

router.delete('/:id', requireRole('admin'), (req: AuthRequest, res) => {
  const id = Number(req.params.id);

  if (id === req.user?.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.sendStatus(204);
});

export default router;
