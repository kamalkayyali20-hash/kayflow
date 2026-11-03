import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Banknote,
  CreditCard,
  PiggyBank,
  Target,
  DollarSign,
  FolderKanban,
  Plus,
  Zap,
  Building2,
  PhoneCall,
  AlertCircle,
  Repeat,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type {
  FinancialAccount,
  CustomCategory,
  FinancialTransaction,
} from '../../types';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../../services/currencyService';
import { Modal } from './Modal';

export const QuickAddModal: React.FC = () => {
  const {
    t,
    isRTL,
    quickAddOpen,
    setQuickAddOpen,
    reportingCurrency,
    activeWorkspaceId,
    setActiveNav,
  } = useApp();

  const [mode, setMode] = useState<'picker' | 'fast_entry'>('fast_entry');
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState(reportingCurrency);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);

  useEffect(() => {
    if (quickAddOpen) {
      db.accounts.toArray().then((accs) => {
        setAccounts(accs);
        if (accs.length > 0) {
          setAccountId(accs[0].id);
          setCurrency(accs[0].currency || reportingCurrency);
        }
      });
      setAmount(0);
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [quickAddOpen, reportingCurrency]);

  useEffect(() => {
    db.categories
      .where('type')
      .equals(txType)
      .toArray()
      .then(setCategories);
  }, [txType]);

  const handleSaveFastTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !accountId) return;

    const newTx: FinancialTransaction = {
      id: `tx-fast-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      date,
      amount: Number(amount),
      currency,
      type: txType,
      categoryId: categoryId || undefined,
      fromAccountId: txType === 'expense' ? accountId : undefined,
      toAccountId: txType === 'income' ? accountId : undefined,
      description: description.trim() || `${txType === 'income' ? 'Income' : 'Expense'} (Quick Add)`,
      createdAt: new Date().toISOString(),
    };

    await db.transactions.add(newTx);
    setQuickAddOpen(false);
  };

  const handleNavigateAndClose = (navTarget: string) => {
    setActiveNav(navTarget);
    setQuickAddOpen(false);
  };

  return (
    <Modal
      isOpen={quickAddOpen}
      onClose={() => setQuickAddOpen(false)}
      title={isRTL ? 'إجراء سريع' : 'Quick Actions'}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Toggle between Fast Entry and Full Actions */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode('fast_entry')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                mode === 'fast_entry'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isRTL ? 'معاملة سريعة' : 'Fast Transaction'}
            </button>
            <button
              onClick={() => setMode('picker')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                mode === 'picker'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isRTL ? 'كافة العمليات' : 'All Operations'}
            </button>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
            {activeWorkspaceId.toUpperCase()}
          </span>
        </div>

        {mode === 'fast_entry' ? (
          <form onSubmit={handleSaveFastTransaction} className="space-y-4">
            {/* Expense vs Income toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`py-1.5 font-semibold rounded-md transition-colors ${
                  txType === 'expense'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.addExpense}
              </button>
              <button
                type="button"
                onClick={() => setTxType('income')}
                className={`py-1.5 font-semibold rounded-md transition-colors ${
                  txType === 'income'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.addIncome}
              </button>
            </div>

            {/* Large numeric amount input */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                {t.amount} ({currency}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                autoFocus
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-3xl font-extrabold font-mono py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.category}
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">{isRTL ? '-- اختر التصنيف --' : '-- Select Category --'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {txType === 'expense' ? (isRTL ? 'خصم من حساب *' : 'Pay From Account *') : (isRTL ? 'إيداع إلى حساب *' : 'Deposit To Account *')}
              </label>
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {accounts.length === 0 ? (
                  <option value="">{isRTL ? 'يرجى إنشاء حساب مالي أولاً' : 'Create an account first'}</option>
                ) : (
                  accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date & Note */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.date}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.description}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Server bill, Payment"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={accounts.length === 0}
              className={`w-full py-2.5 px-4 text-xs font-bold text-white rounded-xl shadow-xs transition-colors ${
                txType === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {t.save}
            </button>
          </form>
        ) : (
          /* Contextual Actions Menu Based on Active Workspace */
          <div className="space-y-4">
            {activeWorkspaceId === 'ofis-soft' && (
              <div>
                <div className="text-[11px] font-bold uppercase text-sky-600 mb-2">
                  OFIS-SOFT Account Management
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleNavigateAndClose('ofis-companies')}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-left transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-sky-500" />
                    <span>{isRTL ? 'إضافة شركة / عميل' : 'Add Company'}</span>
                  </button>

                  <button
                    onClick={() => handleNavigateAndClose('ofis-visits')}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-left transition-colors"
                  >
                    <PhoneCall className="w-4 h-4 text-sky-500" />
                    <span>{isRTL ? 'تسجيل زيارة أو مكالمة' : 'Log Visit / Call'}</span>
                  </button>

                  <button
                    onClick={() => handleNavigateAndClose('ofis-issues')}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-left transition-colors"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span>{isRTL ? 'تسجيل بلاغ دعم فني' : 'Log Support Ticket'}</span>
                  </button>

                  <button
                    onClick={() => handleNavigateAndClose('ofis-tasks')}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-left transition-colors"
                  >
                    <Plus className="w-4 h-4 text-blue-500" />
                    <span>{isRTL ? 'إضافة مهمة' : 'Add Task'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeWorkspaceId === 'kay-soft' && (
              <div>
                <div className="text-[11px] font-bold uppercase text-emerald-600 mb-2">
                  KAY-SOFT Software Operations
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handleNavigateAndClose('kay-sales')}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition-colors"
                  >
                    <Repeat className="w-4 h-4 text-emerald-500" />
                    <span>{isRTL ? 'تسجيل بيع / اشتراك' : 'New Project Sale'}</span>
                  </button>

                  <button
                    onClick={() => handleNavigateAndClose('kay-customers')}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition-colors"
                  >
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span>{isRTL ? 'إضافة عميل برمجيات' : 'Add Software Client'}</span>
                  </button>

                  <button
                    onClick={() => handleNavigateAndClose('kay-expenses')}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition-colors"
                  >
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    <span>{isRTL ? 'تسجيل مصروف تشغيلي' : 'Business Expense'}</span>
                  </button>

                  <button
                    onClick={() => handleNavigateAndClose('kay-partners')}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition-colors"
                  >
                    <DollarSign className="w-4 h-4 text-amber-500" />
                    <span>{isRTL ? 'صرف أرباح الشركاء' : 'Disburse Profit'}</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400 mb-2">
                Personal Finance & Productivity
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleNavigateAndClose('personal-income')}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition-colors"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>{t.addIncome}</span>
                </button>

                <button
                  onClick={() => handleNavigateAndClose('personal-expenses')}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition-colors"
                >
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  <span>{t.addExpense}</span>
                </button>

                <button
                  onClick={() => handleNavigateAndClose('personal-salary')}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition-colors"
                >
                  <Banknote className="w-4 h-4 text-emerald-500" />
                  <span>{t.recordSalary}</span>
                </button>

                <button
                  onClick={() => handleNavigateAndClose('personal-debts')}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>{t.createDebt}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
