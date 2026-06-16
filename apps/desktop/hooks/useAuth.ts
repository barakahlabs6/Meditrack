'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { saveSession, getToken, getStoredUser, clearSession } from '@/lib/auth';
import type { User } from '@/lib/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser<User>();
    const token = getToken();
    if (stored && token) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveSession(data.token, data.user);
    setUser(data.user);
    return data.user as User;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.push('/login');
  }, [router]);

  return { user, loading, login, logout };
}
