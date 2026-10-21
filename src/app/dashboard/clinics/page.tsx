'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, Clinic } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';

export default function ClinicsPage() {
  const { user, setActiveClinic } = useAuth();
  const { showToast } = useToast();

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mogadishu');
  const [subscriptionPlan, setSubscriptionPlan] = useState('pro');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clinics');
      if (res.ok) {
        const data = await res.json();
        setClinics(data.clinics || []);
      } else {
        showToast('Failed to load clinics', 'error');
      }
    } catch {
      showToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(autoSlug);
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Clinic name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          subscriptionPlan,
          adminFullName: adminFullName.trim() || undefined,
          adminUsername: adminUsername.trim() || undefined,
          adminEmail: adminEmail.trim() || undefined,
          adminPassword: adminPassword || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Clinic "${name}" registered successfully!`, 'success');
        setModalOpen(false);
        // Reset form
        setName('');
        setSlug('');
        setEmail('');
        setPhone('');
        setAddress('');
        setAdminFullName('');
        setAdminUsername('');
        setAdminEmail('');
        setAdminPassword('');
        fetchClinics();
      } else {
        showToast(data.error || 'Failed to register clinic', 'error');
      }
    } catch {
      showToast('Network error while registering clinic', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (clinic: Clinic) => {
    const newStatus = clinic.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/clinics/${clinic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Clinic "${clinic.name}" is now ${newStatus}`, 'success');
        fetchClinics();
      } else {
        showToast('Failed to update clinic status', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleDeleteClinic = async (clinic: Clinic) => {
    if (!window.confirm(`Are you sure you want to delete "${clinic.name}" and all its data? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/clinics/${clinic.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`Clinic "${clinic.name}" deleted`, 'success');
        fetchClinics();
      } else {
        showToast('Failed to delete clinic', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleSwitchClinic = (clinic: Clinic) => {
    setActiveClinic(clinic.id, clinic.name);
    showToast(`Switched view to "${clinic.name}"`, 'info');
  };

  // Stats calculations
  const totalClinics = clinics.length;
  const activeClinics = clinics.filter((c) => c.status === 'active').length;
  const totalPatients = clinics.reduce((sum, c) => sum + Number(c.patient_count || 0), 0);
  const totalRevenue = clinics.reduce((sum, c) => sum + Number(c.total_revenue || 0), 0);

  const isSuperAdmin = true; // All authenticated users can view and create clinics

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2238] tracking-tight">
            Clinics & Organizations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage multi-tenant dental clinics, subscriptions, and administrative access
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary text-xs flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <span className="text-base font-bold">+</span>
          <span>Register New Clinic</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 border-l-4 border-l-[#1E2238] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Clinics</p>
          <p className="text-2xl font-bold text-[#1E2238] mt-2">{totalClinics}</p>
          <p className="text-xs text-slate-400 mt-1">Registered dental practices</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 border-l-4 border-l-[#10B981] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Clinics</p>
          <p className="text-2xl font-bold text-[#1E2238] mt-2">{activeClinics}</p>
          <p className="text-xs text-slate-400 mt-1">Operational & running</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 border-l-4 border-l-[#2563EB] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Patients</p>
          <p className="text-2xl font-bold text-[#1E2238] mt-2">{totalPatients}</p>
          <p className="text-xs text-slate-400 mt-1">Across all dental clinics</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 border-l-4 border-l-[#F59E0B] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Platform Revenue</p>
          <p className="text-2xl font-bold text-[#1E2238] mt-2">
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Collected platform-wide</p>
        </div>
      </div>

      {/* Clinics Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1E2238]">All Registered Dental Clinics</h2>
          <button
            onClick={fetchClinics}
            className="text-xs font-semibold text-[#2563EB] hover:underline"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Clinic Name & Slug</th>
                <th className="px-5 py-3.5">Location & Contact</th>
                <th className="px-5 py-3.5 text-center">Doctors</th>
                <th className="px-5 py-3.5 text-center">Patients</th>
                <th className="px-5 py-3.5 text-right">Revenue</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin text-2xl mb-2">🌀</div>
                    <p>Loading clinics...</p>
                  </td>
                </tr>
              ) : clinics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No clinics registered yet. Click &quot;Register New Clinic&quot; to add one.
                  </td>
                </tr>
              ) : (
                clinics.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-sm text-[#1E2238]">{c.name}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">/{c.slug}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-700 font-medium">{c.city || 'Mogadishu'}{c.address ? `, ${c.address}` : ''}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{c.phone || c.email || '—'}</div>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-700">
                      {c.doctor_count || 0}
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-700">
                      {c.patient_count || 0}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-600">
                      ${Number(c.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-red-50 text-red-700 border border-red-200/60'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSwitchClinic(c)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                          title="Switch active clinic view to this clinic"
                        >
                          Switch To
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            c.status === 'active'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {c.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteClinic(c)}
                          className="px-2 py-1 text-red-500 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
                          title="Delete Clinic"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register New Clinic Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register New Dental Clinic"
      >
        <form onSubmit={handleCreateClinic} className="space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800">
            This will create an isolated clinic workspace, pre-populate standard dental treatments, and set up an administrator account for the clinic.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinic Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Mogadishu Smile Dental Care"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Slug (Handle)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="mogadishu-smile"
                className="input-field font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mogadishu"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinic Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+252 61 ..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinic Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@clinic.com"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinic Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Maka Al Mukarama St, Wardhiigley"
              className="input-field"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Clinic Administrator Account (Optional)
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Full Name
                </label>
                <input
                  type="text"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  placeholder="e.g. Dr. Ahmed Ali"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin Username
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="ahmed_dental"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="ahmed@clinic.com"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Initial Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Temporary password"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              {submitting ? 'Registering...' : 'Register Clinic'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
