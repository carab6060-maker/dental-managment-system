'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'appointments' | 'treatments'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'this_month' | 'this_year' | 'custom'>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);

  // Report Data States
  const [revenueData, setRevenueData] = useState<any>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [treatmentData, setTreatmentData] = useState<any>(null);

  const { showToast } = useToast();

  const getDateParams = useCallback(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let fromStr = '';

    if (dateRange === '7d') {
      fromStr = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    } else if (dateRange === '30d') {
      fromStr = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    } else if (dateRange === 'this_month') {
      fromStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    } else if (dateRange === 'this_year') {
      fromStr = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
    } else if (dateRange === 'custom') {
      return {
        from: customFrom || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        to: customTo || todayStr,
      };
    }
    return { from: fromStr, to: todayStr };
  }, [dateRange, customFrom, customTo]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getDateParams();
      const query = `from=${from}&to=${to}`;

      const [revRes, aptRes, patRes, trtRes] = await Promise.all([
        fetch(`/api/reports?type=revenue&${query}`),
        fetch(`/api/reports?type=appointments&${query}`),
        fetch(`/api/reports?type=patients&${query}`),
        fetch(`/api/reports?type=treatments&${query}`),
      ]);

      const [rev, apt, pat, trt] = await Promise.all([
        revRes.json(),
        aptRes.json(),
        patRes.json(),
        trtRes.json(),
      ]);

      setRevenueData(rev);
      setAppointmentData(apt);
      setPatientData(pat);
      setTreatmentData(trt);
    } catch {
      showToast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  }, [getDateParams, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const totalRev = Number(revenueData?.totalRevenue || 0);
  const totalApts = Number(appointmentData?.totalAppointments || 0);
  const newPatients = Number(patientData?.newPatients || 0);
  const completedTreatments = Number(treatmentData?.totalCompleted || 0);

  // Method breakdown array
  const methods = Object.entries(revenueData?.byMethod || {}).map(([method, amount]) => ({
    method: method.replace('_', ' '),
    amount: Number(amount),
    pct: totalRev > 0 ? (Number(amount) / totalRev) * 100 : 0,
  }));

  // Status breakdown array
  const statuses = Object.entries(appointmentData?.statusBreakdown || {}).map(([status, count]) => ({
    status,
    count: Number(count),
    pct: totalApts > 0 ? (Number(count) / totalApts) * 100 : 0,
  }));

  // Doctor breakdown array
  const doctors = Object.entries(appointmentData?.byDoctor || {})
    .map(([doctor, count]) => ({
      doctor,
      count: Number(count),
      pct: totalApts > 0 ? (Number(count) / totalApts) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Treatments breakdown array
  const treatments = Object.entries(treatmentData?.byTreatment || {})
    .map(([name, data]: [string, any]) => ({
      name,
      count: Number(data.count || 0),
      revenue: Number(data.revenue || 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Clinical Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Performance metrics, revenue streams, appointment trends, and procedure insights
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary text-xs flex items-center gap-2"
          >
            <span>🖨️</span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-2 uppercase">Period:</span>
          {(
            [
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'this_year', label: 'This Year' },
              { id: 'custom', label: 'Custom' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setDateRange(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateRange === t.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="input-field py-1 text-xs"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="input-field py-1 text-xs"
            />
          </div>
        )}
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Period Revenue</span>
            <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg">
              💵
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-3">
            ${totalRev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">{revenueData?.paymentCount || 0} transactions</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Appointments Booked</span>
            <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg">
              📅
            </span>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{totalApts}</p>
          <p className="text-xs text-slate-500 mt-1">
            {appointmentData?.statusBreakdown?.completed || 0} completed
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">New Patients</span>
            <span className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-lg">
              👥
            </span>
          </div>
          <p className="text-2xl font-bold text-white mt-3">{newPatients}</p>
          <p className="text-xs text-slate-500 mt-1">Registered in range</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Procedures Performed</span>
            <span className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center text-lg">
              🩺
            </span>
          </div>
          <p className="text-2xl font-bold text-teal-400 mt-3">{completedTreatments}</p>
          <p className="text-xs text-slate-500 mt-1">Finished treatments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors ${
            activeTab === 'overview'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`pb-3 transition-colors ${
            activeTab === 'revenue'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          💰 Revenue & Payments
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 transition-colors ${
            activeTab === 'appointments'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📅 Appointments & Doctors
        </button>
        <button
          onClick={() => setActiveTab('treatments')}
          className={`pb-3 transition-colors ${
            activeTab === 'treatments'
              ? 'text-teal-400 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          💊 Procedure Performance
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-slate-500">
          <div className="inline-block animate-spin text-3xl mb-3">🌀</div>
          <p>Analyzing metrics and generating reports...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Method */}
              <div className="glass-card p-5 space-y-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>💳</span> Payment Method Breakdown
                </h3>
                {methods.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">No payment data recorded in this period</p>
                ) : (
                  <div className="space-y-3">
                    {methods.map((m) => (
                      <div key={m.method} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize font-medium text-slate-300">{m.method}</span>
                          <span className="text-emerald-400 font-semibold">
                            ${m.amount.toFixed(2)} ({m.pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full"
                            style={{ width: `${Math.min(100, m.pct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Appointment Status Distribution */}
              <div className="glass-card p-5 space-y-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>📊</span> Appointment Status Distribution
                </h3>
                {statuses.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">No appointments in this range</p>
                ) : (
                  <div className="space-y-3">
                    {statuses.map((s) => (
                      <div key={s.status} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize font-medium text-slate-300">{s.status}</span>
                          <span className="text-white font-semibold">
                            {s.count} visits ({s.pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.status === 'completed'
                                ? 'bg-emerald-500'
                                : s.status === 'scheduled'
                                ? 'bg-blue-500'
                                : s.status === 'cancelled'
                                ? 'bg-red-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, s.pct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Treatments by Revenue */}
              <div className="glass-card p-5 space-y-4 lg:col-span-2">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>🏆</span> Top Revenue Generating Treatments
                </h3>
                {treatments.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">No completed treatments recorded</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5">Procedure</th>
                          <th className="py-2.5 text-center">Completed Visits</th>
                          <th className="py-2.5 text-right">Revenue Generated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {treatments.slice(0, 5).map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-2.5 font-medium text-white">{t.name}</td>
                            <td className="py-2.5 text-center">{t.count}</td>
                            <td className="py-2.5 text-right font-bold text-emerald-400">
                              ${t.revenue.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REVENUE & PAYMENTS */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="glass-card p-5">
                <h3 className="text-base font-semibold text-white mb-4">Detailed Payment Receipts</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/60 uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Invoice #</th>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {revenueData?.payments?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                            No payment transactions recorded in this period
                          </td>
                        </tr>
                      ) : (
                        revenueData?.payments?.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-800/40">
                            <td className="px-4 py-3 text-slate-400">
                              {new Date(p.payment_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 font-mono text-teal-400">
                              {p.invoices?.invoice_number || `INV-${p.invoice_id?.slice(0, 6)}`}
                            </td>
                            <td className="px-4 py-3 text-white">
                              {p.patients
                                ? `${p.patients.first_name} ${p.patients.last_name}`
                                : 'Patient'}
                            </td>
                            <td className="px-4 py-3 capitalize text-slate-300">
                              {p.payment_method?.replace('_', ' ')}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-400">
                              {p.reference_number || '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-400">
                              ${Number(p.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPOINTMENTS & DOCTORS */}
          {activeTab === 'appointments' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Doctor Caseload */}
              <div className="glass-card p-5 space-y-4">
                <h3 className="text-base font-semibold text-white">Doctor Workload & Caseload</h3>
                {doctors.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">No doctor appointments found</p>
                ) : (
                  <div className="space-y-3">
                    {doctors.map((d) => (
                      <div key={d.doctor} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-300">{d.doctor}</span>
                          <span className="text-teal-400 font-semibold">{d.count} appointments</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${Math.min(100, d.pct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Breakdown */}
              <div className="glass-card p-5 space-y-4">
                <h3 className="text-base font-semibold text-white">Appointment Outcomes</h3>
                {statuses.length === 0 ? (
                  <p className="text-sm text-slate-500 py-6 text-center">No appointment status records</p>
                ) : (
                  <div className="space-y-3">
                    {statuses.map((s) => (
                      <div key={s.status} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize font-medium text-slate-300">{s.status}</span>
                          <span className="text-white font-semibold">{s.count} visits</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, s.pct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PROCEDURES */}
          {activeTab === 'treatments' && (
            <div className="glass-card p-5">
              <h3 className="text-base font-semibold text-white mb-4">Complete Procedure Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Treatment / Procedure</th>
                      <th className="px-4 py-3 text-center">Completed Count</th>
                      <th className="px-4 py-3 text-right">Total Revenue</th>
                      <th className="px-4 py-3 text-right">Avg Revenue Per Visit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {treatments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          No treatment records found in this range
                        </td>
                      </tr>
                    ) : (
                      treatments.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-medium text-white">{t.name}</td>
                          <td className="px-4 py-3 text-center text-slate-300">{t.count}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-400">
                            ${t.revenue.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400">
                            ${t.count > 0 ? (t.revenue / t.count).toFixed(2) : '0.00'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
