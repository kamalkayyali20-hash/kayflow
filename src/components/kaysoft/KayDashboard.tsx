import React, { useState, useEffect } from 'react';
import {
  Code2,
  FolderKanban,
  Repeat,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Percent,
  Users,
  Plus,
  ArrowRight,
  ExternalLink,
  CreditCard,
  Building2,
  Server
} from 'lucide-react';
import { db } from '../../db/db';
import { Project, Customer, ProjectSale, CustomerPayment, BusinessExpense, Partner } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/currencyService';

export const KayDashboard: React.FC = () => {
  const { t, isRTL, setActiveNav } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<ProjectSale[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prList, cList, sList, pmList, eList, pList] = await Promise.all([
        db.projects.toArray(),
        db.customers.toArray(),
        db.projectSales.toArray(),
        db.customerPayments.orderBy('paymentDate').reverse().limit(10).toArray(),
        db.businessExpenses.toArray(),
        db.partners.toArray()
      ]);
      setProjects(prList);
      setCustomers(cList);
      setSales(sList);
      setPayments(pmList);
      setExpenses(eList);
      setPartners(pList);
    } catch (err) {
      console.error('Failed to load KAY-SOFT dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Metrics
  const activeSales = sales.filter(s => s.status === 'active');
  const totalMRR = activeSales.reduce((sum, s) => {
    if (s.billingFrequency === 'monthly') return sum + (s.subscriptionAmount || 0);
    if (s.billingFrequency === 'yearly') return sum + (s.subscriptionAmount || 0) / 12;
    return sum;
  }, 0);

  const totalCollectedRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalBusinessExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = Math.max(0, totalCollectedRevenue - totalBusinessExpenses);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-900/80 dark:to-teal-950/80 rounded-2xl p-5 sm:p-6 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-bold tracking-wider uppercase mb-2">
              <Code2 className="w-3.5 h-3.5" />
              <span>KAY-SOFT Software Business</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {isRTL ? 'لوحة تحكم أعمال ومشاريع البرمجيات' : 'KAY-SOFT Operations Cockpit'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
              {isRTL
                ? 'إدارة المنتجات البرمجية، اشتراكات العملاء المتكررة (MRR)، ومصاريف التشغيل وتوزيع أرباح الشركاء.'
                : 'Commercial software suite management: multi-customer product sales, recurring subscriptions, and profit sharing.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveNav('kay-sales')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Repeat className="w-4 h-4" />
              <span>{isRTL ? 'إتمام بيع جديد' : 'New Project Sale'}</span>
            </button>
            <button
              onClick={() => setActiveNav('kay-customers')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>{isRTL ? 'إدارة العملاء' : 'Clients'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* MRR */}
        <div
          onClick={() => setActiveNav('kay-sales')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">{isRTL ? 'الدخل الشهري المتكرر (MRR)' : 'Recurring MRR'}</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {formatCurrency(totalMRR, 'EGP')}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            {isRTL ? `${activeSales.length} اشتراك نشط` : `${activeSales.length} active licenses`}
          </div>
        </div>

        {/* Collected Inflow */}
        <div
          onClick={() => setActiveNav('kay-revenue')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">{isRTL ? 'إجمالي المحصل' : 'Collected Inflow'}</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {formatCurrency(totalCollectedRevenue, 'EGP')}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {isRTL ? 'اشتراكات ورسوم تأسيس' : 'Cash collected to date'}
          </div>
        </div>

        {/* Business Costs */}
        <div
          onClick={() => setActiveNav('kay-expenses')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">{isRTL ? 'مصاريف التشغيل' : 'Business Costs'}</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums">
            {formatCurrency(totalBusinessExpenses, 'EGP')}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {isRTL ? 'خوادم وأدوات ومطورين' : 'Hosting & infrastructure'}
          </div>
        </div>

        {/* Net Profit */}
        <div
          onClick={() => setActiveNav('kay-partners')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">{isRTL ? 'صافي الأرباح' : 'Net Business Profit'}</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {formatCurrency(netProfit, 'EGP')}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {isRTL ? `${partners.length} شركاء مسجلين` : `${partners.length} equity partners`}
          </div>
        </div>
      </div>

      {/* Grid: Software Portfolio & Recent Cash Inflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Software Projects Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  {isRTL ? 'الأنظمة البرمجية والمبيعات' : 'Software Portfolio & Sales'}
                </h2>
              </div>
              <button
                onClick={() => setActiveNav('kay-projects')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <span>{isRTL ? 'المشاريع' : 'Projects'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {isRTL ? 'لم يتم إضافة مشاريع برمجية بعد.' : 'No software products added yet.'}
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map(proj => {
                  const projSales = sales.filter(s => s.projectId === proj.id && s.status === 'active');
                  const projMRR = projSales.reduce((sum, s) => {
                    if (s.billingFrequency === 'monthly') return sum + (s.subscriptionAmount || 0);
                    if (s.billingFrequency === 'yearly') return sum + (s.subscriptionAmount || 0) / 12;
                    return sum;
                  }, 0);

                  return (
                    <div
                      key={proj.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {proj.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                            {projSales.length} {isRTL ? 'عميل نشط' : 'clients'}
                          </span>
                        </div>
                        {proj.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {proj.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(projMRR, 'EGP')}/mo
                        </div>
                        <div className="text-[10px] text-slate-400">{isRTL ? 'دخل شهري' : 'MRR'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveNav('kay-sales')}
              className="w-full py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors text-center cursor-pointer"
            >
              {isRTL ? 'عرض وإدارة جميع الاشتراكات والمبيعات' : 'Manage All Project Licenses & Subscriptions'}
            </button>
          </div>
        </div>

        {/* Recent Inflows */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-600" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  {isRTL ? 'آخر التحصيلات والاشتراكات' : 'Recent Cash Inflows'}
                </h2>
              </div>
              <button
                onClick={() => setActiveNav('kay-revenue')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 cursor-pointer"
              >
                <span>{isRTL ? 'عرض السجل' : 'Inflows'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {isRTL ? 'لا توجد دفعات محصلة بعد.' : 'No customer payments recorded yet.'}
              </div>
            ) : (
              <div className="space-y-3">
                {payments.slice(0, 5).map(pm => {
                  const cust = customers.find(c => c.id === pm.customerId);

                  return (
                    <div
                      key={pm.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {cust ? cust.name : (isRTL ? 'عميل' : 'Customer')}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono">{pm.paymentDate}</span>
                          <span>•</span>
                          <span className="uppercase text-[10px]">{pm.type}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(pm.amount, pm.currency || 'EGP')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveNav('kay-partners')}
              className="w-full py-2 rounded-xl text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50/60 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors text-center cursor-pointer"
            >
              {isRTL ? 'توزيع الأرباح على الشركاء وربطها بالحساب الشخصي' : 'Disburse Equity Shares to Personal Wallet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
