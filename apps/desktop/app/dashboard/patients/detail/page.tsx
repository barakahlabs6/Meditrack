'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, apiUpload, API_URL } from '@/lib/api';
import { ExportPatientButton } from '@/components/features/ExportPatientButton';
import { useAuth } from '@/hooks/useAuth';

interface Patient {
  id: number;
  name: string;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
}

interface MedicalRecord {
  id: number;
  title: string;
  notes: string | null;
  file_path: string | null;
  doctor_name: string;
  created_at: string;
}

const inputClass =
  'rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft disabled:opacity-60';

function PatientDetailContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const id = searchParams.get('id');

  const [patient, setPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordForm, setRecordForm] = useState({ title: '', notes: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'receptionist';
  const canAddRecord = user?.role === 'admin' || user?.role === 'doctor';

  useEffect(() => {
    if (!id) return;
    apiFetch(`/patients/${id}`)
      .then((data) => {
        setPatient(data);
        setForm(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load patient'))
      .finally(() => setLoading(false));
  }, [id]);

  async function loadRecords() {
    if (!id) return;
    setRecordsLoading(true);
    try {
      const data = await apiFetch(`/records?patient_id=${id}`);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setRecordsLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError('');
    setSaving(true);
    try {
      const updated = await apiFetch(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setPatient(updated);
      setForm(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleRecordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('patient_id', id);
      fd.append('title', recordForm.title);
      fd.append('notes', recordForm.notes);
      if (file) fd.append('file', file);

      await apiUpload('/records', fd);
      setRecordForm({ title: '', notes: '' });
      setFile(null);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add record');
    } finally {
      setUploading(false);
    }
  }

  if (!id) return <p className="text-sm text-muted">No patient selected.</p>;
  if (loading) return <p className="text-sm text-muted">Loading...</p>;
  if (!patient || !form) return <p className="text-sm text-danger">{error || 'Patient not found.'}</p>;

  return (
    <div>
      <Link href="/dashboard/patients" className="text-sm font-medium text-primary hover:underline">
        ← Back to patients
      </Link>

      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">{patient.name}</h1>
      <p className="mt-1 text-sm text-muted">Patient #{patient.id}</p>
      <div className="mt-3">
        <ExportPatientButton patientId={patient.id} patientName={patient.name} />
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <form
        onSubmit={handleSave}
        className="mt-6 grid max-w-2xl grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Full name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`${inputClass} w-full`}
            disabled={!canEdit}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Date of birth</label>
          <input
            type="date"
            value={form.dob || ''}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            className={`${inputClass} w-full`}
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Gender</label>
          <select
            value={form.gender || ''}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className={`${inputClass} w-full`}
            disabled={!canEdit}
          >
            <option value="">—</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Phone</label>
          <input
            value={form.phone || ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={`${inputClass} w-full`}
            disabled={!canEdit}
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">Address</label>
          <input
            value={form.address || ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className={`${inputClass} w-full`}
            disabled={!canEdit}
          />
        </div>
        {canEdit && (
          <button
            type="submit"
            disabled={saving}
            className="col-span-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        )}
      </form>

      <h2 className="mt-10 text-lg font-bold text-ink">Medical records</h2>

      {canAddRecord && (
        <form
          onSubmit={handleRecordSubmit}
          className="mt-4 grid max-w-2xl grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm"
        >
          <input
            placeholder="Title (e.g. Lab results)"
            value={recordForm.title}
            onChange={(e) => setRecordForm({ ...recordForm, title: e.target.value })}
            className={`${inputClass} col-span-2`}
            required
          />
          <textarea
            placeholder="Notes"
            value={recordForm.notes}
            onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
            className={`${inputClass} col-span-2`}
            rows={3}
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className={`${inputClass} col-span-2`}
          />
          <button
            type="submit"
            disabled={uploading}
            className="col-span-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? 'Saving...' : 'Add record'}
          </button>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {recordsLoading ? (
          <p className="text-sm text-muted">Loading records...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted">No medical records yet.</p>
        ) : (
          records.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink">{r.title}</h3>
                <span className="text-xs text-muted">{new Date(r.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-xs text-muted">By {r.doctor_name}</p>
              {r.notes && <p className="mt-2 text-sm text-ink">{r.notes}</p>}
              {r.file_path && (
                
                <a href={API_URL + r.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                >
                  View attachment
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
      <PatientDetailContent />
    </Suspense>
  );
}
