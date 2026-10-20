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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Appointments</h1>
          <p className="text-slate-400 text-sm mt-1">Schedule and manage appointments</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-500 hover:to-cyan-500 shadow-lg shadow-teal-500/20 flex items-center gap-2">
          <span>+</span> Book Appointment
        </button>
      </div>

      <div className="glass rounded-xl p-4 flex flex-wrap gap-4">
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        {(dateFilter || statusFilter) && (
          <button onClick={() => { setDateFilter(''); setStatusFilter(''); }} className="px-3 py-2 text-sm text-teal-400 hover:text-teal-300">Clear filters</button>
        )}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="spinner" /></div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <span className="text-4xl mb-2">📅</span><p>No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Patient</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Doctor</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Treatment</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date & Time</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-slate-800 table-row-hover">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">
                        {apt.patients?.first_name} {apt.patients?.last_name}
                      </p>
                      <p className="text-xs text-slate-400">{apt.patients?.phone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white">Dr. {apt.doctors?.first_name} {apt.doctors?.last_name}</p>
                      <p className="text-xs text-slate-400">{apt.doctors?.specialization}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">{apt.treatments?.name || '—'}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white">{new Date(apt.appointment_date).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-400">{apt.start_time?.slice(0, 5)}{apt.end_time ? ` - ${apt.end_time.slice(0, 5)}` : ''}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={apt.status}
                        onChange={(e) => updateStatus(apt.id, e.target.value)}
                        className={`badge status-${apt.status} bg-transparent border-0 cursor-pointer text-xs px-0`}
                      >
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => openEditModal(apt)} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-md mr-2">Edit</button>
                      {apt.status !== 'cancelled' && (
                        <button onClick={() => handleCancel(apt.id)} className="px-3 py-1.5 text-xs bg-red-900/30 hover:bg-red-800/40 text-red-400 rounded-md">Cancel</button>
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
            <label className="block text-sm font-medium text-slate-300 mb-1">Patient *</label>
            <select required value={form.patient_id} onChange={(e) => updateForm('patient_id', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm">
              <option value="">Select Patient</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Doctor *</label>
            <select required value={form.doctor_id} onChange={(e) => updateForm('doctor_id', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm">
              <option value="">Select Doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} - {d.specialization}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Treatment</label>
            <select value={form.treatment_id} onChange={(e) => updateForm('treatment_id', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm">
              <option value="">Select Treatment (optional)</option>
              {treatments.map((t) => <option key={t.id} value={t.id}>{t.name} - ${t.cost}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Date *</label>
              <input type="date" required value={form.appointment_date} onChange={(e) => updateForm('appointment_date', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Start Time *</label>
              <input type="time" required value={form.start_time} onChange={(e) => updateForm('start_time', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">End Time</label>
              <input type="time" value={form.end_time} onChange={(e) => updateForm('end_time', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm" />
            </div>
          </div>
          {editingApt && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
              <select value={form.status} onChange={(e) => updateForm('status', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm">
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea value={form.notes} rows={2} onChange={(e) => updateForm('notes', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving...' : editingApt ? 'Update' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
