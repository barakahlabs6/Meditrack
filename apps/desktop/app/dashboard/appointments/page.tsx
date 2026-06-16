'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  patient_name: string;
  doctor_name: string;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reason: string | null;
}

interface Option {
  id: number;
  name: string;
}

const inputClass =
  'rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft';

const statusStyles: Record<string, string> = {
  scheduled: 'bg-primary-soft text-primary',
  completed: 'bg-success-soft text-success',
  cancelled: 'bg-danger-soft text-danger',
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Option[]>([]);
  const [doctors, setDoctors] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ patient_id: '', doctor_id: '', scheduled_at: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const canSchedule = user?.role === 'admin' || user?.role === 'receptionist';

  async function loadAll() {
    setLoading(true);
    try {
      const tasks: Promise<unknown>[] = [apiFetch('/appointments'), apiFetch('/patients')];
      if (canSchedule) tasks.push(apiFetch('/users/doctors'));

      const results = await Promise.all(tasks);
      setAppointments(results[0] as Appointment[]);
      setPatients(results[1] as Option[]);
      if (canSchedule) setDoctors(results[2] as Option[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: Number(form.patient_id),
          doctor_id: Number(form.doctor_id),
          scheduled_at: form.scheduled_at,
          reason: form.reason,
        }),
      });
      setForm({ patient_id: '', doctor_id: '', scheduled_at: '', reason: '' });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule appointment');
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await apiFetch(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Appointments</h1>
      <p className="mt-1 text-sm text-muted">
        {user?.role === 'doctor' ? 'Your scheduled appointments.' : 'All scheduled appointments.'}
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {canSchedule && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 grid max-w-3xl grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm sm:grid-cols-4"
        >
          <select
            value={form.patient_id}
            onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
            className={inputClass}
            required
          >
            <option value="">Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={form.doctor_id}
            onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
            className={inputClass}
            required
          >
            <option value="">Doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            className={inputClass}
            required
          />
          <input
            placeholder="Reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={submitting}
            className="col-span-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 sm:col-span-4"
          >
            {submitting ? 'Scheduling...' : 'Schedule appointment'}
          </button>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-4 text-muted" colSpan={6}>Loading...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td className="px-4 py-4 text-muted" colSpan={6}>No appointments yet.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id} className="border-t border-border hover:bg-canvas">
                  <td className="px-4 py-3 font-medium text-ink">{a.patient_name}</td>
                  <td className="px-4 py-3 text-muted">{a.doctor_name}</td>
                  <td className="px-4 py-3 text-muted">{new Date(a.scheduled_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted">{a.reason || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.status === 'scheduled' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => updateStatus(a.id, 'completed')} className="text-xs font-medium text-success hover:underline">
                          Complete
                        </button>
                        <button onClick={() => updateStatus(a.id, 'cancelled')} className="text-xs font-medium text-danger hover:underline">
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
