import React, { useState, useEffect } from 'react';
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  TrendingDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type { Budget, CustomCategory, FinancialTransaction } from '../../types';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../../services/currencyService';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

export const BudgetsView: React.FC = () => {
  const { t, isRTL, reportingCurrency, activeWorkspaceId, currentMonth } = useApp();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Record<string, CustomCategory>>({});
  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [period, setPeriod] = useState<any>('monthly');
  const [budgetAmount, setBudgetAmount] = useState<number>(0);
  const [currency, setCurrency] = useState(reportingCurrency);
  const [categoryList, setCategoryList] = useState<CustomCategory[]>([]);

  const loadData = async () => {
    let bList = await db.budgets.toArray();
    if (activeWorkspaceId !== 'all') {
      bList = bList.filter((b) => !b.workspaceId || b.workspaceId === activeWorkspaceId);
    }
    setBudgets(bList);

    const cats = await db.categories.toArray();
    const catMap: Record<string, CustomCategory> = {};
    cats.forEach((c) => (catMap[c.id] = c));
    setCategories(catMap);
    setCategoryList(cats.filter((c) => c.type === 'expense'));

    // Calculate actual spending in current month for each category
    const txs = await db.transactions
      .filter((tx) => tx.type === 'expense' && tx.date.startsWith(currentMonth))
      .toArray();

    const spending: Record<string, number> = {};
    txs.forEach((tx) => {
      if (tx.categoryId) {
        spending[tx.categoryId] = (spending[tx.categoryId] || 0) + tx.amount;
      }
    });
    setCategorySpending(spending);
  };

  useEffect(() => {
    loadData();
  }, [activeWorkspaceId, currentMonth]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || budgetAmount <= 0) return;

    const newBudget: Budget = {
      id: `bud-${Date.now()}`,
      name: name.trim(),
      categoryId,
      period,
      budgetAmount: Number(budgetAmount),
      currency,
      workspaceId: activeWorkspaceId !== 'all' ? activeWorkspaceId : undefined,
      createdAt: new Date().toISOString(),
    };

    await db.budgets.add(newBudget);
    setIsModalOpen(false);
    setName('');
    setBudgetAmount(0);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.budgetsTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? 'تحديد ومراقبة سقوف الإنفاق والمصروفات حسب التصنيف لمنع تجاوز الميزانية المحددة.'
              : 'Category expense limits, actual burn rate, and real-time budget threshold warnings.'}
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setBudgetAmount(0);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createBudget}</span>
        </button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={t.noBudgetsYet}
          description={
            isRTL
              ? 'أنشئ أول ميزانية تقديرية (مثل: ميزانية الطعام والمواصلات، أو اشتراكات السحابة) لمراقبة الإنفاق.'
              : 'Create your first expense budget to set guardrails on your spending.'
          }
          primaryActionLabel={t.createBudget}
          onPrimaryAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const cat = categories[b.categoryId];
            const actualSpent = categorySpending[b.categoryId] || 0;
            const remaining = Math.max(0, b.budgetAmount - actualSpent);
            const percentageUsed = Math.round((actualSpent / b.budgetAmount) * 100);

            const isOverBudget = actualSpent > b.budgetAmount;
            const isNearBudget = percentageUsed >= 80 && !isOverBudget;

            return (
              <div
                key={b.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {b.name}
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {cat ? cat.name : 'General'} · <span className="capitalize">{b.period}</span>
                    </div>
                  </div>

                  {isOverBudget ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{isRTL ? 'تجاوز الميزانية' : 'Exceeded'}</span>
                    </span>
                  ) : isNearBudget ? (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                      {isRTL ? 'قارب الحد (80%+)' : 'Warning (80%+)'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      {isRTL ? 'ضمن الحدود' : 'On Track'}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-500">
                      {t.spent}: {formatCurrency(actualSpent, b.currency)}
                    </span>
                    <span
                      className={`font-bold ${
                        isOverBudget
                          ? 'text-rose-600'
                          : isNearBudget
                          ? 'text-amber-600'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {percentageUsed}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverBudget
                          ? 'bg-rose-500'
                          : isNearBudget
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, percentageUsed)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isRTL ? 'الميزانية المحددة' : 'Budget Limit'}</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(b.budgetAmount, b.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t.remaining}</span>
                    <span
                      className={`font-mono font-bold ${
                        isOverBudget ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatCurrency(remaining, b.currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t.createBudget}
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'اسم الميزانية *' : 'Budget Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monthly Marketing Budget, Groceries"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'تصنيف المصروف المرتبط *' : 'Assigned Expense Category *'}
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">{isRTL ? '-- اختر التصنيف --' : '-- Select Category --'}</option>
              {categoryList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'حد الميزانية *' : 'Budget Amount *'}
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={budgetAmount || ''}
                onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'دورة التكرار' : 'Period'}
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="monthly">{isRTL ? 'شهرياً' : 'Monthly'}</option>
                <option value="weekly">{isRTL ? 'أسبوعياً' : 'Weekly'}</option>
                <option value="quarterly">{isRTL ? 'ربع سنوي' : 'Quarterly'}</option>
                <option value="yearly">{isRTL ? 'سنوياً' : 'Yearly'}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
    </div>
  );
};
