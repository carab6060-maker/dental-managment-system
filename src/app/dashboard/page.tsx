'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  todayAppointmentsList: any[];
  monthlyRevenue: number;
  pendingInvoices: number;
  totalOutstanding: number;
  upcomingAppointments: number;
  recentPatients: any[];
  revenueByMonth: { month: string; revenue: number }[];
  appointmentStatusBreakdown: Record<string, number>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="spinner" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'TOTAL PATIENTS',
      value: stats?.totalPatients ?? 0,
      borderClass: 'border-l-[#1E2238]',
    },
    {
      label: 'AVAILABLE DOCTORS',
      value: stats?.totalDoctors ?? 0,
      borderClass: 'border-l-emerald-500',
    },
    {
      label: 'TODAY APPOINTMENTS',
      value: stats?.todayAppointments ?? 0,
      borderClass: 'border-l-amber-500',
    },
    {
      label: 'TOTAL REVENUE',
      value: `$${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      borderClass: 'border-l-blue-600',
    },
  ];

  const maxRevenue = Math.max(...(stats?.revenueByMonth?.map((r) => r.revenue) || [1000]));

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* Overview Banner with Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2238] tracking-tight">
            Clinic & Operations Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Live database summary of patients, appointments, and clinic activity
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="self-start sm:self-auto px-4 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 active:scale-98 text-slate-700 rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 transition-all"
        >
          <svg
            className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>

      {/* 4 Stat KPI Cards matching the screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 border-l-4 ${kpi.borderClass} card-hover transition-all`}
          >
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              {kpi.label}
            </p>
            <p className="text-3xl font-extrabold text-[#1E2238] mt-2 tracking-tight">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main Charts & Visualizations (Matching CarRent SaaS Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Panel: Clinic Availability / Status Donut */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1E2238]">
                Clinic Availability
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time appointment & doctor status distribution
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 text-xs font-semibold">
              {stats?.totalDoctors || 4} Available Doctors
            </span>
          </div>

          {/* Large Donut Ring Matching the screenshot */}
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#F1F5F9"
                  strokeWidth="14"
                />
                {/* Emerald Green Main Arc matching CarRent Donut */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#059669"
                  strokeWidth="14"
                  strokeDasharray="238.76"
                  strokeDashoffset={
                    (stats?.todayAppointments ?? 0) > 0 ? '60' : '20'
                  }
                  strokeLinecap="round"
                />
                {/* Secondary Blue Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#2563EB"
                  strokeWidth="14"
                  strokeDasharray="238.76"
                  strokeDashoffset="190"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-[#1E2238]">
                  {stats?.totalDoctors || 4}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Docs
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <span>Operating ({stats?.totalDoctors || 4})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span>Appointments ({stats?.todayAppointments || 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300" />
                <span>Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Monthly Dental Booking Activity (Dual Bar Chart) */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1E2238]">
                Rental & Booking Activity
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly appointment volume and collected revenue
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60 text-xs font-semibold">
              Recent Activity
            </span>
          </div>

          {/* Bar Chart Matching Blue & Navy Columns in Screenshot */}
          <div className="py-6">
            <div className="flex items-end justify-around gap-4 h-52 pt-4 px-2 border-b border-slate-100">
              {stats?.revenueByMonth && stats.revenueByMonth.length > 0 ? (
                stats.revenueByMonth.map((item, i) => {
                  const revHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 160 : 20;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 max-w-[60px]">
                      <div className="w-full flex items-end justify-center gap-1.5 h-44">
                        {/* Blue Bar (Appointments / Volume) */}
                        <div
                          className="w-1/2 bg-[#2563EB] rounded-t-md transition-all hover:bg-blue-700"
                          style={{
                            height: `${Math.max(revHeight * 0.9, 15)}px`,
                          }}
                          title={`Volume: ${item.month}`}
                        />
                        {/* Dark Navy Bar (Revenue Collected) */}
                        <div
                          className="w-1/2 bg-[#1E2238] rounded-t-md transition-all hover:bg-slate-900"
                          style={{
                            height: `${Math.max(revHeight, 20)}px`,
                          }}
                          title={`Revenue: $${item.revenue}`}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        {item.month}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center w-full h-40 text-slate-400 text-sm">
                  No revenue records recorded yet
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#2563EB]" />
                <span>Appointment Volume</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#1E2238]" />
                <span>Collected Revenue</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Grid: Today's Appointments & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Appointments */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#1E2238]">
              Today&apos;s Appointments
            </h3>
            <Link
              href="/dashboard/appointments"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>

          {stats?.todayAppointmentsList && stats.todayAppointmentsList.length > 0 ? (
            <div className="space-y-3">
              {stats.todayAppointmentsList.map((apt: any) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {apt.patients?.first_name?.[0]}{apt.patients?.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1E2238] truncate">
                      {apt.patients?.first_name} {apt.patients?.last_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Dr. {apt.doctors?.first_name} {apt.doctors?.last_name} • {apt.start_time?.slice(0, 5)}
                    </p>
                  </div>
                  <span className={`badge status-${apt.status}`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-36 text-slate-400 text-sm">
              <span className="text-2xl mb-1">📅</span>
              <p>No appointments scheduled for today</p>
            </div>
          )}
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#1E2238]">
              Recent Patients
            </h3>
            <Link
              href="/dashboard/patients"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>

          {stats?.recentPatients && stats.recentPatients.length > 0 ? (
            <div className="space-y-3">
              {stats.recentPatients.map((patient: any) => (
                <div
                  key={patient.id}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {patient.first_name?.[0]}{patient.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1E2238] truncate">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {patient.phone} • {patient.city || 'Patient'}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {new Date(patient.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-36 text-slate-400 text-sm">
              <span className="text-2xl mb-1">👥</span>
              <p>No patients registered yet</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
