'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoicesWithBalance, setInvoicesWithBalance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  // Payment Form
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMethod, setFormMethod] = useState('cash');
  const [formRef, setFormRef] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      setPayments(data.data || []);
    } catch {
      showToast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchInvoicesForPayment = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      const openInvoices = (data.data || []).filter(
        (i: any) => Number(i.balance_due) > 0 && i.status !== 'cancelled'
      );
      setInvoicesWithBalance(openInvoices);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchInvoicesForPayment();
  }, [fetchPayments, fetchInvoicesForPayment]);

  const openRecordModal = () => {
    setSelectedInvoiceId('');
    setFormAmount('');
    setFormMethod('cash');
    setFormRef('');
    setFormNotes('');
    fetchInvoicesForPayment();
    setShowRecordModal(true);
  };

  const handleInvoiceSelect = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoicesWithBalance.find((i) => i.id === invId);
    if (inv) {
      setFormAmount(String(inv.balance_due || ''));
    } else {
      setFormAmount('');
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const inv = invoicesWithBalance.find((i) => i.id === selectedInvoiceId);
    if (!inv) {
      showToast('Please select an invoice', 'error');
      return;
    }

    const amt = Number(formAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    if (amt > Number(inv.balance_due)) {
      showToast(`Amount exceeds balance due ($${inv.balance_due})`, 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        invoice_id: inv.id,
        patient_id: inv.patient_id,
        amount: amt,
        payment_method: formMethod,
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: formRef.trim() || null,
        notes: formNotes.trim() || null,
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
      setShowRecordModal(false);
      fetchPayments();
      fetchInvoicesForPayment();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openReceiptModal = (p: any) => {
    setSelectedPayment(p);
    setShowReceiptModal(true);
  };

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const matchesMethod = !methodFilter || p.payment_method === methodFilter;
    const pName = p.patients
      ? `${p.patients.first_name} ${p.patients.last_name}`.toLowerCase()
      : '';
    const invNum = p.invoices?.invoice_number?.toLowerCase() || '';
    const refNum = (p.reference_number || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q || pName.includes(q) || invNum.includes(q) || refNum.includes(q);
    return matchesMethod && matchesQuery;
  });

  // Analytics
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const avgAmount = payments.length > 0 ? totalAmount / payments.length : 0;

  const methodSummary: Record<string, number> = {};
  payments.forEach((p) => {
    methodSummary[p.payment_method] = (methodSummary[p.payment_method] || 0) + Number(p.amount || 0);
  });

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <span className="badge badge-emerald">💵 Cash</span>;
      case 'credit_card':
        return <span className="badge badge-purple">💳 Credit Card</span>;
      case 'debit_card':
        return <span className="badge badge-blue">💳 Debit Card</span>;
      case 'bank_transfer':
        return <span className="badge badge-amber">🏦 Bank Transfer</span>;
      case 'insurance':
        return <span className="badge badge-teal">🛡️ Insurance</span>;
      default:
        return <span className="badge badge-slate">Other</span>;
    }
  };

  const selectedInvObj = invoicesWithBalance.find((i) => i.id === selectedInvoiceId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2238] tracking-tight">Payments & Receipts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track patient transactions, payment methods, and revenue flow
          </p>
        </div>
        <button onClick={openRecordModal} className="btn-primary flex items-center gap-2">
          <span>💳</span>
          <span>Record Payment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
              💰
            </span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-3">
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Across all transactions</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-[#1E2238]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Transactions</span>
            <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-sm">
              🔢
            </span>
          </div>
          <p className="text-2xl font-extrabold text-[#1E2238] mt-3">{payments.length}</p>
          <p className="text-xs text-slate-400 mt-1">Processed payments</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Average Payment</span>
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
              📊
            </span>
          </div>
          <p className="text-2xl font-extrabold text-[#1E2238] mt-3">
            ${avgAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Per transaction average</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Invoices with Due</span>
            <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
              ⏳
            </span>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-3">{invoicesWithBalance.length}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting completion</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search patient, invoice #, reference #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div className="w-full sm:w-56">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="input-field w-full"
          >
            <option value="">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="insurance">Insurance Claim</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-800">
            <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-200/80">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Patient</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Reference #</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin text-2xl mb-2">🌀</div>
                    <p>Loading transactions...</p>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <span className="text-3xl block mb-2">💳</span>
                    <p className="text-base font-medium text-slate-400">No payments found</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {searchQuery || methodFilter
                        ? 'Try clearing your filters'
                        : 'Record a payment for an open invoice'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {new Date(p.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-teal-400">
                      {p.invoices?.invoice_number || `INV-${p.invoice_id?.slice(0, 6)}`}
                    </td>
                    <td className="px-5 py-4 font-medium text-white">
                      {p.patients
                        ? `${p.patients.first_name} ${p.patients.last_name}`
                        : 'Patient'}
                    </td>
                    <td className="px-5 py-4">{getMethodBadge(p.payment_method)}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                      {p.reference_number || '—'}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-400">
                      ${Number(p.amount).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openReceiptModal(p)}
                        className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        🧾 Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="Record New Payment"
        size="md"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Select Invoice to Pay <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              required
              className="input-field w-full"
            >
              <option value="">Choose open invoice...</option>
              {invoicesWithBalance.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number || `INV-${inv.id.slice(0, 6)}`} -{' '}
                  {inv.patients ? `${inv.patients.first_name} ${inv.patients.last_name}` : 'Unknown'}{' '}
                  (Balance: ${Number(inv.balance_due).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {selectedInvObj && (
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400">Invoice Total: </span>
                <span className="text-white font-medium">${Number(selectedInvObj.total).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400">Balance Due: </span>
                <span className="text-amber-400 font-bold">${Number(selectedInvObj.balance_due).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Payment Amount ($) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              required
              placeholder="0.00"
              className="input-field w-full text-base font-bold text-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Payment Method <span className="text-red-400">*</span>
            </label>
            <select
              value={formMethod}
              onChange={(e) => setFormMethod(e.target.value)}
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
              Reference / Transaction ID
            </label>
            <input
              type="text"
              placeholder="e.g. POS-9843 or Slip #"
              value={formRef}
              onChange={(e) => setFormRef(e.target.value)}
              className="input-field w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Optional notes or memos..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="input-field w-full text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowRecordModal(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {saving ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* PAYMENT RECEIPT MODAL */}
      <Modal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        title="Payment Receipt"
        size="md"
      >
        {selectedPayment && (
          <div className="space-y-5">
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mx-auto">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Payment Successful</h3>
                <p className="text-xs text-slate-400 mt-1">DentalCare Clinic Management</p>
              </div>

              <div className="text-3xl font-bold text-emerald-400">
                ${Number(selectedPayment.amount).toFixed(2)}
              </div>

              <div className="border-t border-b border-slate-800 py-3 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Date & Time:</span>
                  <span className="text-white">
                    {new Date(selectedPayment.payment_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient:</span>
                  <span className="text-white font-medium">
                    {selectedPayment.patients
                      ? `${selectedPayment.patients.first_name} ${selectedPayment.patients.last_name}`
                      : 'Patient'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice:</span>
                  <span className="font-mono text-teal-400 font-bold">
                    {selectedPayment.invoices?.invoice_number ||
                      `INV-${selectedPayment.invoice_id?.slice(0, 6)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Method:</span>
                  <span className="capitalize text-white">
                    {selectedPayment.payment_method?.replace('_', ' ')}
                  </span>
                </div>
                {selectedPayment.reference_number && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reference #:</span>
                    <span className="font-mono text-slate-300">
                      {selectedPayment.reference_number}
                    </span>
                  </div>
                )}
                {selectedPayment.notes && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Notes:</span>
                    <span className="text-slate-300">{selectedPayment.notes}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500">Thank you for your visit to DentalCare!</p>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary text-xs flex items-center gap-2"
              >
                <span>🖨️</span>
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
