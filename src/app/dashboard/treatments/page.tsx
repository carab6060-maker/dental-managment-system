'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Treatment {
  id: string;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  cost: number;
  created_at: string;
}

const emptyTreatment = {
  name: '', category: '', description: '', duration_minutes: 30, cost: 0,
};

const categories = [
  'Preventive', 'Diagnostic', 'Restorative', 'Endodontic', 'Oral Surgery',
  'Cosmetic', 'Orthodontic', 'Periodontic', 'Prosthodontic', 'Implantology',
];

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [form, setForm] = useState(emptyTreatment);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchTreatments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await fetch(`/api/treatments?${params}`);
      const data = await res.json();
      setTreatments(data.data || []);
    } catch {
      showToast('Failed to load treatments', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, showToast]);

  useEffect(() => { fetchTreatments(); }, [fetchTreatments]);

  const openAddModal = () => { setEditingTreatment(null); setForm(emptyTreatment); setShowModal(true); };
  const openEditModal = (t: Treatment) => {
    setEditingTreatment(t);
    setForm({ name: t.name, category: t.category, description: t.description || '', duration_minutes: t.duration_minutes, cost: t.cost });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingTreatment ? `/api/treatments/${editingTreatment.id}` : '/api/treatments';
      const method = editingTreatment ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast(editingTreatment ? 'Treatment updated!' : 'Treatment added!', 'success');
      setShowModal(false);
      fetchTreatments();
    } catch (err: any) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this treatment?')) return;
    try {
      await fetch(`/api/treatments/${id}`, { method: 'DELETE' });
      showToast('Treatment deleted', 'success');
      fetchTreatments();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const updateForm = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  // Group by category
  const grouped = treatments.reduce((acc: Record<string, Treatment[]>, t) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2238] tracking-tight">Treatments</h1>
          <p className="text-slate-500 text-sm mt-1">Manage dental treatment catalog & pricing</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all self-start sm:self-auto">
          <span>+</span> Add Treatment
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-wrap gap-4 items-center">
        <input type="text" placeholder="Search treatments..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white text-sm" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="spinner" /></div>
      ) : treatments.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center h-48 text-slate-400">
          <span className="text-4xl mb-2">💊</span><p>No treatments found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-xs font-bold text-[#1E2238] uppercase tracking-wider">{category}</h3>
                <span className="text-xs text-slate-400">({items.length})</span>
              </div>
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80">
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Treatment</th>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                      <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Cost</th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4 text-sm font-semibold text-slate-800">{t.name}</td>
                        <td className="px-5 py-4 text-sm text-slate-500 max-w-xs truncate">{t.description || '—'}</td>
                        <td className="px-5 py-4 text-sm text-center text-slate-600 font-medium">{t.duration_minutes} min</td>
                        <td className="px-5 py-4 text-sm text-right text-emerald-600 font-bold">${t.cost.toFixed(2)}</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => openEditModal(t)} className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors mr-2">Edit</button>
                          <button onClick={() => handleDelete(t.id)} className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTreatment ? 'Edit Treatment' : 'Add New Treatment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Treatment Name *</label>
            <input type="text" required value={form.name} onChange={(e) => updateForm('name', e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
              <select required value={form.category} onChange={(e) => updateForm('category', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15">
                <option value="">Select</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (minutes) *</label>
              <input type="number" required min="5" value={form.duration_minutes} onChange={(e) => updateForm('duration_minutes', parseInt(e.target.value))}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Cost ($) *</label>
            <input type="number" required step="0.01" min="0" value={form.cost} onChange={(e) => updateForm('cost', parseFloat(e.target.value))}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
            <textarea value={form.description} rows={3} onChange={(e) => updateForm('description', e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : editingTreatment ? 'Update' : 'Add Treatment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
