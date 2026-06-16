import { Router } from 'express';
import db from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => {
  const patients = db.prepare('SELECT * FROM patients ORDER BY id DESC').all();
  res.json(patients);
});

router.get('/:id', (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

router.post('/', requireRole('admin', 'receptionist'), (req: AuthRequest, res) => {
  const { name, dob, gender, phone, address } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const result = db
    .prepare('INSERT INTO patients (name, dob, gender, phone, address, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, dob || null, gender || null, phone || null, address || null, req.user!.id);

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(patient);
});

router.put('/:id', requireRole('admin', 'receptionist'), (req, res) => {
  const { name, dob, gender, phone, address } = req.body;
  const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Patient not found' });

  db.prepare('UPDATE patients SET name = ?, dob = ?, gender = ?, phone = ?, address = ? WHERE id = ?')
    .run(name, dob || null, gender || null, phone || null, address || null, req.params.id);

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  res.json(patient);
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id);
  res.sendStatus(204);
});

export default router;
