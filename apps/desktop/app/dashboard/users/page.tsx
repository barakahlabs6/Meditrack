'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { User } from '@/lib/types';

const inputClass =
  'rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'doctor' });
  const [submitting, setSubmitting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await apiFetch('/users');
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ name: '', email: '', password: '', role: 'doctor' });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Remove this staff member?')) return;
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Staff</h1>
      <p className="mt-1 text-sm text-muted">Manage doctor and receptionist accounts.</p>

      {error && (
        <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid max-w-2xl grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm"
      >
        <input
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClass}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputClass}
          required
        />
        <input
          type="password"
          placeholder="Temporary password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className={inputClass}
          required
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className={inputClass}
        >
          <option value="doctor">Doctor</option>
          <option value="receptionist">Receptionist</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="col-span-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add staff member'}
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-muted" colSpan={4}>Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-muted" colSpan={4}>No staff yet — add a doctor or receptionist above.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-canvas">
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(u.id)} className="text-xs font-medium text-danger hover:underline">
                      Remove
                    </button>
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
