import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Plus,
  Calendar,
  Building2,
  Trash2,
  Search,
  CheckCircle2,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Video
} from 'lucide-react';
import { db } from '../../db/db';
import { Visit, Company } from '../../types';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';

export const VisitsView: React.FC = () => {
  const { t, isRTL } = useApp();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [type, setType] = useState<'visit' | 'call' | 'demo' | 'support'>('visit');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [summary, setSummary] = useState('');
  const [outcome, setOutcome] = useState('positive');
  const [nextFollowUpDays, setNextFollowUpDays] = useState(14);

  const loadData = async () => {
    try {
      const [vList, cList] = await Promise.all([
        db.visits.orderBy('visitDate').reverse().toArray(),
        db.companies.toArray()
      ]);
      setVisits(vList);
      setCompanies(cList);
      if (cList.length > 0 && !companyId) {
        setCompanyId(cList[0].id);
      }
    } catch (err) {
      console.error('Failed to load visits:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Delete this interaction record?')) {
      try {
        await db.visits.delete(id);
        await loadData();
      } catch (err) {
        console.error('Failed to delete visit:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !purpose) return;

    try {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + nextFollowUpDays);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      const newVisit: Visit = {
        id: crypto.randomUUID(),
        companyId,
        type,
        visitDate: `${visitDate}T10:00:00Z`,
        purpose,
        summary: summary || purpose,
        outcome,
        nextFollowUpDate: nextDateStr,
        createdAt: new Date().toISOString()
      };
      await db.visits.add(newVisit);

      // Auto update company
      await db.companies.update(companyId, {
        lastVisitDate: `${visitDate}T10:00:00Z`,
        nextFollowUpDate: nextDateStr
      });

      // Also create a follow-up task
      const comp = companies.find(c => c.id === companyId);
      await db.followUps.add({
        id: crypto.randomUUID(),
        companyId,
        title: `${type === 'call' ? 'Call' : 'Visit'} follow-up: ${comp ? comp.name : ''}`,
        description: summary || purpose,
        dueDate: nextDateStr,
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString()
      });

      setIsModalOpen(false);
      setPurpose('');
      setSummary('');
      await loadData();
    } catch (err) {
      console.error('Failed to record interaction:', err);
    }
  };

  const filtered = visits.filter(v => {
    const comp = companies.find(c => c.id === v.companyId);
    const matchesSearch =
      v.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.summary && v.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (comp && comp.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType !== 'all' && v.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <PhoneCall className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <span>{isRTL ? 'سجل الزيارات والاتصالات' : 'Interactions & Visits Log'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'توثيق الزيارات الميدانية، المكالمات الهاتفية، وعروض الأنظمة' : 'Complete timeline of in-person visits, phone calls, demos, and support touchpoints'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRTL ? 'تسجيل تفاعل جديد' : 'Log Interaction'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'visit', 'call', 'demo', 'support'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === tab
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'all' && (isRTL ? 'الكل' : 'All')}
              {tab === 'visit' && (isRTL ? 'زيارات ميدانية' : 'Visits')}
              {tab === 'call' && (isRTL ? 'مكالمات' : 'Calls')}
              {tab === 'demo' && (isRTL ? 'عروض نظام' : 'Demos')}
              {tab === 'support' && (isRTL ? 'دعم فني' : 'Support')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRTL ? 'بحث بالشركة أو التفاصيل...' : 'Search logs...'}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={isRTL ? 'لا توجد سجلات تفاعل' : 'No Interactions Found'}
          description={isRTL ? 'قم بتسجيل الزيارة أو المكالمة الأولى للعميل.' : 'Record your first customer visit, call, or system walkthrough.'}
          icon={PhoneCall}
          actionLabel={isRTL ? 'تسجيل تفاعل' : 'Log Interaction'}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(v => {
            const comp = companies.find(c => c.id === v.companyId);

            return (
              <div
                key={v.id}
                className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {comp ? comp.name : (isRTL ? 'شركة غير محددة' : 'Unknown Company')}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 uppercase">
                      {v.type}
                    </span>
                    {v.outcome && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {v.outcome}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    {v.purpose}
                  </h4>

                  {v.summary && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {v.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(v.visitDate || v.date || 0).toLocaleDateString()}
                    </span>
                    {v.nextFollowUpDate && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        {isRTL ? `المتابعة: ${v.nextFollowUpDate}` : `Next: ${v.nextFollowUpDate}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleDelete(v.id)}
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
              {isRTL ? 'تسجيل تفاعل جديد' : 'Log New Interaction'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'الشركة *' : 'Company *'}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'النوع' : 'Type'}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="visit">{isRTL ? 'زيارة ميدانية' : 'In-person Visit'}</option>
                    <option value="call">{isRTL ? 'مكالمة هاتفية' : 'Phone Call'}</option>
                    <option value="demo">{isRTL ? 'عرض النظام (Demo)' : 'Product Demo'}</option>
                    <option value="support">{isRTL ? 'جلسة دعم' : 'Support Session'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'تاريخ التفاعل *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'الغرض / الموضوع الأساسي *' : 'Primary Purpose *'}
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={isRTL ? 'مناقشة تجديد الاشتراك، تدريب فريق العمل...' : 'Quarterly review, product demo, support issue...'}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'ملخص ما تم وما تم الاتفاق عليه' : 'Discussion Summary & Agreements'}
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'النتيجة' : 'Outcome'}
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="positive">{isRTL ? 'إيجابي ومثمر' : 'Positive'}</option>
                    <option value="needs_follow_up">{isRTL ? 'يحتاج متابعة' : 'Needs Follow-up'}</option>
                    <option value="deal_closed">{isRTL ? 'تم التعاقد' : 'Deal Closed'}</option>
                    <option value="support_resolved">{isRTL ? 'تم حل المشكلة' : 'Resolved'}</option>
                    <option value="neutral">{isRTL ? 'محايد' : 'Neutral'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'جدولة المتابعة القادمة بعد' : 'Follow-up In'}
                  </label>
                  <select
                    value={nextFollowUpDays}
                    onChange={(e) => setNextFollowUpDays(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value={3}>{isRTL ? '3 أيام' : '3 Days'}</option>
                    <option value={7}>{isRTL ? '7 أيام' : '7 Days'}</option>
                    <option value={14}>{isRTL ? '14 يوم' : '14 Days'}</option>
                    <option value={30}>{isRTL ? '30 يوم' : '30 Days'}</option>
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
                  {isRTL ? 'تسجيل وحفظ' : 'Log & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
