'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/patients', label: 'Patients', icon: '👥' },
  { href: '/dashboard/appointments', label: 'Appointments', icon: '📅' },
  { href: '/dashboard/doctors', label: 'Doctors', icon: '🩺' },
  { href: '/dashboard/treatments', label: 'Treatments', icon: '💊' },
  { href: '/dashboard/billing', label: 'Billing', icon: '💰' },
  { href: '/dashboard/payments', label: 'Payments', icon: '💳' },
  { href: '/dashboard/reports', label: 'Reports', icon: '📈' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? 'w-[72px]' : 'w-64'
      } h-screen bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out fixed left-0 top-0 z-40`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          🦷
        </div>
        {!collapsed && (
          <div className="animate-fadeIn">
            <h1 className="text-lg font-bold gradient-text">DentalCare</h1>
            <p className="text-xs text-slate-500">Management System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-600/20 text-teal-400 border-l-2 border-teal-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info & collapse */}
      <div className="border-t border-slate-800 p-3">
        {!collapsed && user && (
          <div className="mb-3 px-3 animate-fadeIn">
            <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '→' : '←'}
            {!collapsed && <span>Collapse</span>}
          </button>
          {!collapsed && (
            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20"
              title="Logout"
            >
              ⏏
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
