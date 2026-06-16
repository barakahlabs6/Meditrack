'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { RoleBadge } from '@/components/ui/RoleBadge';

const navItems = [
  { href: '/dashboard', label: 'Overview', roles: ['admin', 'doctor', 'receptionist'] },
  { href: '/dashboard/patients', label: 'Patients', roles: ['admin', 'doctor', 'receptionist'] },
  { href: '/dashboard/appointments', label: 'Appointments', roles: ['admin', 'doctor', 'receptionist'] },
  { href: '/dashboard/users', label: 'Staff', roles: ['admin'] },
  { href: '/dashboard/settings', label: 'Settings', roles: ['admin', 'doctor', 'receptionist'] },
];

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="flex w-60 flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            M
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">MediTrack</span>
        </div>

        <div className="border-y border-border px-5 py-4">
          <p className="text-sm font-semibold text-ink">{user.name}</p>
          <div className="mt-1.5">
            <RoleBadge role={user.role} />
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems
            .filter((item) => item.roles.includes(user.role))
            .map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-transparent text-muted hover:bg-canvas hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="space-y-0.5 border-t border-border p-3">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={logout}
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
