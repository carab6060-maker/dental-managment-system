'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingApt, setEditingApt] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const { showToast } = useToast();

  const [form, setForm] = useState({
    patient_id: '', doctor_id: '', treatment_id: '',
    appointment_date: '', start_time: '', end_time: '',
    status: 'scheduled', notes: '',
  });

  const fetchAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (dateFilter) params.set('date', dateFilter);
      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json();
      setAppointments(data.data || []);
    } catch {
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, showToast]);

  const fetchDropdowns = useCallback(async () => {
    const [pRes, dRes, tRes] = await Promise.all([
      fetch('/api/patients?limit=500'),
      fetch('/api/doctors'),
      fetch('/api/treatments'),
    ]);
    const [pData, dData, tData] = await Promise.all([pRes.json(), dRes.json(), tRes.json()]);
    setPatients(pData.data || []);
    setDoctors(dData.data || []);
    setTreatments(tData.data || []);
  }, []);

  useEffect(() => { fetchAppointments(); fetchDropdowns(); }, [fetchAppointments, fetchDropdowns]);

  const openAddModal = () => {
    setEditingApt(null);
    setForm({ patient_id: '', doctor_id: '', treatment_id: '', appointment_date: '', start_time: '', end_time: '', status: 'scheduled', notes: '' });
    setShowModal(true);
  };

  const openEditModal = (apt: any) => {
    setEditingApt(apt);
    setForm({
      patient_id: apt.patient_id, doctor_id: apt.doctor_id,
      treatment_id: apt.treatment_id || '', appointment_date: apt.appointment_date,
      start_time: apt.start_time?.slice(0, 5), end_time: apt.end_time?.slice(0, 5) || '',
      status: apt.status, notes: apt.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingApt ? `/api/appointments/${editingApt.id}` : '/api/appointments';
      const method = editingApt ? 'PUT' : 'POST';
      const body = { ...form };
      if (!body.treatment_id) delete (body as any).treatment_id;
      if (!body.end_time) delete (body as any).end_time;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      showToast(editingApt ? 'Appointment updated!' : 'Appointment booked!', 'success');
      setShowModal(false);
      fetchAppointments();
    } catch (err: any) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      showToast(`Status updated to ${status}`, 'success');
      fetchAppointments();
    } catch { showToast('Failed to update status', 'error'); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      showToast('Appointment cancelled', 'success');
      fetchAppointments();
    } catch { showToast('Failed to cancel', 'error'); }
  };

  const updateForm = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const statuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2238] tracking-tight">Appointments</h1>
          <p className="text-slate-500 text-sm mt-1">Schedule and manage patient appointments</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all self-start sm:self-auto">
          <span>+</span> Book Appointment
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-wrap gap-4 items-center">
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        {(dateFilter || statusFilter) && (
          <button onClick={() => { setDateFilter(''); setStatusFilter(''); }} className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">Clear filters</button>
        )}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="spinner" /></div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <span className="text-4xl mb-2">📅</span><p>No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80">
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Doctor</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Treatment</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {apt.patients?.first_name} {apt.patients?.last_name}
                      </p>
                      <p className="text-xs text-slate-400">{apt.patients?.phone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">Dr. {apt.doctors?.first_name} {apt.doctors?.last_name}</p>
                      <p className="text-xs text-slate-400">{apt.doctors?.specialization}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{apt.treatments?.name || '—'}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">{new Date(apt.appointment_date).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-400">{apt.start_time?.slice(0, 5)}{apt.end_time ? ` - ${apt.end_time.slice(0, 5)}` : ''}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={apt.status}
                        onChange={(e) => updateStatus(apt.id, e.target.value)}
                        className={`badge status-${apt.status} cursor-pointer text-xs`}
                      >
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => openEditModal(apt)} className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors mr-2">Edit</button>
                      {apt.status !== 'cancelled' && (
                        <button onClick={() => handleCancel(apt.id)} className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingApt ? 'Edit Appointment' : 'Book Appointment'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Patient *</label>
            <select required value={form.patient_id} onChange={(e) => updateForm('patient_id', e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15">
              <option value="">Select Patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Doctor *</label>
            <select required value={form.doctor_id} onChange={(e) => updateForm('doctor_id', e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15">
              <option value="">Select Doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} - {d.specialization}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Treatment</label>
            <select value={form.treatment_id} onChange={(e) => updateForm('treatment_id', e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15">
              <option value="">Select Treatment (optional)</option>
              {treatments.map((t) => <option key={t.id} value={t.id}>{t.name} - ${t.cost}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Date *</label>
              <input type="date" required value={form.appointment_date} onChange={(e) => updateForm('appointment_date', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time *</label>
              <input type="time" required value={form.start_time} onChange={(e) => updateForm('start_time', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">End Time</label>
              <input type="time" value={form.end_time} onChange={(e) => updateForm('end_time', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
          </div>
          {editingApt && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => updateForm('status', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15">
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} rows={2} onChange={(e) => updateForm('notes', e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : editingApt ? 'Update' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
