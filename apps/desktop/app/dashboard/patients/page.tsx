'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Patient {
  id: number;
  name: string;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
}

const inputClass =
  'rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft';

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', dob: '', gender: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'receptionist';

  async function loadPatients() {
    setLoading(true);
    try {
      const data = await apiFetch('/patients');
      setPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/patients', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ name: '', dob: '', gender: '', phone: '', address: '' });
      await loadPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add patient');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Patients</h1>
      <p className="mt-1 text-sm text-muted">All registered patients.</p>

      {error && (
        <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      {canManage && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 grid max-w-3xl grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm sm:grid-cols-3"
        >
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            required
          />
          <input
            type="date"
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            className={inputClass}
          />
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className={inputClass}
          >
            <option value="">Gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={`${inputClass} sm:col-span-2`}
          />
          <button
            type="submit"
            disabled={submitting}
            className="col-span-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 sm:col-span-3"
          >
            {submitting ? 'Adding...' : 'Register patient'}
          </button>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">DOB</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-4 text-muted" colSpan={5}>Loading...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td className="px-4 py-4 text-muted" colSpan={5}>No patients yet.</td></tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-canvas">
                  <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-muted">{p.dob || '—'}</td>
                  <td className="px-4 py-3 text-muted capitalize">{p.gender || '—'}</td>
                  <td className="px-4 py-3 text-muted">{p.phone || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/patients/detail?id=${p.id}`} className="text-xs font-medium text-primary hover:underline">
                      View
                    </Link>
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
