'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  role: string;
  clinicId?: string | null;
  clinicName?: string | null;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  status: string;
  patient_count?: number;
  doctor_count?: number;
  appointment_count?: number;
  total_revenue?: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeClinicId: string | null;
  activeClinicName: string | null;
  setActiveClinic: (clinicId: string | null, clinicName: string | null) => void;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  activeClinicId: null,
  activeClinicName: null,
  setActiveClinic: () => {},
  login: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeClinicId, setActiveClinicIdState] = useState<string | null>(null);
  const [activeClinicName, setActiveClinicNameState] = useState<string | null>(null);

  const setActiveClinic = useCallback((id: string | null, name: string | null) => {
    setActiveClinicIdState(id);
    setActiveClinicNameState(name);
    if (id) {
      localStorage.setItem('active-clinic-id', id);
      localStorage.setItem('active-clinic-name', name || 'Clinic');
      document.cookie = `active-clinic-id=${id}; path=/; max-age=86400; SameSite=Lax`;
    } else {
      localStorage.removeItem('active-clinic-id');
      localStorage.removeItem('active-clinic-name');
      document.cookie = `active-clinic-id=all; path=/; max-age=86400; SameSite=Lax`;
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);

        // Initialize active clinic
        const storedClinicId = localStorage.getItem('active-clinic-id');
        const storedClinicName = localStorage.getItem('active-clinic-name');

        if (data.user.role === 'superadmin') {
          if (storedClinicId && storedClinicId !== 'all') {
            setActiveClinicIdState(storedClinicId);
            setActiveClinicNameState(storedClinicName || 'Clinic');
          } else {
            setActiveClinicIdState(null);
            setActiveClinicNameState('All Clinics');
          }
        } else {
          setActiveClinicIdState(data.user.clinicId || null);
          setActiveClinicNameState(data.user.clinicName || 'My Clinic');
        }
      } else {
        localStorage.removeItem('auth-token');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('auth-token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          usernameOrEmail, 
          email: usernameOrEmail, 
          username: usernameOrEmail, 
          password 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('auth-token', data.token);
        setUser(data.user);

        if (data.user.role === 'superadmin') {
          setActiveClinicIdState(null);
          setActiveClinicNameState('All Clinics');
        } else {
          setActiveClinicIdState(data.user.clinicId || null);
          setActiveClinicNameState(data.user.clinicName || 'My Clinic');
        }

        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('active-clinic-id');
      localStorage.removeItem('active-clinic-name');
      document.cookie = `active-clinic-id=; path=/; max-age=0`;
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeClinicId,
        activeClinicName,
        setActiveClinic,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
