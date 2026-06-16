import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const SELECT_JOIN = 'SELECT r.*, u.name as doctor_name FROM medical_records r JOIN users u ON u.id = r.doctor_id';

router.get('/', (req, res) => {
  const patientId = req.query.patient_id;
  if (!patientId) return res.status(400).json({ error: 'patient_id is required' });
  const records = db.prepare(SELECT_JOIN + ' WHERE r.patient_id = ? ORDER BY r.created_at DESC').all(patientId);
  res.json(records);
});

router.post('/', requireRole('admin', 'doctor'), upload.single('file'), (req: AuthRequest, res) => {
  const { patient_id, title, notes } = req.body;
  if (!patient_id || !title) return res.status(400).json({ error: 'patient_id and title are required' });
  const filePath = req.file ? '/uploads/' + req.file.filename : null;
  const result = db
    .prepare('INSERT INTO medical_records (patient_id, doctor_id, title, notes, file_path) VALUES (?, ?, ?, ?, ?)')
    .run(patient_id, req.user!.id, title, notes || null, filePath);
  const record = db.prepare(SELECT_JOIN + ' WHERE r.id = ?').get(result.lastInsertRowid);
  res.status(201).json(record);
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const record = db.prepare('SELECT * FROM medical_records WHERE id = ?').get(req.params.id) as any;
  if (record && record.file_path) {
    const filePath = path.join(__dirname, '../..', record.file_path);
    fs.unlink(filePath, () => {});
  }
  db.prepare('DELETE FROM medical_records WHERE id = ?').run(req.params.id);
  res.sendStatus(204);
});

export default router;
