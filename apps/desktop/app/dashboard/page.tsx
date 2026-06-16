'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Stats {
  totalPatients: number;
  totalAppointments: number;
  todayAppointments: number;
  completedToday: number;
  totalDoctors: number;
  totalRecords: number;
  recentAppointments: Appointment[];
  myAppointments: Appointment[];
}

interface Appointment {
  id: number;
  patient_name: string;
  doctor_name: string;
  scheduled_at: string;
  status: string;
  reason: string | null;
}

const statusStyles: Record<string, string> = {
  scheduled: 'bg-primary-soft text-primary',
  completed: 'bg-success-soft text-success',
  cancelled: 'bg-danger-soft text-danger',
};

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/stats')
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted">Loading...</p>;
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!stats) return null;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">
        Good {getTimeOfDay()}, {user?.name}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total patients" value={stats.totalPatients} />
        <StatCard label="Appointments today" value={stats.todayAppointments} sub="scheduled" />
        <StatCard label="Completed today" value={stats.completedToday} />
        <StatCard label="Medical records" value={stats.totalRecords} />
        {user?.role === 'admin' && (
          <>
            <StatCard label="Doctors on staff" value={stats.totalDoctors} />
            <StatCard label="Total appointments" value={stats.totalAppointments} sub="all time" />
          </>
        )}
      </div>

      {user?.role === 'doctor' && stats.myAppointments.length > 0 && (
        <section className="mt-8">
          <h2 className="text-base font-bold text-ink">Your upcoming appointments</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.myAppointments.map((a) => (
                  <tr key={a.id} className="border-t border-border hover:bg-canvas">
                    <td className="px-4 py-3 font-medium text-ink">{a.patient_name}</td>
                    <td className="px-4 py-3 text-muted">{new Date(a.scheduled_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted">{a.reason || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Recent appointments</h2>
          <Link href="/dashboard/appointments" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAppointments.length === 0 ? (
                <tr><td className="px-4 py-4 text-muted" colSpan={4}>No appointments yet.</td></tr>
              ) : (
                stats.recentAppointments.map((a) => (
                  <tr key={a.id} className="border-t border-border hover:bg-canvas">
                    <td className="px-4 py-3 font-medium text-ink">{a.patient_name}</td>
                    <td className="px-4 py-3 text-muted">{a.doctor_name}</td>
                    <td className="px-4 py-3 text-muted">{new Date(a.scheduled_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
