'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FB]">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  const getPageTitle = () => {
    if (pathname.includes('/clinics')) return 'Clinics & Organizations';
    if (pathname.includes('/patients')) return 'Patients';
    if (pathname.includes('/appointments')) return 'Appointments';
    if (pathname.includes('/doctors')) return 'Doctors';
    if (pathname.includes('/treatments')) return 'Treatments';
    if (pathname.includes('/billing')) return 'Billing & Invoices';
    if (pathname.includes('/payments')) return 'Payments';
    if (pathname.includes('/reports')) return 'Reports & Analytics';
    return 'Dashboard';
  };

  const displayName = user.username || user.fullName?.split(' ')[0] || 'carab';

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Navbar matching CarRent SaaS */}
        <header className="h-16 px-8 bg-transparent flex items-center justify-between border-b border-slate-200/60 sticky top-0 z-20 backdrop-blur-md bg-[#F4F6FB]/80">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-slate-800">
              {displayName}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
