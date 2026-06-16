'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { RoleBadge } from '@/components/ui/RoleBadge';

const inputClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft';

export default function SettingsPage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (next !== confirm) {
      setError('New passwords do not match');
      return;
    }
    if (next.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      setSuccess('Password updated successfully');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Settings</h1>
      <p className="mt-1 text-sm text-muted">Manage your account preferences.</p>

      <div className="mt-6 max-w-md rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Account</h2>
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-muted">Name</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Email</p>
            <p className="mt-0.5 text-sm text-ink">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Role</p>
            <div className="mt-1">
              <RoleBadge role={user?.role ?? ''} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 max-w-md rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Change password</h2>

        {error && (
          <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}
        {success && (
          <p className="mt-4 rounded-md bg-success-soft px-3 py-2 text-sm text-success">{success}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Current password</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">New password</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
