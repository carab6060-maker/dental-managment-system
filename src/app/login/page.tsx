'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(usernameOrEmail, password);

    if (result.success) {
      showToast('Login successful! Welcome back.', 'success');
      router.push('/dashboard');
    } else {
      showToast(result.error || 'Login failed', 'error');
    }

    setLoading(false);
  };

  const fillCredentials = (user: string, pass: string) => {
    setUsernameOrEmail(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900/30" />
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass rounded-2xl p-8 shadow-2xl border border-slate-700/50">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-teal-500/20">
              🦷
            </div>
            <h1 className="text-2xl font-bold gradient-text">DentalCare</h1>
            <p className="text-slate-400 text-sm mt-1">Sign in with your username or email</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-300 mb-1.5">
                Username or Email
              </label>
              <input
                id="identifier"
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="superadmin or admin@dental.com"
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick-fill credentials badge */}
          <div className="mt-6 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <p className="text-slate-400 font-medium mb-2 text-center">💡 Click to autofill login credentials:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('superadmin', 'admin123')}
                className="p-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-left transition-colors"
              >
                <div className="font-semibold text-teal-200">👑 Super Admin</div>
                <div className="text-[11px] text-teal-400/80">User: superadmin</div>
                <div className="text-[10px] text-slate-400">Pass: admin123</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin@dental.com', 'admin123')}
                className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-left transition-colors"
              >
                <div className="font-semibold text-cyan-200">🏥 Admin Email</div>
                <div className="text-[11px] text-cyan-400/80">User: admin@dental.com</div>
                <div className="text-[10px] text-slate-400">Pass: admin123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
