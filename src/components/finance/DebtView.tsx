import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type { Debt, DebtPayment, FinancialAccount } from '../../types';
import {
  calculateDebtBalance,
} from '../../services/accountingEngine';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../../services/currencyService';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

export const DebtView: React.FC = () => {
  const { t, isRTL, reportingCurrency, activeWorkspaceId } = useApp();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtSummaries, setDebtSummaries] = useState<Record<string, any>>({});
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);

  // Modals
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  // Debt Form
  const [name, setName] = useState('');
  const [debtType, setDebtType] = useState<any>('personal_loan');
  const [direction, setDirection] = useState<'owe' | 'owed'>('owe');
  const [creditorDebtor, setCreditorDebtor] = useState('');
  const [originalPrincipal, setOriginalPrincipal] = useState<number>(0);
  const [currency, setCurrency] = useState(reportingCurrency);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [installmentAmount, setInstallmentAmount] = useState<number>(0);
  const [nextPaymentDate, setNextPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [maturityDate, setMaturityDate] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Form
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [principalComp, setPrincipalComp] = useState<number>(0);
  const [interestComp, setInterestComp] = useState<number>(0);
  const [fees, setFees] = useState<number>(0);
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const loadData = async () => {
    let dList = await db.debts.toArray();
    if (activeWorkspaceId !== 'all') {
      dList = dList.filter((d) => !d.workspaceId || d.workspaceId === activeWorkspaceId);
    }
    setDebts(dList);

    const summaries: Record<string, any> = {};
    for (const d of dList) {
      const s = await calculateDebtBalance(d.id);
      if (s) summaries[d.id] = s;
    }
    setDebtSummaries(summaries);

    const pList = await db.debtPayments.toArray();
    setPayments(pList);

    const accs = await db.accounts.toArray();
    setAccounts(accs);
  };

  useEffect(() => {
    loadData();
  }, [activeWorkspaceId]);

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !creditorDebtor.trim() || originalPrincipal <= 0) return;

    const newDebt: Debt = {
      id: `debt-${Date.now()}`,
      name: name.trim(),
      debtType,
      direction,
      creditorDebtor: creditorDebtor.trim(),
      originalPrincipal: Number(originalPrincipal),
      currency,
      startDate: new Date().toISOString().split('T')[0],
      interestRate: Number(interestRate) || 0,
      interestCalculationMethod: interestRate > 0 ? 'simple' : 'none',
      paymentFrequency: 'monthly',
      installmentAmount: Number(installmentAmount) || 0,
      nextPaymentDate,
      maturityDate: maturityDate || undefined,
      status: 'active',
      workspaceScope: activeWorkspaceId === 'ws-business' ? 'business' : 'personal',
      notes: notes.trim() || undefined,
      reminderDaysBefore: [7, 3, 1, 0],
      createdAt: new Date().toISOString(),
    };

    await db.debts.add(newDebt);
    setIsDebtModalOpen(false);
    loadData();
  };

  const handleOpenPayment = (debt: Debt) => {
    setSelectedDebt(debt);
    setPrincipalComp(debt.installmentAmount || 0);
    setInterestComp(0);
    setFees(0);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    if (accounts.length > 0) setPaymentAccountId(accounts[0].id);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !paymentAccountId) return;

    const totalAmount = (Number(principalComp) || 0) + (Number(interestComp) || 0) + (Number(fees) || 0);
    if (totalAmount <= 0) return;

    const newPayment: DebtPayment = {
      id: `dpay-${Date.now()}`,
      debtId: selectedDebt.id,
      date: paymentDate,
      totalAmount,
      principalComponent: Number(principalComp) || 0,
      interestComponent: Number(interestComp) || 0,
      fees: Number(fees) || 0,
      currency: selectedDebt.currency,
      paymentAccountId,
      notes: paymentNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // Atomic post:
    // If I owe money (liability): Cash decreases by totalAmount.
    // - Principal reduces liability.
    // - Interest/fees are recorded as operating expense!
    // If money is owed to me (asset): Cash increases by totalAmount.
    await db.transaction('rw', [db.debtPayments, db.transactions, db.debts], async () => {
      await db.debtPayments.add(newPayment);

      if (selectedDebt.direction === 'owe') {
        // Cash outflow
        await db.transactions.add({
          id: `tx-dpay-${newPayment.id}`,
          date: paymentDate,
          amount: totalAmount,
          currency: selectedDebt.currency,
          type: 'loan_repayment',
          fromAccountId: paymentAccountId,
          description: `Debt Installment: ${selectedDebt.name} (Principal: ${principalComp}, Interest: ${interestComp})`,
          notes: paymentNotes.trim() || undefined,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Cash inflow (someone repaying me)
        await db.transactions.add({
          id: `tx-dpay-${newPayment.id}`,
          date: paymentDate,
          amount: totalAmount,
          currency: selectedDebt.currency,
          type: 'loan_collection',
          toAccountId: paymentAccountId,
          description: `Loan Repayment Received: ${selectedDebt.name} (from ${selectedDebt.creditorDebtor})`,
          notes: paymentNotes.trim() || undefined,
          createdAt: new Date().toISOString(),
        });
      }

      // Check if debt is fully paid off
      const summary = await calculateDebtBalance(selectedDebt.id);
      if (summary && summary.remainingPrincipal <= 0) {
        await db.debts.update(selectedDebt.id, { status: 'paid_off' });
      }
    });

    setIsPaymentModalOpen(false);
    setSelectedDebt(null);
    loadData();
  };

  const myLiabilities = debts.filter((d) => d.direction === 'owe');
  const myReceivables = debts.filter((d) => d.direction === 'owed');

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.debtsTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? 'متابعة الديون والالتزامات، القروض الشخصية والبنكية، مع الفصل المحاسبي بين سداد أصل الدين ومصروفات الفوائد.'
              : 'Comprehensive debt & loan management, installment schedules, principal vs interest tracking.'}
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setCreditorDebtor('');
            setOriginalPrincipal(0);
            setIsDebtModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createDebt}</span>
        </button>
      </div>

      {debts.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={t.noDebtsYet}
          description={
            isRTL
              ? 'سجل القروض البنكية أو الأقساط الشخصية لمتابعة أصل المبلغ المتبقي ومواعيد الاستحقاق.'
              : 'Add personal loans, installment purchases, or money lent to track repayments and maturity dates.'
          }
          primaryActionLabel={t.createDebt}
          onPrimaryAction={() => setIsDebtModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Liabilities Section (Money I Owe) */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
              <span>{t.iOwe}</span>
            </h2>

            {myLiabilities.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                {isRTL ? 'لا توجد ديون مسجلة عليك حالياً.' : 'No outstanding liabilities.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myLiabilities.map((d) => {
                  const s = debtSummaries[d.id];
                  const remaining = s ? s.remainingPrincipal : d.originalPrincipal;
                  const repaid = s ? s.totalPrincipalRepaid : 0;
                  const progress = d.originalPrincipal > 0 ? (repaid / d.originalPrincipal) * 100 : 0;

                  return (
                    <div
                      key={d.id}
                      className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {d.name}
                          </h3>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {isRTL ? 'الدائن' : 'Creditor'}: {d.creditorDebtor} · {d.debtType.replace('_', ' ')}
                          </div>
                        </div>

                        {d.status === 'active' ? (
                          <button
                            onClick={() => handleOpenPayment(d)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                          >
                            {t.recordInstallment}
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                            {isRTL ? 'مسدد بالكامل' : 'Paid Off'}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1 font-mono">
                          <span className="text-slate-500">
                            {isRTL ? 'المسدد' : 'Repaid'}: {formatCurrency(repaid, d.currency)}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{t.remainingBalance}</span>
                          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                            {formatCurrency(remaining, d.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">{t.nextDue}</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {d.nextPaymentDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Receivables Section (Money Owed to Me) */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
              <span>{t.owedToMe}</span>
            </h2>

            {myReceivables.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                {isRTL ? 'لا توجد ديون مستحقة لك طرف الآخرين.' : 'No money owed to you.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myReceivables.map((d) => {
                  const s = debtSummaries[d.id];
                  const remaining = s ? s.remainingPrincipal : d.originalPrincipal;

                  return (
                    <div
                      key={d.id}
                      className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            {d.name}
                          </h3>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {isRTL ? 'المدين' : 'Debtor'}: {d.creditorDebtor}
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenPayment(d)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                        >
                          {isRTL ? 'تسجيل استرداد' : 'Record Collection'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{t.remainingBalance}</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(remaining, d.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">{t.originalPrincipal}</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {formatCurrency(d.originalPrincipal, d.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Debt Modal */}
      <Modal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        title={t.createDebt}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveDebt} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setDirection('owe')}
              className={`py-1.5 font-semibold rounded-md transition-colors ${
                direction === 'owe'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.iOwe}
            </button>
            <button
              type="button"
              onClick={() => setDirection('owed')}
              className={`py-1.5 font-semibold rounded-md transition-colors ${
                direction === 'owed'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.owedToMe}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'اسم الدين / القرض *' : 'Debt Name *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Car Loan, Equipment Installment"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {direction === 'owe' ? (isRTL ? 'الجهة الدائنة / البنك *' : 'Creditor / Bank *') : (isRTL ? 'المدين / الشخص المستدين *' : 'Debtor *')}
              </label>
              <input
                type="text"
                required
                value={creditorDebtor}
                onChange={(e) => setCreditorDebtor(e.target.value)}
                placeholder="e.g. CIB Bank"
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.originalPrincipal} *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={originalPrincipal || ''}
                onChange={(e) => setOriginalPrincipal(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.installmentAmount}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={installmentAmount || ''}
                onChange={(e) => setInstallmentAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'تاريخ القسط القادم' : 'Next Payment Date'}
              </label>
              <input
                type="date"
                required
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'تاريخ انتهاء الدين / الاستحقاق' : 'Maturity Date (Optional)'}
              </label>
              <input
                type="date"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsDebtModalOpen(false)}
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

      {/* Record Debt Payment Modal */}
      {selectedDebt && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title={`${t.recordInstallment}: ${selectedDebt.name}`}
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
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'حساب الدفع / الاستلام' : 'Payment Account'}
                </label>
                <select
                  required
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
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

            {/* Split: Principal vs Interest vs Fees */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'أصل الدين' : 'Principal'} *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={principalComp}
                  onChange={(e) => setPrincipalComp(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'الفوائد (مصروف)' : 'Interest'}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={interestComp}
                  onChange={(e) => setInterestComp(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'رسوم ومصاريف' : 'Fees'}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={fees}
                  onChange={(e) => setFees(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                {isRTL ? 'إجمالي المبلغ المدفوع:' : 'Total Installment Payment:'}
              </span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                {formatCurrency(principalComp + interestComp + fees, selectedDebt.currency)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-xs"
              >
                {isRTL ? 'تأكيد السداد' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
