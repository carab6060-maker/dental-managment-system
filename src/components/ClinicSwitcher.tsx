'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth, Clinic } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function ClinicSwitcher() {
  const { user, activeClinicId, activeClinicName, setActiveClinic } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = user?.role === 'superadmin' || user?.username === 'carab';

  useEffect(() => {
    if (isSuperAdmin) {
      fetch('/api/clinics')
        .then((res) => res.json())
        .then((data) => {
          if (data.clinics) setClinics(data.clinics);
        })
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isSuperAdmin) {
    return (
      <div className="px-3 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>{user?.clinicName || 'My Dental Clinic'}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs text-xs font-semibold text-slate-700 hover:border-blue-400 hover:text-[#2563EB] flex items-center gap-2 transition-all"
        title="Switch Clinic Workspace"
      >
        <span className="text-slate-400 text-[11px] font-normal">Clinic:</span>
        <span className="max-w-[140px] truncate text-slate-900 font-bold">
          {activeClinicName || 'All Clinics'}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.1)] border border-slate-100 py-2 z-50 animate-fadeIn">
          <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Select Active Practice
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            <button
              onClick={() => {
                setActiveClinic(null, 'All Clinics');
                setOpen(false);
              }}
              className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                !activeClinicId ? 'bg-blue-50 text-[#2563EB] font-bold' : 'text-slate-700'
              }`}
            >
              <span>🌐 All Clinics (Overview)</span>
              {!activeClinicId && <span className="text-[#2563EB] font-bold">✓</span>}
            </button>

            {clinics.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveClinic(c.id, c.name);
                  setOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  activeClinicId === c.id ? 'bg-blue-50 text-[#2563EB] font-bold' : 'text-slate-700'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">/{c.slug}</div>
                </div>
                {activeClinicId === c.id && <span className="text-[#2563EB] font-bold">✓</span>}
              </button>
            ))}
          </div>

          <div className="pt-1.5 mt-1 border-t border-slate-100 px-3">
            <Link
              href="/dashboard/clinics"
              onClick={() => setOpen(false)}
              className="block w-full py-1.5 text-center text-xs font-semibold text-[#2563EB] hover:bg-blue-50/60 rounded-lg transition-colors"
            >
              ⚙️ Manage Clinics &amp; Register New
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
