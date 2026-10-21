'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface InvoiceItem {
  treatment_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  // Create Invoice Form State
  const [patientId, setPatientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
    notes: '',
  });

  const fetchInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.data || []);
    } catch {
      showToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        fetch('/api/patients?limit=500'),
        fetch('/api/treatments'),
      ]);
      const [pData, tData] = await Promise.all([pRes.json(), tRes.json()]);
      setPatients(pData.data || []);
      setTreatments(tData.data || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchDropdowns();
  }, [fetchInvoices, fetchDropdowns]);

  // Invoice calculations
  const calculateSubtotal = () =>
    items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const subtotal = calculateSubtotal();
  const taxAmount = (subtotal * (Number(taxRate) || 0)) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - (Number(discount) || 0));

  const handleItemTreatmentSelect = (index: number, treatmentId: string) => {
    const selected = treatments.find((t) => t.id === treatmentId);
    const updated = [...items];
    if (selected) {
      updated[index] = {
        treatment_id: selected.id,
        description: selected.name,
        quantity: updated[index].quantity || 1,
        unit_price: Number(selected.cost),
        total: (updated[index].quantity || 1) * Number(selected.cost),
      };
    } else {
      updated[index] = {
        ...updated[index],
        treatment_id: undefined,
      };
    }
    setItems(updated);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      const q = field === 'quantity' ? Number(value) : Number(item.quantity);
      const p = field === 'unit_price' ? Number(value) : Number(item.unit_price);
      item.total = q * p;
    }
    updated[index] = item;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const openCreateModal = () => {
    setPatientId('');
    const futureDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    setDueDate(futureDate);
    setTaxRate(0);
    setDiscount(0);
    setNotes('');
    setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
    setShowCreateModal(true);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      showToast('Please select a patient', 'error');
      return;
    }
    const validItems = items.filter((i) => i.description.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      showToast('Please add at least one line item', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        patient_id: patientId,
        due_date: dueDate || null,
        tax_rate: Number(taxRate) || 0,
        discount: Number(discount) || 0,
        notes: notes.trim() || null,
        items: validItems,
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create invoice');
      }

      showToast('Invoice created successfully!', 'success');
      setShowCreateModal(false);
      fetchInvoices();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openViewInvoice = async (inv: any) => {
    try {
      const res = await fetch(`/api/invoices/${inv.id}`);
      if (res.ok) {
        const detail = await res.json();
        setSelectedInvoice(detail);
      } else {
        setSelectedInvoice(inv);
      }
    } catch {
      setSelectedInvoice(inv);
    }
    setShowViewModal(true);
  };

  const openPaymentModal = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentForm({
      amount: String(inv.balance_due || inv.total),
      payment_method: 'cash',
      reference_number: '',
      notes: '',
    });
    setShowPayModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const amountNum = Number(paymentForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }
    if (amountNum > Number(selectedInvoice.balance_due)) {
      showToast(`Amount exceeds balance due ($${selectedInvoice.balance_due})`, 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        invoice_id: selectedInvoice.id,
        patient_id: selectedInvoice.patient_id,
        amount: amountNum,
        payment_method: paymentForm.payment_method,
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: paymentForm.reference_number || null,
        notes: paymentForm.notes || null,
      };

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record payment');
      }

      showToast('Payment recorded successfully!', 'success');
      setShowPayModal(false);
      if (showViewModal) {
        setShowViewModal(false);
      }
      fetchInvoices();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const pName = inv.patients
      ? `${inv.patients.first_name} ${inv.patients.last_name}`.toLowerCase()
      : '';
    const invNum = (inv.invoice_number || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return pName.includes(q) || invNum.includes(q);
  });

  // Aggregate stats
  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total || 0), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);
  const totalBalance = invoices.reduce((sum, i) => sum + Number(i.balance_due || 0), 0);
  const unpaidCount = invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-emerald">Paid</span>;
      case 'partial':
        return <span className="badge badge-amber">Partial</span>;
      case 'overdue':
        return <span className="badge badge-red">Overdue</span>;
      case 'cancelled':
        return <span className="badge badge-slate">Cancelled</span>;
      case 'pending':
      default:
        return <span className="badge badge-blue">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2238] tracking-tight">Billing & Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage patient billing, invoices, payments, and balances
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <span>+</span>
          <span>Create Invoice</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-[#1E2238]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Invoiced</span>
            <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-sm">
              📄
            </span>
          </div>
          <p className="text-2xl font-extrabold text-[#1E2238] mt-3">${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-1">{invoices.length} total invoices issued</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Collected</span>
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
              💰
            </span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-3">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-1">
            {totalInvoiced > 0 ? `${((totalPaid / totalInvoiced) * 100).toFixed(1)}% recovery rate` : '0%'}
          </p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Outstanding Balance</span>
            <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
              ⏳
            </span>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-3">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 mt-1">Pending collection</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Unpaid Invoices</span>
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
              ⚠️
            </span>
          </div>
          <p className="text-2xl font-extrabold text-[#1E2238] mt-3">{unpaidCount}</p>
          <p className="text-xs text-slate-400 mt-1">Require follow-up</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by invoice # or patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-800">
            <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-200/80">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Patient</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Paid</th>
                <th className="px-5 py-3.5">Balance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <div className="spinner mx-auto mb-2" />
                    <p>Loading invoices...</p>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <span className="text-3xl block mb-2">🧾</span>
                    <p className="text-base font-semibold text-slate-700">No invoices found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchQuery || statusFilter
                        ? 'Try adjusting your filters'
                        : 'Create your first invoice to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-semibold text-blue-600">
                      {inv.invoice_number || `INV-${inv.id.slice(0, 6)}`}
                    </td>
                    <td className="px-5 py-4">
                      {inv.patients ? (
                        <div>
                          <p className="font-semibold text-slate-800">
                            {inv.patients.first_name} {inv.patients.last_name}
                          </p>
                          <p className="text-xs text-slate-400">{inv.patients.phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unknown</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      ${Number(inv.total).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-emerald-600 font-semibold">
                      ${Number(inv.amount_paid || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`font-semibold ${
                          Number(inv.balance_due) > 0 ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        ${Number(inv.balance_due || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(inv.status)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openViewInvoice(inv)}
                          className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View / Print"
                        >
                          👁️ View
                        </button>
                        {Number(inv.balance_due) > 0 && inv.status !== 'cancelled' && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="px-2.5 py-1 text-xs rounded bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 border border-teal-500/30 transition-colors"
                            title="Record Payment"
                          >
                            💳 Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE INVOICE MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Invoice"
        size="lg"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Patient <span className="text-red-400">*</span>
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                className="input-field w-full"
              >
                <option value="">Select Patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="border-t border-b border-slate-800 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Invoice Line Items
              </span>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-800"
                >
                  <div className="col-span-12 sm:col-span-4">
                    <select
                      value={item.treatment_id || ''}
                      onChange={(e) => handleItemTreatmentSelect(idx, e.target.value)}
                      className="input-field w-full text-xs"
                    >
                      <option value="">Choose treatment catalog...</option>
                      {treatments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (${Number(t.cost).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-12 sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Description / Treatment"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      required
                      className="input-field w-full text-xs"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="input-field w-full text-xs"
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Price"
                      step="0.01"
                      min={0}
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                      className="input-field w-full text-xs"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                      className="text-red-400 hover:text-red-300 disabled:opacity-30 text-sm"
                      title="Remove row"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Adjustments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, special instructions..."
                className="input-field w-full text-xs"
              />
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Tax Rate (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="input-field w-20 text-right py-1 text-xs"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Discount ($)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="input-field w-24 text-right py-1 text-xs"
                />
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm text-white">
                <span>Grand Total</span>
                <span className="text-teal-400">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {saving ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW / PRINT INVOICE MODAL */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Invoice Details"
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Printable Invoice Header */}
            <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🦷</span>
                    <h2 className="text-xl font-bold gradient-text">DentalCare Clinic</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">123 Health Ave, Suite 400</p>
                  <p className="text-xs text-slate-400">contact@dentalcare.com | +1 (555) 019-2834</p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold font-mono text-teal-400">
                    {selectedInvoice.invoice_number || `INV-${selectedInvoice.id?.slice(0, 6)}`}
                  </h3>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                  <p className="text-xs text-slate-400 mt-2">
                    Date: {new Date(selectedInvoice.created_at).toLocaleDateString()}
                  </p>
                  {selectedInvoice.due_date && (
                    <p className="text-xs text-slate-400">
                      Due: {new Date(selectedInvoice.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Billed To */}
              <div className="py-4 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Billed To
                </p>
                <p className="text-sm font-bold text-white">
                  {selectedInvoice.patients?.first_name} {selectedInvoice.patients?.last_name}
                </p>
                <p className="text-xs text-slate-400">{selectedInvoice.patients?.phone}</p>
                {selectedInvoice.patients?.email && (
                  <p className="text-xs text-slate-400">{selectedInvoice.patients?.email}</p>
                )}
              </div>

              {/* Items Breakdown */}
              <div className="py-4">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="py-2">Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Price</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedInvoice.invoice_items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2.5 text-white">{item.description}</td>
                        <td className="py-2.5 text-center text-slate-300">{item.quantity}</td>
                        <td className="py-2.5 text-right text-slate-300">
                          ${Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-medium text-white">
                          ${Number(item.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="border-t border-slate-800 pt-3 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>${Number(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {Number(selectedInvoice.tax_amount) > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Tax ({selectedInvoice.tax_rate}%)</span>
                      <span>${Number(selectedInvoice.tax_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(selectedInvoice.discount) > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Discount</span>
                      <span>-${Number(selectedInvoice.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800">
                    <span>Total</span>
                    <span>${Number(selectedInvoice.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Amount Paid</span>
                    <span>${Number(selectedInvoice.amount_paid || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-amber-400 pt-1 border-t border-slate-800">
                    <span>Balance Due</span>
                    <span>${Number(selectedInvoice.balance_due || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment History on this invoice */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div className="mt-6 border-t border-slate-800 pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Payment Receipts
                  </p>
                  <div className="space-y-1.5">
                    {selectedInvoice.payments.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex justify-between text-xs bg-slate-800/40 p-2 rounded"
                      >
                        <div>
                          <span className="text-emerald-400 font-medium">
                            ${Number(p.amount).toFixed(2)}
                          </span>{' '}
                          via <span className="capitalize text-slate-300">{p.payment_method}</span>
                          {p.reference_number && (
                            <span className="text-slate-500"> (Ref: {p.reference_number})</span>
                          )}
                        </div>
                        <span className="text-slate-400">
                          {new Date(p.payment_date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary text-xs flex items-center gap-2"
              >
                <span>🖨️</span>
                <span>Print Invoice</span>
              </button>

              <div className="flex items-center gap-2">
                {Number(selectedInvoice.balance_due) > 0 && selectedInvoice.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowViewModal(false);
                      openPaymentModal(selectedInvoice);
                    }}
                    className="btn-primary text-xs"
                  >
                    💳 Record Payment
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="btn-secondary text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="Record Payment"
        size="md"
      >
        {selectedInvoice && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice:</span>
                <span className="font-mono text-teal-400 font-bold">
                  {selectedInvoice.invoice_number || `INV-${selectedInvoice.id?.slice(0, 6)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Patient:</span>
                <span className="text-white font-medium">
                  {selectedInvoice.patients?.first_name} {selectedInvoice.patients?.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Outstanding Balance:</span>
                <span className="text-amber-400 font-bold text-sm">
                  ${Number(selectedInvoice.balance_due || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Payment Amount ($) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={Number(selectedInvoice.balance_due || 0)}
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                required
                className="input-field w-full text-base font-bold text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Payment Method <span className="text-red-400">*</span>
              </label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, payment_method: e.target.value })
                }
                className="input-field w-full"
              >
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="insurance">Insurance Claim</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Reference / Transaction #
              </label>
              <input
                type="text"
                placeholder="e.g. TXN-98432 or Check #"
                value={paymentForm.reference_number}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, reference_number: e.target.value })
                }
                className="input-field w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="Any special remarks..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="input-field w-full text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {saving ? 'Recording...' : 'Submit Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
