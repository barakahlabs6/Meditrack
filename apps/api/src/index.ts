import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import db from './db/database';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import patientsRoutes from './routes/patients';
import appointmentsRoutes from './routes/appointments';
import recordsRoutes from './routes/records';
import { authenticate, AuthRequest } from './middleware/auth';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/stats', authenticate, (req: AuthRequest, res) => {
  const totalPatients = (db.prepare('SELECT COUNT(*) as n FROM patients').get() as any).n;
  const totalAppointments = (db.prepare('SELECT COUNT(*) as n FROM appointments').get() as any).n;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAppointments = (db.prepare(
    "SELECT COUNT(*) as n FROM appointments WHERE scheduled_at LIKE ? AND status = 'scheduled'"
  ).get(todayStr + '%') as any).n;
  const completedToday = (db.prepare(
    "SELECT COUNT(*) as n FROM appointments WHERE scheduled_at LIKE ? AND status = 'completed'"
  ).get(todayStr + '%') as any).n;
  const totalDoctors = (db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'doctor'").get() as any).n;
  const totalRecords = (db.prepare('SELECT COUNT(*) as n FROM medical_records').get() as any).n;

  const recentAppointments = db.prepare(`
    SELECT a.*, p.name as patient_name, u.name as doctor_name
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    JOIN users u ON u.id = a.doctor_id
    ORDER BY a.created_at DESC LIMIT 5
  `).all();

  const myAppointments = req.user!.role === 'doctor'
    ? db.prepare(`
        SELECT a.*, p.name as patient_name, u.name as doctor_name
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        JOIN users u ON u.id = a.doctor_id
        WHERE a.doctor_id = ? AND a.status = 'scheduled'
        ORDER BY a.scheduled_at ASC LIMIT 5
      `).all(req.user!.id)
    : [];

  res.json({
    totalPatients,
    totalAppointments,
    todayAppointments,
    completedToday,
    totalDoctors,
    totalRecords,
    recentAppointments,
    myAppointments,
  });
});

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/patients', patientsRoutes);
app.use('/appointments', appointmentsRoutes);
app.use('/records', recordsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('API running on http://localhost:' + PORT));
