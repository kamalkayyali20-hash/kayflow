import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  Trash2,
  Search,
  Filter,
  Check,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { db } from '../../db/db';
import { SupportIssue, Company } from '../../types';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';

export const SupportIssuesView: React.FC = () => {
  const { t, isRTL } = useApp();
  const [issues, setIssues] = useState<SupportIssue[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [companyId, setCompanyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');

  const loadData = async () => {
    try {
      const [iList, cList] = await Promise.all([
        db.supportIssues.orderBy('createdAt').reverse().toArray(),
        db.companies.toArray()
      ]);
      setIssues(iList);
      setCompanies(cList);
      if (cList.length > 0 && !companyId) {
        setCompanyId(cList[0].id);
      }
    } catch (err) {
      console.error('Failed to load support issues:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
    try {
      await db.supportIssues.update(id, {
        status,
        resolvedAt: status === 'resolved' || status === 'closed' ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString()
      });
      await loadData();
    } catch (err) {
      console.error('Failed to update issue status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذه المشكلة؟' : 'Delete this support issue?')) {
      try {
        await db.supportIssues.delete(id);
        await loadData();
      } catch (err) {
        console.error('Failed to delete issue:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !title) return;

    try {
      const newIssue: SupportIssue = {
        id: crypto.randomUUID(),
        companyId,
        title,
        description,
        priority,
        status: 'open',
        createdAt: new Date().toISOString()
      };
      await db.supportIssues.add(newIssue);

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      await loadData();
    } catch (err) {
      console.error('Failed to add support issue:', err);
    }
  };

  const filtered = issues.filter(i => {
    const comp = companies.find(c => c.id === i.companyId);
    const matchesSearch =
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (comp && comp.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    return true;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">{isRTL ? 'عاجل جداً' : 'Urgent'}</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">{isRTL ? 'عالي' : 'High'}</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">{isRTL ? 'متوسط' : 'Medium'}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{isRTL ? 'منخفض' : 'Low'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            <span>{isRTL ? 'بلاغات ومشاكل الدعم الفني' : 'Support Issues & SLAs'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'متابعة مشاكل النظام، طلبات التطوير، وتذاكر الصيانة للشركات المتعاقدة' : 'Track software defects, feature requests, and maintenance support tickets'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRTL ? 'تسجيل بلاغ دعم جديد' : 'Log Support Ticket'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['open', 'in_progress', 'resolved', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'open' && (isRTL ? 'المفتوحة' : 'Open')}
              {tab === 'in_progress' && (isRTL ? 'قيد المعالجة' : 'In Progress')}
              {tab === 'resolved' && (isRTL ? 'تم الحل' : 'Resolved')}
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
            placeholder={isRTL ? 'بحث في البلاغات...' : 'Search issues...'}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={isRTL ? 'لا توجد بلاغات دعم' : 'No Support Issues'}
          description={isRTL ? 'جميع الأنظمة تعمل بكفاءة ولا توجد مشاكل معلقة.' : 'All systems operating smoothly or no tickets match the selected filter.'}
          icon={CheckCircle2}
          actionLabel={isRTL ? 'تسجيل بلاغ' : 'Log Issue'}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(i => {
            const comp = companies.find(c => c.id === i.companyId);

            return (
              <div
                key={i.id}
                className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {getPriorityBadge(i.priority)}
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {comp ? comp.name : (isRTL ? 'شركة غير محددة' : 'Unknown')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(i.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {i.title}
                  </h3>

                  {i.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 whitespace-pre-line">
                      {i.description}
                    </p>
                  )}

                  {i.resolutionNotes && (
                    <div className="mt-2.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                      <span className="font-bold">{isRTL ? 'ملاحظات الحل:' : 'Resolution:'}</span> {i.resolutionNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start">
                  {i.status !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(i.id, 'resolved')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isRTL ? 'تم الحل' : 'Resolve'}</span>
                    </button>
                  )}

                  {i.status === 'open' && (
                    <button
                      onClick={() => handleUpdateStatus(i.id, 'in_progress')}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      <span>{isRTL ? 'قيد البدء' : 'Start'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(i.id)}
                    title={isRTL ? 'حذف' : 'Delete'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
              {isRTL ? 'تسجيل بلاغ دعم جديد' : 'Log Support Issue'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'الشركة المتضررة *' : 'Company *'}
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
                  {isRTL ? 'الأولوية / درجة الإلحاح' : 'Priority Level'}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="urgent">{isRTL ? 'عاجل جداً (توقف كلي للعمليات)' : 'Urgent (Critical operations stopped)'}</option>
                  <option value="high">{isRTL ? 'عالي (عطل في وظيفة رئيسية)' : 'High (Core function failing)'}</option>
                  <option value="medium">{isRTL ? 'متوسط (استفسار / عطل فرعي)' : 'Medium (Minor bug / query)'}</option>
                  <option value="low">{isRTL ? 'منخفض (اقتراح تحسين)' : 'Low (Cosmetic / suggestion)'}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'عنوان المشكلة أو الخطأ *' : 'Issue Summary *'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isRTL ? 'خطأ في طباعة فواتير نقاط البيع...' : 'POS receipt printer disconnection...'}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'تفاصيل المشكلة وخطوات التكرار' : 'Detailed Description & Reproduction'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
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
                  {isRTL ? 'تسجيل البلاغ' : 'Save Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
