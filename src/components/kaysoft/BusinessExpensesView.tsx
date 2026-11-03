import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Plus,
  Calendar,
  FolderKanban,
  Trash2,
  Search,
  Filter,
  Server,
  Layers,
  Tag
} from 'lucide-react';
import { db } from '../../db/db';
import { BusinessExpense, Project } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/currencyService';
import { EmptyState } from '../common/EmptyState';

export const BusinessExpensesView: React.FC = () => {
  const { t, isRTL } = useApp();
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>('Hosting & Servers');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [eList, pList] = await Promise.all([
        db.businessExpenses.orderBy('expenseDate').reverse().toArray(),
        db.projects.toArray()
      ]);
      setExpenses(eList);
      setProjects(pList);
    } catch (err) {
      console.error('Failed to load business expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا المصروف التجاري؟' : 'Delete this business expense?')) {
      try {
        await db.businessExpenses.delete(id);
        await loadData();
      } catch (err) {
        console.error('Failed to delete expense:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    try {
      const newExp: BusinessExpense = {
        id: crypto.randomUUID(),
        title,
        amount: Number(amount),
        currency: 'EGP',
        category,
        expenseDate,
        projectId: projectId || undefined,
        notes: notes || undefined,
        createdAt: new Date().toISOString()
      };
      await db.businessExpenses.add(newExp);

      setIsModalOpen(false);
      setTitle('');
      setAmount(0);
      setNotes('');
      await loadData();
    } catch (err) {
      console.error('Failed to save business expense:', err);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const filtered = expenses.filter(e => {
    const proj = projects.find(p => p.id === e.projectId);
    const matchesSearch =
      ((e.title || e.name || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proj && proj.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingDown className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            <span>{isRTL ? 'مصاريف وتشغيل KAY-SOFT' : 'Business Operating Expenses'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'تكاليف الخوادم السحابية، اشتراكات الأدوات البرمجية، والمطورين المتعاقدين' : 'Servers, APIs, developer contractor fees, hosting, and operational costs'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{isRTL ? 'إجمالي المصاريف:' : 'Total Costs:'}</span>
            <span className="text-base sm:text-lg font-black font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {formatCurrency(totalExpenses, 'EGP')}
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRTL ? 'إضافة مصروف' : 'Add Expense'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-56">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="all">{isRTL ? 'جميع التصنيفات' : 'All Categories'}</option>
            <option value="Hosting & Servers">{isRTL ? 'خوادم واستضافة' : 'Hosting & Servers'}</option>
            <option value="SaaS & Developer Tools">{isRTL ? 'أدوات واشتراكات برمجية' : 'SaaS & Dev Tools'}</option>
            <option value="Contractors & Freelancers">{isRTL ? 'مطورين ومستقلين' : 'Contractors & Freelancers'}</option>
            <option value="Domains & SSL">{isRTL ? 'نطاقات وشهادات أمان' : 'Domains & SSL'}</option>
            <option value="Marketing & Sales">{isRTL ? 'تسويق ومبيعات' : 'Marketing & Sales'}</option>
            <option value="Office & Operations">{isRTL ? 'مقر وعمليات عامة' : 'Office & Operations'}</option>
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRTL ? 'بحث في المصاريف...' : 'Search expenses...'}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={isRTL ? 'لا توجد مصاريف تجارية مسجلة' : 'No Business Expenses'}
          description={isRTL ? 'سجّل تكاليف الخوادم والاشتراكات لربطها بأرباح KAY-SOFT بدقة.' : 'Track operational infrastructure and tooling costs.'}
          icon={TrendingDown}
          actionLabel={isRTL ? 'إضافة مصروف' : 'Add Expense'}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(e => {
              const proj = projects.find(p => p.id === e.projectId);

              return (
                <div
                  key={e.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                      <Server className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {e.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {e.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {proj ? (
                          <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <FolderKanban className="w-3 h-3" />
                            {proj.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">{isRTL ? 'مصروف عام للمنشأة' : 'General Business'}</span>
                        )}
                        {e.notes && <span>• {e.notes}</span>}
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        {e.expenseDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                        -{formatCurrency(e.amount, e.currency || 'EGP')}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(e.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              {isRTL ? 'إضافة مصروف تجاري جديد' : 'New Business Expense'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'بيان المصروف *' : 'Expense Description *'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isRTL ? 'خادم سحابي AWS، اشتراك GitHub، أتعاب مصمم...' : 'AWS Server, GitHub subscription, Freelance contractor...'}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'المبلغ (EGP) *' : 'Amount (EGP) *'}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Hosting & Servers">{isRTL ? 'خوادم واستضافة' : 'Hosting & Servers'}</option>
                    <option value="SaaS & Developer Tools">{isRTL ? 'أدوات واشتراكات برمجية' : 'SaaS & Dev Tools'}</option>
                    <option value="Contractors & Freelancers">{isRTL ? 'مطورين ومستقلين' : 'Contractors & Freelancers'}</option>
                    <option value="Domains & SSL">{isRTL ? 'نطاقات وشهادات أمان' : 'Domains & SSL'}</option>
                    <option value="Marketing & Sales">{isRTL ? 'تسويق ومبيعات' : 'Marketing & Sales'}</option>
                    <option value="Office & Operations">{isRTL ? 'مقر وعمليات عامة' : 'Office & Operations'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'تاريخ الصرف *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'تخصيص لمشروع معين' : 'Allocated Project'}
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">{isRTL ? 'مصروف عام (General)' : 'General Business'}</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'ملاحظات' : 'Notes'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  {isRTL ? 'حفظ المصروف' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
