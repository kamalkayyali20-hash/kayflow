import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type { FinancialReminder, ReminderType } from '../../types';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../../services/currencyService';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

const REMINDER_TYPES: { id: ReminderType; labelEn: string; labelAr: string }[] = [
  { id: 'salary_expected', labelEn: 'Expected Salary', labelAr: 'استحقاق راتب' },
  { id: 'debt_installment', labelEn: 'Debt Installment Due', labelAr: 'قسط دين مستحق' },
  { id: 'contract_payment', labelEn: 'Contract Milestone Due', labelAr: 'دفعة عقد مستحقة' },
  { id: 'invoice_due', labelEn: 'Invoice Due', labelAr: 'فاتورة مستحقة' },
  { id: 'subscription_renewal', labelEn: 'Subscription Renewal', labelAr: 'تجديد اشتراك' },
  { id: 'recurring_expense', labelEn: 'Recurring Expense', labelAr: 'مصروف دوري' },
  { id: 'budget_review', labelEn: 'Budget Review', labelAr: 'مراجعة الميزانية' },
  { id: 'savings_goal', labelEn: 'Goal Deadline', labelAr: 'موعد إنجاز هدف' },
];

export const RemindersView: React.FC = () => {
  const { t, isRTL, reportingCurrency } = useApp();

  const [reminders, setReminders] = useState<FinancialReminder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [reminderType, setReminderType] = useState<ReminderType>('debt_installment');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState(reportingCurrency);
  const [notes, setNotes] = useState('');

  const loadReminders = async () => {
    const list = await db.reminders.toArray();
    list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    setReminders(list);
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newReminder: FinancialReminder = {
      id: `rem-${Date.now()}`,
      title: title.trim(),
      reminderType,
      dueDate,
      amount: amount > 0 ? Number(amount) : undefined,
      currency: amount > 0 ? currency : undefined,
      isCompleted: false,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await db.reminders.add(newReminder);
    setIsModalOpen(false);
    setTitle('');
    setAmount(0);
    loadReminders();
  };

  const handleToggleComplete = async (r: FinancialReminder) => {
    await db.reminders.update(r.id, {
      isCompleted: !r.isCompleted,
      completedDate: !r.isCompleted ? new Date().toISOString().split('T')[0] : undefined,
    });
    loadReminders();
  };

  const handleDelete = async (id: string) => {
    await db.reminders.delete(id);
    loadReminders();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.navReminders}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? 'مواعيد الاستحقاق القادمة، أقساط الديون، استلام الرواتب، وتجديد الاشتراكات.'
              : 'Upcoming financial obligations, installment dates, salary due dates, and subscription renewals.'}
          </p>
        </div>

        <button
          onClick={() => {
            setTitle('');
            setAmount(0);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isRTL ? 'إضافة تنبيه مالي' : 'Add Financial Reminder'}</span>
        </button>
      </div>

      {reminders.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={isRTL ? 'لا توجد تنبيهات مالية قادمة' : 'No upcoming financial obligations'}
          description={
            isRTL
              ? 'أضف تذكيرات بأقساط الديون ومواعيد استلام الرواتب أو الفواتير الشهرية.'
              : 'Add reminders for loan installments, expected salary dates, or subscription deadlines.'
          }
          primaryActionLabel={isRTL ? 'إضافة تنبيه مالي' : 'Add Financial Reminder'}
          onPrimaryAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {reminders.map((r) => {
            const isOverdue =
              !r.isCompleted &&
              new Date(r.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

            return (
              <div
                key={r.id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  r.isCompleted ? 'opacity-60 bg-slate-50/50 dark:bg-slate-800/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleComplete(r)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      r.isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {r.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold text-slate-900 dark:text-slate-100 ${
                          r.isCompleted ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {r.title}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-sm">
                          {isRTL ? 'متأخر' : 'Overdue'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{r.dueDate}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{r.reminderType.replace('_', ' ')}</span>
                      {r.notes && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{r.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {r.amount !== undefined && (
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(r.amount, r.currency || reportingCurrency)}
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isRTL ? 'إضافة تنبيه مالي' : 'New Financial Reminder'}
      >
        <form onSubmit={handleSaveReminder} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'عنوان التنبيه *' : 'Reminder Title *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bank Loan Installment, AWS Hosting Renewal"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'نوع التنبيه' : 'Type'}
              </label>
              <select
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value as ReminderType)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {REMINDER_TYPES.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {isRTL ? rt.labelAr : rt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'تاريخ الاستحقاق *' : 'Due Date *'}
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'المبلغ المرتبط (اختياري)' : 'Amount (Optional)'}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
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

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.notes}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional reminder details..."
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
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
