'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_group: string;
  allergies: string;
  medical_history: string;
  insurance_provider: string;
  insurance_number: string;
  notes: string;
  created_at: string;
}

const emptyPatient = {
  first_name: '', last_name: '', date_of_birth: '', gender: 'male',
  email: '', phone: '', address: '', city: '',
  emergency_contact_name: '', emergency_contact_phone: '',
  blood_group: '', allergies: '', medical_history: '',
  insurance_provider: '', insurance_number: '', notes: '',
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState(emptyPatient);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setPatients(data.data || []);
    } catch (err) {
      showToast('Failed to load patients', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const openAddModal = () => {
    setEditingPatient(null);
    setForm(emptyPatient);
    setShowModal(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setForm({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || 'male',
      email: patient.email || '',
      phone: patient.phone || '',
      address: patient.address || '',
      city: patient.city || '',
      emergency_contact_name: patient.emergency_contact_name || '',
      emergency_contact_phone: patient.emergency_contact_phone || '',
      blood_group: patient.blood_group || '',
      allergies: patient.allergies || '',
      medical_history: patient.medical_history || '',
      insurance_provider: patient.insurance_provider || '',
      insurance_number: patient.insurance_number || '',
      notes: patient.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingPatient ? `/api/patients/${editingPatient.id}` : '/api/patients';
      const method = editingPatient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save patient');
      }

      showToast(editingPatient ? 'Patient updated!' : 'Patient added!', 'success');
      setShowModal(false);
      fetchPatients();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;

    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Patient deleted', 'success');
      fetchPatients();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2238] tracking-tight">Patients</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track your patient records</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <span>+</span> Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <input
          type="text"
          placeholder="Search patients by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="spinner" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <span className="text-4xl mb-2">👥</span>
            <p>No patients found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80">
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">DOB</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Insurance</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {patient.first_name[0]}{patient.last_name[0]}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{patient.first_name} {patient.last_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">{patient.phone}</p>
                      <p className="text-xs text-slate-400">{patient.email || '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 capitalize">{patient.gender || '—'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{patient.insurance_provider || '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEditModal(patient)}
                        className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(patient.id)}
                        className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPatient ? 'Edit Patient' : 'Add New Patient'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text" required value={form.first_name}
                onChange={(e) => updateForm('first_name', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text" required value={form.last_name}
                onChange={(e) => updateForm('last_name', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Phone *</label>
              <input
                type="tel" required value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email" value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date" value={form.date_of_birth}
                onChange={(e) => updateForm('date_of_birth', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => updateForm('gender', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={form.blood_group}
                onChange={(e) => updateForm('blood_group', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              >
                <option value="">Select</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text" value={form.city}
                onChange={(e) => updateForm('city', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text" value={form.address}
                onChange={(e) => updateForm('address', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
              <input
                type="text" value={form.emergency_contact_name}
                onChange={(e) => updateForm('emergency_contact_name', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
              <input
                type="tel" value={form.emergency_contact_phone}
                onChange={(e) => updateForm('emergency_contact_phone', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Insurance Provider</label>
              <input
                type="text" value={form.insurance_provider}
                onChange={(e) => updateForm('insurance_provider', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Insurance Number</label>
              <input
                type="text" value={form.insurance_number}
                onChange={(e) => updateForm('insurance_number', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Allergies</label>
              <textarea
                value={form.allergies} rows={2}
                onChange={(e) => updateForm('allergies', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Medical History</label>
              <textarea
                value={form.medical_history} rows={2}
                onChange={(e) => updateForm('medical_history', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                value={form.notes} rows={2}
                onChange={(e) => updateForm('notes', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving...' : editingPatient ? 'Update Patient' : 'Add Patient'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
