import { Router } from 'express';
import db from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

const SELECT_JOIN = `
  SELECT a.*, p.name as patient_name, u.name as doctor_name
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN users u ON u.id = a.doctor_id
`;

router.get('/', (req: AuthRequest, res) => {
  const appointments =
    req.user!.role === 'doctor'
      ? db.prepare(`${SELECT_JOIN} WHERE a.doctor_id = ? ORDER BY a.scheduled_at DESC`).all(req.user!.id)
      : db.prepare(`${SELECT_JOIN} ORDER BY a.scheduled_at DESC`).all();

  res.json(appointments);
});

router.post('/', requireRole('admin', 'receptionist'), (req: AuthRequest, res) => {
  const { patient_id, doctor_id, scheduled_at, reason } = req.body;

  if (!patient_id || !doctor_id || !scheduled_at) {
    return res.status(400).json({ error: 'patient_id, doctor_id, and scheduled_at are required' });
  }

  const result = db
    .prepare('INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason, created_by) VALUES (?, ?, ?, ?, ?)')
    .run(patient_id, doctor_id, scheduled_at, reason || null, req.user!.id);

  const appointment = db.prepare(`${SELECT_JOIN} WHERE a.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(appointment);
});

router.patch('/:id/status', (req: AuthRequest, res) => {
  const { status } = req.body;

  if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id) as any;
  if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

  if (req.user!.role === 'doctor' && appointment.doctor_id !== req.user!.id) {
    return res.status(403).json({ error: 'Not your appointment' });
  }

  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare(`${SELECT_JOIN} WHERE a.id = ?`).get(req.params.id);
  res.json(updated);
});

router.delete('/:id', requireRole('admin', 'receptionist'), (req, res) => {
  db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  res.sendStatus(204);
});

export default router;
