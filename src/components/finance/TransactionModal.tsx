import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type {
  FinancialTransaction,
  FinancialAccount,
  CustomCategory,
  TransactionType,
  Project,
} from '../../types';
import { Modal } from '../common/Modal';
import { SUPPORTED_CURRENCIES } from '../../services/currencyService';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialType = 'expense',
}) => {
  const { t, isRTL, reportingCurrency, activeWorkspaceId, workspaces } = useApp();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState(reportingCurrency);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [relatedProjectId, setRelatedProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState<any>('none');
  const [notes, setNotes] = useState('');

  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      db.accounts.toArray().then((accs) => {
        setAccounts(accs);
        if (accs.length > 0) {
          setFromAccountId(accs[0].id);
          setToAccountId(accs.length > 1 ? accs[1].id : accs[0].id);
          setCurrency(accs[0].currency || reportingCurrency);
        }
      });
      db.projects.toArray().then(setProjects);
      setWorkspaceId((activeWorkspaceId as string) !== 'all' ? activeWorkspaceId : '');
      setAmount(0);
      setDescription('');
      setNotes('');
    }
  }, [isOpen, initialType, activeWorkspaceId, reportingCurrency]);

  useEffect(() => {
    const catType = type === 'income' ? 'income' : 'expense';
    db.categories.where('type').equals(catType).toArray().then(setCategories);
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date,
      amount: Number(amount),
      currency,
      type,
      categoryId: categoryId || undefined,
      workspaceId: workspaceId || undefined,
      fromAccountId: type === 'income' ? undefined : fromAccountId,
      toAccountId: type === 'expense' ? undefined : (type === 'transfer' ? toAccountId : toAccountId || fromAccountId),
      relatedProjectId: relatedProjectId || undefined,
      description: description.trim() || `${type} transaction`,
      recurrence: recurrence !== 'none' ? recurrence : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await db.transactions.add(newTx);
    onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        type === 'income'
          ? t.addIncome
          : type === 'transfer'
          ? t.transferMoney
          : t.addExpense
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector (Segmented buttons) */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
              type === 'expense'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.navExpenses}
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
              type === 'income'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.navIncome}
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
              type === 'transfer'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {isRTL ? 'تحويل' : 'Transfer'}
          </button>
        </div>

        {/* Big Numeric Amount Entry (Mobile-optimized) */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t.amount} *
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              step="any"
              min="0.01"
              required
              autoFocus
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full text-2xl font-bold font-mono py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="text-xs font-semibold py-1 px-2 rounded-md bg-slate-100 dark:bg-slate-700 border-none text-slate-800 dark:text-slate-200"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Account Pickers */}
        {type === 'transfer' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.fromAccount} *
              </label>
              <select
                required
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">{isRTL ? '-- اختر الحساب --' : '-- Select --'}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.toAccount} *
              </label>
              <select
                required
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">{isRTL ? '-- اختر الحساب --' : '-- Select --'}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {type === 'income' ? (isRTL ? 'إيداع إلى حساب' : 'Deposit To Account') : (isRTL ? 'خصم من حساب' : 'Pay From Account')} *
            </label>
            <select
              required
              value={type === 'income' ? toAccountId : fromAccountId}
              onChange={(e) => {
                if (type === 'income') setToAccountId(e.target.value);
                else setFromAccountId(e.target.value);
              }}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">{isRTL ? '-- اختر الحساب --' : '-- Select Account --'}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency}) - {a.workspaceScope}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category & Date */}
        <div className="grid grid-cols-2 gap-3">
          {type !== 'transfer' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.category}
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">{isRTL ? 'غير مصنف' : 'Uncategorized'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.date} *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            {t.description}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isRTL ? 'وصف المعاملة...' : 'e.g. Grocery store, Client invoice payment'}
            className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Project Link & Recurrence (Collapsible / Advanced) */}
        <details className="text-xs text-slate-600 dark:text-slate-400">
          <summary className="cursor-pointer font-medium hover:text-blue-600 dark:hover:text-blue-400 select-none">
            {isRTL ? 'خيارات إضافية (ربط بمشروع، تكرار)' : 'Advanced Options (Project Link, Recurrence)'}
          </summary>
          <div className="pt-3 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'ربط بمشروع (اختياري)' : 'Link to Project'}
              </label>
              <select
                value={relatedProjectId}
                onChange={(e) => setRelatedProjectId(e.target.value)}
                className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">{isRTL ? 'بدون مشروع' : 'None'}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.client})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'تكرار المعاملة' : 'Recurrence'}
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="none">{isRTL ? 'بدون تكرار (معاملة واحدة)' : 'One-time'}</option>
                <option value="monthly">{isRTL ? 'شهرياً' : 'Monthly'}</option>
                <option value="weekly">{isRTL ? 'أسبوعياً' : 'Weekly'}</option>
                <option value="quarterly">{isRTL ? 'ربع سنوي' : 'Quarterly'}</option>
                <option value="yearly">{isRTL ? 'سنوياً' : 'Yearly'}</option>
              </select>
            </div>
          </div>
        </details>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
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
  );
};
