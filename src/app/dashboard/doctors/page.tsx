'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialization: string;
  license_number: string;
  working_days: string;
  working_hours_start: string;
  working_hours_end: string;
  consultation_fee: number;
  notes: string;
  created_at: string;
}

const emptyDoctor = {
  first_name: '', last_name: '', email: '', phone: '',
  specialization: '', license_number: '',
  working_days: 'Mon,Tue,Wed,Thu,Fri',
  working_hours_start: '09:00', working_hours_end: '17:00',
  consultation_fee: 0, notes: '',
};

const specializations = [
  'General Dentistry', 'Orthodontics', 'Endodontics', 'Periodontics',
  'Prosthodontics', 'Oral Surgery', 'Pediatric Dentistry', 'Cosmetic Dentistry',
  'Implantology', 'Oral Pathology',
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState(emptyDoctor);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch(`/api/doctors?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setDoctors(data.data || []);
    } catch {
      showToast('Failed to load doctors', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const openAddModal = () => { setEditingDoctor(null); setForm(emptyDoctor); setShowModal(true); };
  const openEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setForm({
      first_name: doc.first_name || '', last_name: doc.last_name || '',
      email: doc.email || '', phone: doc.phone || '',
      specialization: doc.specialization || '', license_number: doc.license_number || '',
      working_days: doc.working_days || 'Mon,Tue,Wed,Thu,Fri',
      working_hours_start: doc.working_hours_start || '09:00',
      working_hours_end: doc.working_hours_end || '17:00',
      consultation_fee: doc.consultation_fee || 0, notes: doc.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingDoctor ? `/api/doctors/${editingDoctor.id}` : '/api/doctors';
      const method = editingDoctor ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      showToast(editingDoctor ? 'Doctor updated!' : 'Doctor added!', 'success');
      setShowModal(false);
      fetchDoctors();
    } catch (err: any) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this doctor?')) return;
    try {
      await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
      showToast('Doctor deleted', 'success');
      fetchDoctors();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const updateForm = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2238] tracking-tight">Doctors</h1>
          <p className="text-slate-500 text-sm mt-1">Manage clinical staff and practitioners</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all self-start sm:self-auto">
          <span>+</span> Add Doctor
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <input type="text" placeholder="Search doctors by name or specialization..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 flex items-center justify-center h-48"><div className="spinner" /></div>
        ) : doctors.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center h-48 text-slate-400">
            <span className="text-4xl mb-2">🩺</span><p>No doctors found</p>
          </div>
        ) : (
          doctors.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] card-hover transition-all">
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-blue-500/25">
                  {doc.first_name[0]}{doc.last_name[0]}
                </div>
                <div>
                  <h3 className="text-[#1E2238] font-bold text-base">Dr. {doc.first_name} {doc.last_name}</h3>
                  <p className="text-blue-600 font-semibold text-xs mt-0.5">{doc.specialization}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {doc.phone && <p className="text-slate-600 flex items-center gap-2"><span>📞</span> {doc.phone}</p>}
                {doc.email && <p className="text-slate-600 flex items-center gap-2"><span>✉️</span> {doc.email}</p>}
                <p className="text-slate-600 flex items-center gap-2"><span>🕐</span> {doc.working_hours_start?.slice(0, 5)} - {doc.working_hours_end?.slice(0, 5)}</p>
                <p className="text-slate-600 flex items-center gap-2"><span>📅</span> {doc.working_days}</p>
                {doc.consultation_fee > 0 && <p className="text-emerald-700 font-bold flex items-center gap-2"><span>💰</span> ${doc.consultation_fee} fee</p>}
              </div>
              <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
                <button onClick={() => openEditModal(doc)} className="flex-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">Edit</button>
                <button onClick={() => handleDelete(doc.id)} className="px-3 py-2 text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-colors">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDoctor ? 'Edit Doctor' : 'Add New Doctor'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">First Name *</label>
              <input type="text" required value={form.first_name} onChange={(e) => updateForm('first_name', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name *</label>
              <input type="text" required value={form.last_name} onChange={(e) => updateForm('last_name', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Specialization *</label>
              <select required value={form.specialization} onChange={(e) => updateForm('specialization', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15">
                <option value="">Select</option>
                {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">License Number</label>
              <input type="text" value={form.license_number} onChange={(e) => updateForm('license_number', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Work Start</label>
              <input type="time" value={form.working_hours_start} onChange={(e) => updateForm('working_hours_start', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Work End</label>
              <input type="time" value={form.working_hours_end} onChange={(e) => updateForm('working_hours_end', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Working Days</label>
              <input type="text" value={form.working_days} onChange={(e) => updateForm('working_days', e.target.value)}
                placeholder="Mon,Tue,Wed,Thu,Fri"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Consultation Fee ($)</label>
              <input type="number" step="0.01" value={form.consultation_fee} onChange={(e) => updateForm('consultation_fee', parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
              <textarea value={form.notes} rows={2} onChange={(e) => updateForm('notes', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Add Doctor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
