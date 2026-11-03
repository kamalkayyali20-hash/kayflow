import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type { FinancialGoal, GoalAllocation, FinancialAccount } from '../../types';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../../services/currencyService';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

export const GoalsView: React.FC = () => {
  const { t, isRTL, reportingCurrency } = useApp();

  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);

  // Goal Form
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [currency, setCurrency] = useState(reportingCurrency);
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');

  // Allocation Form
  const [allocAmount, setAllocAmount] = useState<number>(0);
  const [allocAccountId, setAllocAccountId] = useState('');
  const [allocNotes, setAllocNotes] = useState('');

  const loadData = async () => {
    const gList = await db.goals.toArray();
    setGoals(gList);

    const accs = await db.accounts.toArray();
    setAccounts(accs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || targetAmount <= 0) return;

    const newGoal: FinancialGoal = {
      id: `goal-${Date.now()}`,
      name: name.trim(),
      targetAmount: Number(targetAmount),
      currentAllocatedAmount: 0,
      currency,
      targetDate: targetDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      priority,
      workspaceScope: 'personal',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await db.goals.add(newGoal);
    setIsGoalModalOpen(false);
    setName('');
    setTargetAmount(0);
    loadData();
  };

  const handleOpenAllocate = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setAllocAmount(0);
    if (accounts.length > 0) setAllocAccountId(accounts[0].id);
    setIsAllocateModalOpen(true);
  };

  const handleExecuteAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || allocAmount <= 0) return;

    const today = new Date().toISOString().split('T')[0];
    const newAllocation: GoalAllocation = {
      id: `galloc-${Date.now()}`,
      goalId: selectedGoal.id,
      date: today,
      amount: Number(allocAmount),
      currency: selectedGoal.currency,
      fromAccountId: allocAccountId,
      notes: allocNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await db.transaction('rw', [db.goals, db.goalAllocations], async () => {
      await db.goalAllocations.add(newAllocation);
      await db.goals.update(selectedGoal.id, {
        currentAllocatedAmount: selectedGoal.currentAllocatedAmount + Number(allocAmount),
      });
    });

    setIsAllocateModalOpen(false);
    setSelectedGoal(null);
    setAllocAmount(0);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.goalsTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? 'تحديد أهداف التوفير وصناديق الطوارئ والاستثمار، وتخصيص المبالغ النقدية تدريجياً.'
              : 'Target savings milestones, emergency reserves, and explicit capital allocations.'}
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setTargetAmount(0);
            setIsGoalModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createGoal}</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={t.noGoalsYet}
          description={
            isRTL
              ? 'ابدأ بتحديد أهدافك المالية مثل: صندوق طوارئ، شراء معدات وأجهزة، أو رحلة سفر.'
              : 'Set your financial goals like an emergency fund, equipment upgrade, or investment target.'
          }
          primaryActionLabel={t.createGoal}
          onPrimaryAction={() => setIsGoalModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const progress =
              g.targetAmount > 0
                ? Math.round((g.currentAllocatedAmount / g.targetAmount) * 100)
                : 0;

            const isCompleted = g.currentAllocatedAmount >= g.targetAmount;

            return (
              <div
                key={g.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {g.name}
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {isRTL ? 'الهدف المالي' : 'Target Date'}: {g.targetDate}
                    </div>
                  </div>

                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isRTL ? 'مكتمل' : 'Reached'}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenAllocate(g)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                    >
                      {isRTL ? 'تخصيص توفير' : 'Allocate'}
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-500">
                      {t.currentSaved}: {formatCurrency(g.currentAllocatedAmount, g.currency)}
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t.targetAmount}</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(g.targetAmount, g.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isRTL ? 'المتبقي للوصول' : 'Remaining'}</span>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                      {formatCurrency(Math.max(0, g.targetAmount - g.currentAllocatedAmount), g.currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title={t.createGoal}
      >
        <form onSubmit={handleSaveGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'اسم الهدف *' : 'Goal Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund (6 Months), New Workstation"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.targetAmount} *
              </label>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={targetAmount || ''}
                onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'تاريخ الإنجاز المستهدف' : 'Target Date'}
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.priority}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="high">{isRTL ? 'أولوية قصوى' : 'High'}</option>
                <option value="medium">{isRTL ? 'أولوية متوسطة' : 'Medium'}</option>
                <option value="low">{isRTL ? 'أولوية منخفضة' : 'Low'}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
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

      {/* Allocate Funds Modal */}
      {selectedGoal && (
        <Modal
          isOpen={isAllocateModalOpen}
          onClose={() => setIsAllocateModalOpen(false)}
          title={`${t.allocateToGoal}: ${selectedGoal.name}`}
        >
          <form onSubmit={handleExecuteAllocation} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'المبلغ المخصص للادخار *' : 'Amount to Allocate *'} ({selectedGoal.currency})
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={allocAmount || ''}
                onChange={(e) => setAllocAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xl font-bold font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'مصدر التخصيص (الحساب)' : 'Source Account'}
              </label>
              <select
                value={allocAccountId}
                onChange={(e) => setAllocAccountId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAllocateModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-xs"
              >
                {isRTL ? 'تأكيد التخصيص' : 'Confirm Allocation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
