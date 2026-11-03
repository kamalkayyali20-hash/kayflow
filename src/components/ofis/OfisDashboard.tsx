import React, { useState, useEffect } from 'react';
import {
  Building2,
  PhoneCall,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  ExternalLink,
  Users,
  ShieldAlert,
  Headphones,
  Check
} from 'lucide-react';
import { db } from '../../db/db';
import { Company, Contract, Visit, FollowUp, SupportIssue } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/currencyService';
import { CompanyModal } from './CompanyModal';

export const OfisDashboard: React.FC = () => {
  const { t, isRTL, setActiveNav } = useApp();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [supportIssues, setSupportIssues] = useState<SupportIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick modals
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cList, ctList, vList, fList, sList] = await Promise.all([
        db.companies.toArray(),
        db.contracts.toArray(),
        db.visits.orderBy('visitDate').reverse().limit(10).toArray(),
        db.followUps.orderBy('dueDate').toArray(),
        db.supportIssues.toArray()
      ]);
      setCompanies(cList);
      setContracts(ctList);
      setVisits(vList);
      setFollowUps(fList);
      setSupportIssues(sList);
    } catch (err) {
      console.error('Failed to load OFIS dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculations
  const activeCompanies = companies.filter(c => c.status === 'active');
  const leadCompanies = companies.filter(c => c.status === 'lead');
  const prospectCompanies = companies.filter(c => c.status === 'prospect');
  const atRiskCompanies = companies.filter(c => c.status === 'at_risk');

  const activeContracts = contracts.filter(c => c.status === 'active');
  const totalActiveContractValue = activeContracts.reduce((sum, c) => sum + (c.contractValue || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingFollowUps = followUps.filter(f => f.status === 'pending');
  const overdueFollowUps = pendingFollowUps.filter(f => f.dueDate < todayStr);
  const todayFollowUps = pendingFollowUps.filter(f => f.dueDate === todayStr);

  const openSupportIssues = supportIssues.filter(s => s.status === 'open' || s.status === 'in_progress');
  const urgentSupportIssues = openSupportIssues.filter(s => s.priority === 'urgent' || s.priority === 'high');

  const handleCompleteFollowUp = async (id: string) => {
    try {
      await db.followUps.update(id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      await loadData();
    } catch (err) {
      console.error('Failed to complete follow up:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-700 dark:from-sky-900/80 dark:to-indigo-950/80 rounded-2xl p-5 sm:p-6 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-bold tracking-wider uppercase mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>OFIS-SOFT Account Management</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {isRTL ? 'لوحة تحكم إدارة الحسابات والشركات' : 'OFIS-SOFT Operations Dashboard'}
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
              {isRTL
                ? 'متابعة شاملة لعملاء الشركة، عقود الصيانة، جدولة الزيارات والمكالمات، ومشاكل الدعم الفني.'
                : 'Centralized account management hub for client companies, active contracts, scheduled touchpoints, and SLA issues.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCompanyModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-sky-700 hover:bg-sky-50 text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRTL ? 'إضافة شركة' : 'Add Company'}</span>
            </button>
            <button
              onClick={() => setActiveNav('ofis-companies')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>{isRTL ? 'دليل الشركات' : 'View Directory'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Companies */}
        <div
          onClick={() => setActiveNav('ofis-companies')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">{isRTL ? 'إجمالي الشركات' : 'Total Companies'}</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {companies.length}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeCompanies.length} {isRTL ? 'نشط' : 'active'}</span>
            <span>•</span>
            <span className="text-sky-600 dark:text-sky-400 font-semibold">{leadCompanies.length + prospectCompanies.length} {isRTL ? 'محتمل' : 'leads'}</span>
            {atRiskCompanies.length > 0 && (
              <>
                <span>•</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">{atRiskCompanies.length} {isRTL ? 'في خطر' : 'risk'}</span>
              </>
            )}
          </div>
        </div>

        {/* Active Contracts */}
        <div
          onClick={() => setActiveNav('ofis-contracts')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">{isRTL ? 'العقود النشطة' : 'Active Contracts'}</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {activeContracts.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate font-mono">
            {isRTL ? 'القيمة الإجمالية:' : 'Total Value:'} <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalActiveContractValue, 'EGP')}</span>
          </div>
        </div>

        {/* Pending Follow-ups */}
        <div
          onClick={() => setActiveNav('ofis-followups')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">{isRTL ? 'متابعات معلقة' : 'Pending Follow-ups'}</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums flex items-baseline gap-2">
            <span>{pendingFollowUps.length}</span>
            {overdueFollowUps.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 font-bold">
                {overdueFollowUps.length} {isRTL ? 'متأخر' : 'overdue'}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            <span className="font-semibold text-amber-600 dark:text-amber-400">{todayFollowUps.length} {isRTL ? 'مطلوبة اليوم' : 'due today'}</span>
          </div>
        </div>

        {/* Open Support Issues */}
        <div
          onClick={() => setActiveNav('ofis-issues')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">{isRTL ? 'مشاكل الدعم الفني' : 'Support Tickets'}</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums flex items-baseline gap-2">
            <span>{openSupportIssues.length}</span>
            {urgentSupportIssues.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 font-bold">
                {urgentSupportIssues.length} {isRTL ? 'عاجل' : 'urgent'}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {openSupportIssues.length === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{isRTL ? 'لا توجد بلاغات معلقة' : 'All clear'}</span>
            ) : (
              <span>{isRTL ? 'قيد المتابعة والإصلاح' : 'In progress / active'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Follow-ups + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent & Due Follow-ups */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  {isRTL ? 'متابعات تستوجب التدخل' : 'Actionable Follow-ups'}
                </h2>
              </div>
              <button
                onClick={() => setActiveNav('ofis-followups')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 cursor-pointer"
              >
                <span>{isRTL ? 'عرض الكل' : 'View All'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingFollowUps.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                {isRTL ? 'رائع! لا توجد متابعات معلقة اليوم.' : 'No pending follow-ups right now.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingFollowUps.slice(0, 5).map((fu) => {
                  const company = companies.find(c => c.id === fu.companyId);
                  const isOverdue = fu.dueDate < todayStr;
                  const isToday = fu.dueDate === todayStr;

                  return (
                    <div
                      key={fu.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {fu.title}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 font-bold shrink-0">
                              {isRTL ? 'متأخر' : 'Overdue'}
                            </span>
                          )}
                          {isToday && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 font-bold shrink-0">
                              {isRTL ? 'اليوم' : 'Today'}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
                          {company && <span className="font-semibold text-slate-700 dark:text-slate-300">{company.name}</span>}
                          <span>•</span>
                          <span className="font-mono">{fu.dueDate}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCompleteFollowUp(fu.id)}
                        title={isRTL ? 'تعليم كمكتمل' : 'Mark Completed'}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors shrink-0 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveNav('ofis-followups')}
              className="w-full py-2 rounded-xl text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors text-center cursor-pointer"
            >
              {isRTL ? 'جدول المتابعات والاتصالات الكامل' : 'Open Full Follow-ups Schedule'}
            </button>
          </div>
        </div>

        {/* Recent Visits & Touchpoints */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-sky-500" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  {isRTL ? 'آخر الزيارات والتفاعلات' : 'Recent Interactions Log'}
                </h2>
              </div>
              <button
                onClick={() => setActiveNav('ofis-visits')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 cursor-pointer"
              >
                <span>{isRTL ? 'عرض السجل' : 'View All'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {visits.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <PhoneCall className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                {isRTL ? 'لا توجد زيارات أو اتصالات مسجلة مؤخراً.' : 'No visits or touchpoints recorded yet.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {visits.slice(0, 5).map((visit) => {
                  const company = companies.find(c => c.id === visit.companyId);

                  return (
                    <div
                      key={visit.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {company ? company.name : (isRTL ? 'شركة' : 'Company')}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 font-semibold uppercase">
                            {visit.type}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                          {visit.summary}
                        </p>

                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          {visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : ''}
                          {visit.outcome && <span className="ml-2 font-sans font-medium text-slate-500">• {visit.outcome}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveNav('ofis-visits')}
              className="w-full py-2 rounded-xl text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors text-center cursor-pointer"
            >
              {isRTL ? 'سجل الزيارات والمكالمات الكامل' : 'Open Full Interaction History'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isCompanyModalOpen && (
        <CompanyModal
          isOpen={isCompanyModalOpen}
          onClose={() => setIsCompanyModalOpen(false)}
          onSaved={() => {
            setIsCompanyModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};
