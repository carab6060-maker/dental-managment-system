'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  const kpiCards = [
    { label: 'Total Patients', value: stats?.totalPatients || 0, icon: '👥', color: 'from-blue-600 to-blue-400', change: '+12%' },
    { label: 'Active Doctors', value: stats?.totalDoctors || 0, icon: '🩺', color: 'from-emerald-600 to-emerald-400', change: '' },
    { label: "Today's Appointments", value: stats?.todayAppointments || 0, icon: '📅', color: 'from-violet-600 to-violet-400', change: '' },
    { label: 'Monthly Revenue', value: `$${(stats?.monthlyRevenue || 0).toLocaleString()}`, icon: '💰', color: 'from-amber-600 to-amber-400', change: '' },
    { label: 'Pending Invoices', value: stats?.pendingInvoices || 0, icon: '📄', color: 'from-rose-600 to-rose-400', change: '' },
    { label: 'Outstanding Balance', value: `$${(stats?.totalOutstanding || 0).toLocaleString()}`, icon: '⚠️', color: 'from-orange-600 to-orange-400', change: '' },
  ];

  const maxRevenue = Math.max(...(stats?.revenueByMonth?.map((r) => r.revenue) || [1]));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, <span className="gradient-text">{user?.fullName}</span>
        </h1>
        <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening at your practice today</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card, i) => (
          <div
            key={i}
            className="glass rounded-xl p-5 card-hover"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                {card.change && (
                  <p className="text-xs text-emerald-400 mt-1">{card.change} from last month</p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-xl shadow-lg`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart (simple bar chart) */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue (Last 6 Months)</h3>
          <div className="flex items-end gap-3 h-48">
            {stats?.revenueByMonth?.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-slate-400">
                  ${item.revenue >= 1000 ? `${(item.revenue / 1000).toFixed(1)}k` : item.revenue}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-teal-600 to-cyan-500 rounded-t-md transition-all hover:from-teal-500 hover:to-cyan-400"
                  style={{
                    height: `${maxRevenue > 0 ? (item.revenue / maxRevenue) * 140 : 4}px`,
                    minHeight: '4px',
                  }}
                />
                <span className="text-xs text-slate-500">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Today&apos;s Appointments</h3>
          {stats?.todayAppointmentsList && stats.todayAppointmentsList.length > 0 ? (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {stats.todayAppointmentsList.map((apt: any) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50"
                >
                  <div className="w-10 h-10 rounded-full bg-teal-600/20 flex items-center justify-center text-teal-400 font-semibold">
                    {apt.patients?.first_name?.[0]}{apt.patients?.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {apt.patients?.first_name} {apt.patients?.last_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Dr. {apt.doctors?.first_name} {apt.doctors?.last_name} • {apt.start_time?.slice(0, 5)}
                    </p>
                  </div>
                  <span className={`badge status-${apt.status}`}>{apt.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500">
              <p>No appointments scheduled for today</p>
            </div>
          )}
        </div>

        {/* Appointment Status Breakdown */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Appointment Status (This Month)</h3>
          {stats?.appointmentStatusBreakdown && Object.keys(stats.appointmentStatusBreakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.appointmentStatusBreakdown).map(([status, count]) => {
                const total = Object.values(stats.appointmentStatusBreakdown).reduce((a, b) => a + b, 0);
                const percent = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className={`badge status-${status}`}>{status}</span>
                      <span className="text-slate-400">{count} ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-500">
              <p>No appointment data this month</p>
            </div>
          )}
        </div>

        {/* Recent Patients */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Patients</h3>
          {stats?.recentPatients && stats.recentPatients.length > 0 ? (
            <div className="space-y-3">
              {stats.recentPatients.map((patient: any) => (
                <div
                  key={patient.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-semibold">
                    {patient.first_name?.[0]}{patient.last_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-xs text-slate-400">{patient.phone}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(patient.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-500">
              <p>No patients registered yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
