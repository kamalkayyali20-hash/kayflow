import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type {
  SalaryAgreement,
  SalaryPayment,
  FinancialAccount,
} from '../../types';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../../services/currencyService';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

export const SalaryView: React.FC = () => {
  const { t, isRTL, reportingCurrency, workspaces, activeWorkspaceId } = useApp();

  const [agreements, setAgreements] = useState<SalaryAgreement[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);

  // Modals
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<SalaryAgreement | null>(null);

  // Agreement Form
  const [employer, setEmployer] = useState('');
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [currency, setCurrency] = useState(reportingCurrency);
  const [expectedDay, setExpectedDay] = useState<number>(28);
  const [frequency, setFrequency] = useState<any>('monthly');
  const [bonuses, setBonuses] = useState<number>(0);
  const [commissions, setCommissions] = useState<number>(0);
  const [allowances, setAllowances] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Payment Form
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAccountId, setPayAccountId] = useState('');
  const [payBase, setPayBase] = useState<number>(0);
  const [payBonuses, setPayBonuses] = useState<number>(0);
  const [payCommissions, setPayCommissions] = useState<number>(0);
  const [payAllowances, setPayAllowances] = useState<number>(0);
  const [payDeductions, setPayDeductions] = useState<number>(0);
  const [payNotes, setPayNotes] = useState('');

  const loadData = async () => {
    let agrs = await db.salaryAgreements.toArray();
    if (activeWorkspaceId !== 'all') {
      agrs = agrs.filter((a) => !a.workspaceId || a.workspaceId === activeWorkspaceId);
    }
    setAgreements(agrs);

    const pays = await db.salaryPayments.toArray();
    pays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setPayments(pays);

    const accs = await db.accounts.toArray();
    setAccounts(accs);
  };

  useEffect(() => {
    loadData();
  }, [activeWorkspaceId]);

  // Net salary calculation for agreement form
  const computedNetSalary =
    (Number(baseSalary) || 0) +
    (Number(bonuses) || 0) +
    (Number(commissions) || 0) +
    (Number(allowances) || 0) -
    (Number(deductions) || 0);

  // Net salary calculation for payment recording form
  const computedPaymentNetSalary =
    (Number(payBase) || 0) +
    (Number(payBonuses) || 0) +
    (Number(payCommissions) || 0) +
    (Number(payAllowances) || 0) -
    (Number(payDeductions) || 0);

  const handleSaveAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employer.trim() || baseSalary <= 0) return;

    const newAgr: SalaryAgreement = {
      id: `agr-${Date.now()}`,
      employer: employer.trim(),
      workspaceId: activeWorkspaceId !== 'all' ? activeWorkspaceId : undefined,
      baseSalary: Number(baseSalary),
      currency,
      paymentFrequency: frequency,
      expectedPaymentDay: Number(expectedDay) || 28,
      effectiveStartDate: new Date().toISOString().split('T')[0],
      bonuses: Number(bonuses) || 0,
      commissions: Number(commissions) || 0,
      allowances: Number(allowances) || 0,
      deductions: Number(deductions) || 0,
      netSalary: computedNetSalary,
      paymentStatus: 'active',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await db.salaryAgreements.add(newAgr);
    setIsAgreementModalOpen(false);
    setEmployer('');
    setBaseSalary(0);
    loadData();
  };

  const handleOpenRecordPayment = (agr: SalaryAgreement) => {
    setSelectedAgreement(agr);
    setPayBase(agr.baseSalary);
    setPayBonuses(agr.bonuses);
    setPayCommissions(agr.commissions);
    setPayAllowances(agr.allowances);
    setPayDeductions(agr.deductions);
    setPayDate(new Date().toISOString().split('T')[0]);
    if (accounts.length > 0) setPayAccountId(accounts[0].id);
    setIsRecordPaymentModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgreement || !payAccountId || computedPaymentNetSalary <= 0) return;

    const monthYear = payDate.substring(0, 7);
    const newPayment: SalaryPayment = {
      id: `spay-${Date.now()}`,
      salaryAgreementId: selectedAgreement.id,
      employer: selectedAgreement.employer,
      date: payDate,
      monthYear,
      baseSalary: Number(payBase),
      bonuses: Number(payBonuses),
      commissions: Number(payCommissions),
      allowances: Number(payAllowances),
      deductions: Number(payDeductions),
      netSalary: computedPaymentNetSalary,
      currency: selectedAgreement.currency,
      receivedAccountId: payAccountId,
      status: 'received',
      notes: payNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // Atomic post to transactions ledger: this is REAL money received into account!
    await db.transaction('rw', [db.salaryPayments, db.transactions], async () => {
      await db.salaryPayments.add(newPayment);

      await db.transactions.add({
        id: `tx-sal-${newPayment.id}`,
        date: payDate,
        amount: computedPaymentNetSalary,
        currency: selectedAgreement.currency,
        type: 'income',
        toAccountId: payAccountId,
        workspaceId: selectedAgreement.workspaceId,
        description: `Salary: ${selectedAgreement.employer} (${monthYear})`,
        notes: payNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
    });

    setIsRecordPaymentModalOpen(false);
    setSelectedAgreement(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.salaryTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? 'تتبع اتفاقيات الرواتب، البدلات، الخصومات وصافي الدخل، مع تسجيل دفعات الرواتب المحصلة فعلياً.'
              : 'Salary agreements, allowances, deductions, and real cash payout reconciliation.'}
          </p>
        </div>

        <button
          onClick={() => {
            setEmployer('');
            setBaseSalary(0);
            setIsAgreementModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isRTL ? 'إضافة اتفاقية راتب' : 'Add Salary Agreement'}</span>
        </button>
      </div>

      {/* Salary Agreements */}
      {agreements.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title={t.noSalariesYet}
          description={
            isRTL
              ? 'سجل جهة العمل والراتب الأساسي والبدلات لحساب صافي الراتب المستحق ومتابعة تاريخ الصرف.'
              : 'Define your employer, base pay, and regular payroll deductions to track your net earnings.'
          }
          primaryActionLabel={isRTL ? 'إضافة اتفاقية راتب' : 'Add Salary Agreement'}
          onPrimaryAction={() => setIsAgreementModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agreements.map((agr) => (
              <div
                key={agr.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {agr.employer}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="capitalize">{agr.paymentFrequency}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {isRTL ? `يوم الاستحقاق: ${agr.expectedPaymentDay}` : `Day ${agr.expectedPaymentDay} of month`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenRecordPayment(agr)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.recordSalaryPayment}</span>
                  </button>
                </div>

                {/* Salary breakdown cards */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t.baseSalary}</span>
                    <span className="font-mono font-medium">
                      {formatCurrency(agr.baseSalary, agr.currency)}
                    </span>
                  </div>
                  {(agr.bonuses > 0 || agr.commissions > 0 || agr.allowances > 0) && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>{isRTL ? 'إجمالي البدلات والمكافآت' : 'Allowances & Bonuses'}</span>
                      <span className="font-mono font-medium">
                        +{formatCurrency(agr.bonuses + agr.commissions + agr.allowances, agr.currency)}
                      </span>
                    </div>
                  )}
                  {agr.deductions > 0 && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>{t.deductions}</span>
                      <span className="font-mono font-medium">
                        -{formatCurrency(agr.deductions, agr.currency)}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span>{t.netSalary}</span>
                    <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                      {formatCurrency(agr.netSalary, agr.currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment History Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4">
              {t.salaryHistory}
            </h3>

            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                {isRTL ? 'لم يتم تسجيل أي استلام راتب حتى الآن.' : 'No salary payout recorded yet.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {payments.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {p.employer} — {p.monthYear}
                      </div>
                      <div className="text-[11px] text-slate-400">{p.date}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(p.netSalary, p.currency)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isRTL ? 'تم الإيداع بالحساب' : 'Deposited to Account'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Salary Agreement Modal */}
      <Modal
        isOpen={isAgreementModalOpen}
        onClose={() => setIsAgreementModalOpen(false)}
        title={isRTL ? 'اتفاقية راتب جديدة' : 'New Salary Agreement'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAgreement} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'جهة العمل / مصدر الدخل *' : 'Employer / Income Source *'}
              </label>
              <input
                type="text"
                required
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                placeholder="e.g. Acme Tech Corp"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.currency}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.baseSalary} *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={baseSalary || ''}
                onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.bonuses}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={bonuses || ''}
                onChange={(e) => setBonuses(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.allowances}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={allowances || ''}
                onChange={(e) => setAllowances(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.deductions} (ضرائب، تأمينات)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={deductions || ''}
                onChange={(e) => setDeductions(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'يوم الصرف المتوقع (1-31)' : 'Expected Payment Day (1-31)'}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={expectedDay}
                onChange={(e) => setExpectedDay(parseInt(e.target.value) || 28)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg flex items-center justify-between text-xs">
            <span className="font-medium text-blue-900 dark:text-blue-300">
              {isRTL ? 'صافي الراتب المستحق شهرياً:' : 'Calculated Monthly Net Salary:'}
            </span>
            <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
              {formatCurrency(computedNetSalary, currency)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAgreementModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-xs"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Salary Payment Modal */}
      {selectedAgreement && (
        <Modal
          isOpen={isRecordPaymentModalOpen}
          onClose={() => setIsRecordPaymentModalOpen(false)}
          title={`${t.recordSalaryPayment}: ${selectedAgreement.employer}`}
        >
          <form onSubmit={handleSavePayment} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.date}
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'حساب الاستلام *' : 'Deposit Into Account *'}
                </label>
                <select
                  required
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">{isRTL ? '-- اختر الحساب --' : '-- Select Account --'}</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.baseSalary}
                </label>
                <input
                  type="number"
                  step="any"
                  value={payBase}
                  onChange={(e) => setPayBase(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.bonuses}
                </label>
                <input
                  type="number"
                  step="any"
                  value={payBonuses}
                  onChange={(e) => setPayBonuses(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.deductions}
                </label>
                <input
                  type="number"
                  step="any"
                  value={payDeductions}
                  onChange={(e) => setPayDeductions(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                {isRTL ? 'صافي المبلغ المحصل فعلياً:' : 'Net Salary Disbursed:'}
              </span>
              <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                {formatCurrency(computedPaymentNetSalary, selectedAgreement.currency)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRecordPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg shadow-xs"
              >
                {isRTL ? 'تسجيل وإيداع' : 'Record & Deposit'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
