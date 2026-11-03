import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Plus,
  DollarSign,
  FolderKanban,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  Search,
  Filter,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import { db } from '../../db/db';
import { ProjectSale, Project, Customer, CustomerPayment } from '../../types';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';

export const ProjectSalesView: React.FC = () => {
  const { t, isRTL, formatCurrency } = useApp();
  const [sales, setSales] = useState<ProjectSale[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sale Modal
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<ProjectSale | undefined>(undefined);
  const [projectId, setProjectId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [setupFee, setSetupFee] = useState<number>(0);
  const [subscriptionAmount, setSubscriptionAmount] = useState<number>(0);
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'yearly' | 'one_time'>('monthly');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [renewalDate, setRenewalDate] = useState('');
  const [status, setStatus] = useState<'active' | 'paused' | 'cancelled'>('active');
  const [customTerms, setCustomTerms] = useState('');

  // Payment Recording Modal
  const [paymentSale, setPaymentSale] = useState<ProjectSale | null>(null);
  const [paymentType, setPaymentType] = useState<'setup_fee' | 'subscription' | 'custom_dev'>('subscription');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'instapay' | 'vodafone_cash' | 'check'>('bank_transfer');
  const [paymentNotes, setPaymentNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sList, pList, cList] = await Promise.all([
        db.projectSales.toArray(),
        db.projects.toArray(),
        db.customers.toArray()
      ]);
      setSales(sList);
      setProjects(pList);
      setCustomers(cList);

      if (pList.length > 0 && !projectId) setProjectId(pList[0].id);
      if (cList.length > 0 && !customerId) setCustomerId(cList[0].id);
    } catch (err) {
      console.error('Failed to load project sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingSale(undefined);
    setSetupFee(0);
    setSubscriptionAmount(0);
    setBillingFrequency('monthly');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setRenewalDate('');
    setStatus('active');
    setCustomTerms('');
    setIsSaleModalOpen(true);
  };

  const handleOpenEdit = (s: ProjectSale) => {
    setEditingSale(s);
    setProjectId(s.projectId);
    setCustomerId(s.customerId);
    setSetupFee(s.setupFee || 0);
    setSubscriptionAmount(s.subscriptionAmount || 0);
    setBillingFrequency(s.billingFrequency);
    setSaleDate(s.saleDate);
    setRenewalDate(s.renewalDate || '');
    setStatus(s.status);
    setCustomTerms(s.customTerms || '');
    setIsSaleModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا التعاقد؟' : 'Delete this project sale agreement?')) {
      try {
        await db.projectSales.delete(id);
        await loadData();
      } catch (err) {
        console.error('Failed to delete sale:', err);
      }
    }
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !customerId) return;

    try {
      const now = new Date().toISOString();
      if (editingSale) {
        await db.projectSales.update(editingSale.id, {
          projectId,
          customerId,
          setupFee: Number(setupFee) || 0,
          subscriptionAmount: Number(subscriptionAmount) || 0,
          billingFrequency,
          saleDate,
          renewalDate: renewalDate || undefined,
          status,
          customTerms: customTerms || undefined,
          updatedAt: now
        });
      } else {
        const newSale: ProjectSale = {
          id: crypto.randomUUID(),
          projectId,
          customerId,
          setupFee: Number(setupFee) || 0,
          subscriptionAmount: Number(subscriptionAmount) || 0,
          billingFrequency,
          saleDate,
          renewalDate: renewalDate || undefined,
          status,
          currency: 'EGP',
          customTerms: customTerms || undefined,
          createdAt: now
        };
        await db.projectSales.add(newSale);
      }

      setIsSaleModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to save project sale:', err);
    }
  };

  const handleOpenPayment = (s: ProjectSale) => {
    setPaymentSale(s);
    setPaymentAmount(s.subscriptionAmount || s.setupFee || 0);
    setPaymentType(s.setupFee && !s.subscriptionAmount ? 'setup_fee' : 'subscription');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSale || paymentAmount <= 0) return;

    try {
      const newPayment: CustomerPayment = {
        id: crypto.randomUUID(),
        projectSaleId: paymentSale.id,
        customerId: paymentSale.customerId,
        projectId: paymentSale.projectId,
        amount: Number(paymentAmount),
        currency: 'EGP',
        type: paymentType,
        paymentDate,
        paymentMethod,
        notes: paymentNotes || undefined,
        createdAt: new Date().toISOString()
      };
      await db.customerPayments.add(newPayment);

      setPaymentSale(null);
      alert(isRTL ? 'تم تسجيل الدفعة بنجاح!' : 'Payment recorded successfully!');
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  };

  // Calculations
  const activeSales = sales.filter(s => s.status === 'active');
  
  // Normalized Monthly Recurring Revenue (MRR)
  const totalMRR = activeSales.reduce((sum, s) => {
    if (s.billingFrequency === 'monthly') return sum + (s.subscriptionAmount || 0);
    if (s.billingFrequency === 'yearly') return sum + (s.subscriptionAmount || 0) / 12;
    return sum;
  }, 0);

  const totalSetupFees = sales.reduce((sum, s) => sum + (s.setupFee || 0), 0);

  // Filtered sales list
  const filtered = sales.filter(s => {
    const proj = projects.find(p => p.id === s.projectId);
    const cust = customers.find(c => c.id === s.customerId);

    const matchesSearch =
      (proj && proj.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cust && cust.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedProjectId !== 'all' && s.projectId !== selectedProjectId) return false;
    if (selectedCustomerId !== 'all' && s.customerId !== selectedCustomerId) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Repeat className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>{isRTL ? 'مبيعات واشتراكات المشاريع' : 'Project Sales & Subscriptions'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL
              ? 'بيع النظام البرمجي الواحد لعدة عملاء بتسعير مخصص، رسوم تأسيس، واشتراكات دورية (MRR)'
              : 'Deploy a single software codebase to multiple companies with custom pricing & recurring MRR'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          disabled={projects.length === 0 || customers.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRTL ? 'إتمام بيع / اشتراك جديد' : 'New Project Sale'}</span>
        </button>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">{isRTL ? 'الدخل الشهري المتكرر (MRR)' : 'Monthly Recurring (MRR)'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {formatCurrency(totalMRR, 'EGP')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isRTL ? 'محسوب من جميع الاشتراكات الشهرية والسنوية الفعالة' : 'Normalized from active monthly & yearly subscriptions'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">{isRTL ? 'الاشتراكات النشطة' : 'Active Subscriptions'}</span>
            <Repeat className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {activeSales.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isRTL ? `من أصل ${sales.length} تعاقد كلي` : `Across ${customers.length} business clients`}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">{isRTL ? 'إجمالي رسوم التأسيس' : 'Total Setup Fees'}</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
            {formatCurrency(totalSetupFees, 'EGP')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isRTL ? 'رسوم التركيب والتهيئة لمرة واحدة' : 'One-time onboarding & deployment revenue'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Project Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">{isRTL ? 'جميع الأنظمة البرمجية' : 'All Software Projects'}</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">{isRTL ? 'جميع العملاء' : 'All Customers'}</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-36">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">{isRTL ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="active">{isRTL ? 'نشط' : 'Active'}</option>
              <option value="paused">{isRTL ? 'موقوف' : 'Paused'}</option>
              <option value="cancelled">{isRTL ? 'ملغي' : 'Cancelled'}</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRTL ? 'بحث باسم المشروع أو العميل...' : 'Search sales...'}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={isRTL ? 'لا توجد مبيعات أو اشتراكات مسجلة' : 'No Project Sales Found'}
          description={
            projects.length === 0 || customers.length === 0
              ? (isRTL ? 'يرجى التأكد من تسجيل المشاريع والعملاء أولاً للبدء بربط المبيعات.' : 'Make sure you have created at least one project and one customer first.')
              : (isRTL ? 'سجّل أول بيع لنظامك البرمجي مع تحديد رسوم التأسيس وقيمة الاشتراك.' : 'Record your first software sale with custom setup fees and recurring subscriptions.')
          }
          icon={Repeat}
          actionLabel={isRTL ? 'تسجيل بيع جديد' : 'New Sale'}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => {
            const proj = projects.find(p => p.id === s.projectId);
            const cust = customers.find(c => c.id === s.customerId);

            // Normalized monthly contribution
            let monthlyContribution = 0;
            if (s.billingFrequency === 'monthly') monthlyContribution = s.subscriptionAmount || 0;
            if (s.billingFrequency === 'yearly') monthlyContribution = (s.subscriptionAmount || 0) / 12;

            return (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5" />
                        {proj ? proj.name : (isRTL ? 'مشروع غير محدد' : 'Unknown Project')}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-0.5">
                        {cust ? cust.name : (isRTL ? 'عميل غير محدد' : 'Unknown Customer')}
                      </h3>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.status === 'active'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        : s.status === 'paused'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                    }`}>
                      {s.status}
                    </span>
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{isRTL ? 'رسوم التأسيس (Setup):' : 'Setup Fee:'}</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {formatCurrency(s.setupFee || 0, 'EGP')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-slate-500 dark:text-slate-400">{isRTL ? 'الاشتراك الدوري:' : 'Subscription:'}</span>
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(s.subscriptionAmount || 0, 'EGP')}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">/ {s.billingFrequency}</span>
                      </span>
                    </div>

                    {s.status === 'active' && monthlyContribution > 0 && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px]">
                        <span className="text-slate-400">{isRTL ? 'المساهمة في MRR:' : 'MRR Share:'}</span>
                        <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                          +{formatCurrency(monthlyContribution, 'EGP')}/mo
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{isRTL ? 'تاريخ البيع:' : 'Sold:'} {s.saleDate}</span>
                    {s.renewalDate && (
                      <span className="text-amber-600 dark:text-amber-400">
                        {isRTL ? 'التجديد:' : 'Renew:'} {s.renewalDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenPayment(s)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'تسجيل دفعة' : 'Log Payment'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sale Add/Edit Modal */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              {editingSale ? (isRTL ? 'تعديل بيانات البيع والاشتراك' : 'Edit Sale Agreement') : (isRTL ? 'تسجيل بيع نظام برمجي جديد' : 'New Project Sale')}
            </h2>

            <form onSubmit={handleSaveSale} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'النظام البرمجي المطلوب بيعه *' : 'Software Project *'}
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'العميل المشتري *' : 'Customer *'}
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'رسوم التأسيس (Setup Fee)' : 'Setup Fee (EGP)'}
                  </label>
                  <input
                    type="number"
                    value={setupFee}
                    onChange={(e) => setSetupFee(Number(e.target.value))}
                    min={0}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'الاشتراك الدوري (Subscription)' : 'Subscription Amount'}
                  </label>
                  <input
                    type="number"
                    value={subscriptionAmount}
                    onChange={(e) => setSubscriptionAmount(Number(e.target.value))}
                    min={0}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'دورية الاشتراك' : 'Billing Frequency'}
                  </label>
                  <select
                    value={billingFrequency}
                    onChange={(e) => setBillingFrequency(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="monthly">{isRTL ? 'شهري (Monthly)' : 'Monthly'}</option>
                    <option value="yearly">{isRTL ? 'سنوي (Yearly)' : 'Yearly'}</option>
                    <option value="one_time">{isRTL ? 'دفعة واحدة (لا اشتراك)' : 'One-time'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'حالة التعاقد' : 'Status'}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="active">{isRTL ? 'نشط (Active)' : 'Active'}</option>
                    <option value="paused">{isRTL ? 'موقوف مؤقتاً' : 'Paused'}</option>
                    <option value="cancelled">{isRTL ? 'ملغي' : 'Cancelled'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'تاريخ البيع *' : 'Sale Date *'}
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'تاريخ التجديد القادم' : 'Next Renewal Date'}
                  </label>
                  <input
                    type="date"
                    value={renewalDate}
                    onChange={(e) => setRenewalDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isRTL ? 'حفظ التعاقد' : 'Save Agreement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Recording Modal */}
      {paymentSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>{isRTL ? 'تسجيل دفعة إيراد من العميل' : 'Record Customer Payment'}</span>
            </h2>

            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'نوع الدفعة المحصلة' : 'Payment Type'}
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="subscription">{isRTL ? 'اشتراك دوري (تجديد شهري/سنوي)' : 'Subscription Renewal'}</option>
                  <option value="setup_fee">{isRTL ? 'رسوم تأسيس وتركيب' : 'Setup Fee'}</option>
                  <option value="custom_dev">{isRTL ? 'تطوير ميزة مخصصة' : 'Custom Development'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'المبلغ المحصل (EGP) *' : 'Amount (EGP) *'}
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'طريقة التحصيل' : 'Payment Method'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="bank_transfer">{isRTL ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                    <option value="instapay">InstaPay</option>
                    <option value="vodafone_cash">Vodafone Cash</option>
                    <option value="cash">{isRTL ? 'نقدي (كاش)' : 'Cash'}</option>
                    <option value="check">{isRTL ? 'شيك بنكي' : 'Check'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'تاريخ التحصيل *' : 'Payment Date *'}
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'ملاحظات أو رقم الإيصال / الحوالة' : 'Reference / Notes'}
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={isRTL ? 'رقم التحويل البنكي، إشعار سداد...' : 'Transfer ref #, invoice notes...'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentSale(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isRTL ? 'تأكيد وحفظ الدفعة' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
