'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Clinic State
  const [clinicName, setClinicName] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicCity, setClinicCity] = useState('Mogadishu');

  const { login } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(usernameOrEmail, password);

    if (result.success) {
      showToast('Login successful! Welcome back.', 'success');
      router.push('/dashboard');
    } else {
      showToast(result.error || 'Invalid credentials', 'error');
    }

    setLoading(false);
  };

  const handleRegisterClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim()) {
      showToast('Please enter clinic name', 'error');
      return;
    }
    if (!adminEmail.trim() || !adminPassword) {
      showToast('Please provide an email/username and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clinicName.trim(),
          adminFullName: adminFullName.trim() || `${clinicName} Admin`,
          adminUsername: adminEmail.includes('@') ? adminEmail.split('@')[0] : adminEmail.trim(),
          adminEmail: adminEmail.includes('@') ? adminEmail.trim() : `${adminEmail.trim()}@clinic.local`,
          adminPassword,
          phone: clinicPhone.trim() || undefined,
          city: clinicCity.trim() || 'Mogadishu',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Clinic "${clinicName}" registered! Signing you in...`, 'success');
        // Auto login with the newly created admin account
        const loginRes = await login(adminEmail, adminPassword);
        if (loginRes.success) {
          router.push('/dashboard');
        } else {
          showToast('Clinic created! Please sign in with your credentials.', 'success');
          setMode('login');
          setUsernameOrEmail(adminEmail);
        }
      } else {
        showToast(data.error || 'Failed to create clinic', 'error');
      }
    } catch {
      showToast('Network error while registering clinic', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-4">
      <div className="w-full max-w-[460px] bg-white rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10">
        
        {/* Brand Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 p-1 flex items-center justify-center shadow-sm flex-shrink-0">
              <img
                src="/logo.jpg"
                alt="DentalCare Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1E2238] tracking-tight">
                DentalCare
              </h1>
              <p className="text-xs text-slate-400 font-medium">Dental Management Platform</p>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-3">
            {mode === 'login' ? 'Sign in to your dental management account' : 'Register a new dental clinic workspace'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 gap-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-[#1E2238] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            + Register New Clinic
          </button>
        </div>

        {/* Login Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address or Username
              </label>
              <input
                id="identifier"
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="carab, primedental, or email"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E2238]/15 focus:border-[#1E2238] transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E2238]/15 focus:border-[#1E2238] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#1E2238] hover:bg-[#15192E] active:scale-[0.99] text-white rounded-xl font-semibold text-sm shadow-md shadow-[#1E2238]/15 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterClinic} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinic Name (Magaca Clinic-ka) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="e.g. Mogadishu Smile Dental Care"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  placeholder="Dr. Ahmed Ali"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City (Magaalada)
                </label>
                <input
                  type="text"
                  value={clinicCity}
                  onChange={(e) => setClinicCity(e.target.value)}
                  placeholder="Mogadishu"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email / Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="clinicadmin"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinic Phone <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
                placeholder="+252 61..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registering Clinic...
                </>
              ) : (
                'Create Clinic & Workspace'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
