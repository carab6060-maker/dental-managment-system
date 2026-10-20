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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Treatments</h1>
          <p className="text-slate-400 text-sm mt-1">Manage treatment catalog & pricing</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-500 hover:to-cyan-500 shadow-lg shadow-teal-500/20 flex items-center gap-2">
          <span>+</span> Add Treatment
        </button>
      </div>

      <div className="glass rounded-xl p-4 flex gap-4">
        <input type="text" placeholder="Search treatments..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="spinner" /></div>
      ) : treatments.length === 0 ? (
        <div className="glass rounded-xl flex flex-col items-center justify-center h-48 text-slate-500">
          <span className="text-4xl mb-2">💊</span><p>No treatments found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">{category}</h3>
              <div className="glass rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Treatment</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Description</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Duration</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Cost</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t) => (
                      <tr key={t.id} className="border-b border-slate-800 table-row-hover">
                        <td className="px-5 py-3 text-sm font-medium text-white">{t.name}</td>
                        <td className="px-5 py-3 text-sm text-slate-400 max-w-xs truncate">{t.description || '—'}</td>
                        <td className="px-5 py-3 text-sm text-center text-slate-300">{t.duration_minutes} min</td>
                        <td className="px-5 py-3 text-sm text-right text-emerald-400 font-medium">${t.cost.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => openEditModal(t)} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-md mr-2">Edit</button>
                          <button onClick={() => handleDelete(t.id)} className="px-3 py-1.5 text-xs bg-red-900/30 hover:bg-red-800/40 text-red-400 rounded-md">Delete</button>
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
            <label className="block text-sm font-medium text-slate-300 mb-1">Treatment Name *</label>
            <input type="text" required value={form.name} onChange={(e) => updateForm('name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
              <select required value={form.category} onChange={(e) => updateForm('category', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm">
                <option value="">Select</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Duration (minutes) *</label>
              <input type="number" required min="5" value={form.duration_minutes} onChange={(e) => updateForm('duration_minutes', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Cost ($) *</label>
            <input type="number" required step="0.01" min="0" value={form.cost} onChange={(e) => updateForm('cost', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea value={form.description} rows={3} onChange={(e) => updateForm('description', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving...' : editingTreatment ? 'Update' : 'Add Treatment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
