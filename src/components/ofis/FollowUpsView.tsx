import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Check,
  AlertCircle,
  Calendar,
  Building2,
  Trash2,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { db } from '../../db/db';
import { FollowUp, Company } from '../../types';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';

export const FollowUpsView: React.FC = () => {
  const { t, isRTL } = useApp();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const loadData = async () => {
    try {
      const [fList, cList] = await Promise.all([
        db.followUps.orderBy('dueDate').toArray(),
        db.companies.toArray()
      ]);
      setFollowUps(fList);
      setCompanies(cList);
      if (cList.length > 0 && !companyId) {
        setCompanyId(cList[0].id);
      }
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleComplete = async (fu: FollowUp) => {
    try {
      const nextStatus = fu.status === 'completed' ? 'pending' : 'completed';
      await db.followUps.update(fu.id, {
        status: nextStatus,
        completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined
      });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle follow-up:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذه المتابعة؟' : 'Delete this follow-up?')) {
      try {
        await db.followUps.delete(id);
        await loadData();
      } catch (err) {
        console.error('Failed to delete follow-up:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate || !companyId) return;

    try {
      const newFu: FollowUp = {
        id: crypto.randomUUID(),
        companyId,
        title,
        description,
        dueDate,
        priority,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await db.followUps.add(newFu);

      // Update company's next follow-up date
      const comp = companies.find(c => c.id === companyId);
      if (comp && (!comp.nextFollowUpDate || dueDate < comp.nextFollowUpDate)) {
        await db.companies.update(companyId, { nextFollowUpDate: dueDate });
      }

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      await loadData();
    } catch (err) {
      console.error('Failed to add follow up:', err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = followUps.filter(fu => {
    const comp = companies.find(c => c.id === fu.companyId);
    const matchesSearch =
      fu.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fu.description && fu.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (comp && comp.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'pending') return fu.status === 'pending';
    if (filter === 'completed') return fu.status === 'completed';
    if (filter === 'overdue') return fu.status === 'pending' && fu.dueDate < todayStr;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-amber-500" />
            <span>{isRTL ? 'جدول المتابعات والاتصالات' : 'Scheduled Follow-ups'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'تتبع مواعيد الاتصال الدوري، مراجعات العقود، واستفسارات الشركات' : 'Track recurring client calls, contract reviews, and scheduled checkpoints'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRTL ? 'إضافة متابعة جديدة' : 'Add Follow-up'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['pending', 'overdue', 'completed', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === tab
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'pending' && (isRTL ? 'المعلقة' : 'Pending')}
              {tab === 'overdue' && (isRTL ? 'المتأخرة' : 'Overdue')}
              {tab === 'completed' && (isRTL ? 'المكتملة' : 'Completed')}
              {tab === 'all' && (isRTL ? 'الكل' : 'All')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRTL ? 'بحث في المتابعات والشركات...' : 'Search follow-ups...'}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={isRTL ? 'لا توجد متابعات' : 'No Follow-ups Found'}
          description={isRTL ? 'لا توجد متابعات مطابقة للحالة المحددة.' : 'No follow-up tasks match this view filter.'}
          icon={Clock}
          actionLabel={isRTL ? 'إضافة متابعة' : 'Add Follow-up'}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(fu => {
            const comp = companies.find(c => c.id === fu.companyId);
            const isOverdue = fu.status === 'pending' && fu.dueDate < todayStr;
            const isToday = fu.status === 'pending' && fu.dueDate === todayStr;

            return (
              <div
                key={fu.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  fu.status === 'completed'
                    ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-70'
                    : isOverdue
                    ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(fu)}
                    className={`mt-0.5 p-1.5 rounded-lg border transition-colors shrink-0 ${
                      fu.status === 'completed'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-sm font-bold ${
                          fu.status === 'completed'
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {fu.title}
                      </h3>

                      {isOverdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                          {isRTL ? 'متأخر' : 'Overdue'}
                        </span>
                      )}

                      {isToday && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                          {isRTL ? 'اليوم' : 'Today'}
                        </span>
                      )}

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                        {fu.priority}
                      </span>
                    </div>

                    {fu.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {fu.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      {comp && (
                        <span className="flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400">
                          <Building2 className="w-3.5 h-3.5" />
                          {comp.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {fu.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(fu.id)}
                  title={isRTL ? 'حذف' : 'Delete'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              {isRTL ? 'إضافة متابعة جديدة' : 'Add Scheduled Follow-up'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'الشركة المستهدفة *' : 'Company *'}
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'عنوان المتابعة *' : 'Title *'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isRTL ? 'مكالمة متابعة العرض المالي، تجديد العقد...' : 'Follow-up on proposal, contract renewal...'}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'تفاصيل المتابعة' : 'Details / Notes'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'تاريخ الاستحقاق *' : 'Due Date *'}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'الأولوية' : 'Priority'}
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="low">{isRTL ? 'منخفضة' : 'Low'}</option>
                    <option value="medium">{isRTL ? 'متوسطة' : 'Medium'}</option>
                    <option value="high">{isRTL ? 'عالية' : 'High'}</option>
                    <option value="urgent">{isRTL ? 'عاجلة جداً' : 'Urgent'}</option>
                  </select>
                </div>
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
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                >
                  {isRTL ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
