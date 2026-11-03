import React, { useState, useEffect } from 'react';
import {
  Percent,
  Plus,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Wallet
} from 'lucide-react';
import { db } from '../../db/db';
import { Partner, PartnerDistribution, CustomerPayment, BusinessExpense, FinancialAccount } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/currencyService';
import { EmptyState } from '../common/EmptyState';

export const PartnerSharesView: React.FC = () => {
  const { t, isRTL } = useApp();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [distributions, setDistributions] = useState<PartnerDistribution[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [personalAccounts, setPersonalAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Partner Modal
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerShare, setPartnerShare] = useState<number>(50);
  const [partnerRole, setPartnerRole] = useState('');
  const [isSelf, setIsSelf] = useState(false);

  // Distribution Modal
  const [isDistModalOpen, setIsDistModalOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [distAmount, setDistAmount] = useState<number>(0);
  const [distDate, setDistDate] = useState(new Date().toISOString().split('T')[0]);
  const [distNotes, setDistNotes] = useState('');
  const [depositAccountId, setDepositAccountId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pList, dList, pmList, eList, accList] = await Promise.all([
        db.partners.toArray(),
        db.partnerDistributions.orderBy('date').reverse().toArray(),
        db.customerPayments.toArray(),
        db.businessExpenses.toArray(),
        db.accounts.toArray()
      ]);
      setPartners(pList);
      setDistributions(dList);
      setPayments(pmList);
      setExpenses(eList);
      setPersonalAccounts(accList);

      if (pList.length > 0 && !selectedPartnerId) {
        setSelectedPartnerId(pList[0].id);
      }
      if (accList.length > 0 && !depositAccountId) {
        setDepositAccountId(accList[0].id);
      }
    } catch (err) {
      console.error('Failed to load partner shares data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Profit & Loss Calculations
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netBusinessProfit = Math.max(0, totalRevenue - totalExpenses);

  const totalDistributed = distributions.reduce((sum, d) => sum + (d.amount || 0), 0);
  const retainedProfit = Math.max(0, netBusinessProfit - totalDistributed);

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim() || partnerShare <= 0) return;

    try {
      const newPartner: Partner = {
        id: crypto.randomUUID(),
        name: partnerName,
        sharePercentage: Number(partnerShare),
        role: partnerRole || undefined,
        isSelf,
        createdAt: new Date().toISOString()
      };
      await db.partners.add(newPartner);

      setIsPartnerModalOpen(false);
      setPartnerName('');
      setPartnerShare(50);
      setPartnerRole('');
      setIsSelf(false);
      await loadData();
    } catch (err) {
      console.error('Failed to add partner:', err);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا الشريك؟' : 'Delete this partner?')) {
      try {
        await db.partners.delete(id);
        await loadData();
      } catch (err) {
        console.error('Failed to delete partner:', err);
      }
    }
  };

  const handleDisburseProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId || distAmount <= 0) return;

    try {
      const partner = partners.find(p => p.id === selectedPartnerId);
      const distId = crypto.randomUUID();

      const newDist: PartnerDistribution = {
        id: distId,
        partnerId: selectedPartnerId,
        amount: Number(distAmount),
        currency: 'EGP',
        date: distDate,
        notes: distNotes || undefined,
        createdAt: new Date().toISOString()
      };
      await db.partnerDistributions.add(newDist);

      // Connected Profit Integration:
      // If the partner is marked as `isSelf` (or if it's the primary user distribution),
      // seamlessly bridge this distribution into Personal Finance income!
      if (partner?.isSelf) {
        await db.transactions.add({
          id: crypto.randomUUID(),
          workspaceId: 'personal',
          toAccountId: depositAccountId || (personalAccounts[0]?.id ?? 'default-wallet'),
          type: 'income',
          amount: Number(distAmount),
          currency: 'EGP',
          category: isRTL ? 'أرباح استثمار وشركات' : 'Business Profit',
          date: distDate,
          description: `KAY-SOFT Profit Distribution: ${partner.name} (${partner.sharePercentage || 0}%)`,
          linkedTransferId: distId,
          createdAt: new Date().toISOString()
        });
      }

      setIsDistModalOpen(false);
      setDistAmount(0);
      setDistNotes('');
      await loadData();
      alert(isRTL ? 'تم صرف وتوثيق الأرباح بنجاح!' : 'Profit distribution recorded!');
    } catch (err) {
      console.error('Failed to disburse profit:', err);
    }
  };

  const handleDeleteDistribution = async (dist: PartnerDistribution) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف عملية صرف الأرباح؟' : 'Delete this distribution record?')) {
      try {
        await db.partnerDistributions.delete(dist.id);
        // Clean linked personal transaction if present
        await db.transactions.where('linkedTransferId').equals(dist.id).delete();
        await loadData();
      } catch (err) {
        console.error('Failed to delete distribution:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Percent className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>{isRTL ? 'حصص وتوزيع أرباح الشركاء' : 'Partner Equity & Profit Distributions'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL
              ? 'توزيع صافي أرباح أنظمة KAY-SOFT على الشركاء وربط حصتك بحسابك الشخصي دون احتسابها كمصروف تشغيلي'
              : 'Calculate net software profit, allocate partner shares, and bridge your profit directly to Personal Finance'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPartnerModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRTL ? 'إضافة شريك' : 'Add Partner'}</span>
          </button>

          <button
            onClick={() => setIsDistModalOpen(true)}
            disabled={partners.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>{isRTL ? 'صرف أرباح' : 'Disburse Profit'}</span>
          </button>
        </div>
      </div>

      {/* P&L & Retained Profit Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isRTL ? 'إجمالي المحصل' : 'Collected Inflow'}</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {formatCurrency(totalRevenue, 'EGP')}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{isRTL ? 'من الاشتراكات والتركيب' : 'Total customer payments'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isRTL ? 'المصاريف التشغيلية' : 'Operating Costs'}</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            {formatCurrency(totalExpenses, 'EGP')}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{isRTL ? 'خوادم، أدوات، ومطورين' : 'Infrastructure & tools'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isRTL ? 'صافي الربح القابل للتوزيع' : 'Net Business Profit'}</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatCurrency(netBusinessProfit, 'EGP')}
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">{isRTL ? 'الإيرادات - المصاريف' : 'Revenue - Costs'}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isRTL ? 'الأرباح المتبقية / السيولة' : 'Retained Capital'}</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-sky-600 dark:text-sky-400 mt-1 tabular-nums">
            {formatCurrency(retainedProfit, 'EGP')}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{isRTL ? 'المتبقي بعد صرف الحصص' : 'After disbursements'}</p>
        </div>
      </div>

      {/* Partners List & Equity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <span>{isRTL ? 'هيكل الشركاء ونسب توزيع الملكية والأرباح' : 'Partners & Equity Allocation'}</span>
        </h2>

        {partners.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {isRTL ? 'لم يتم تسجيل شركاء بعد. اضغط "إضافة شريك" لإدخال نسب التوزيع.' : 'No partners added yet. Define partner equity shares above.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map(p => {
              const partnerDistributions = distributions.filter(d => d.partnerId === p.id);
              const partnerTotalReceived = partnerDistributions.reduce((sum, d) => sum + (d.amount || 0), 0);
              const partnerEntitledShare = (netBusinessProfit * (p.sharePercentage || p.profitSharingPercentage || 0)) / 100;

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</h3>
                          {p.isSelf && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                              {isRTL ? 'أنت (حسابك)' : 'You (Owner)'}
                            </span>
                          )}
                        </div>
                        {p.role && <p className="text-xs text-slate-500">{p.role}</p>}
                      </div>

                      <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {p.sharePercentage}%
                      </div>
                    </div>

                    <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isRTL ? 'الحصة المستحقة من الربح:' : 'Entitled Profit:'}</span>
                        <span className="font-mono font-bold">{formatCurrency(partnerEntitledShare, 'EGP')}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400">{isRTL ? 'إجمالي ما تم صرفه:' : 'Total Received:'}</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(partnerTotalReceived, 'EGP')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 flex justify-end">
                    <button
                      onClick={() => handleDeletePartner(p.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Distributions History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-600" />
          <span>{isRTL ? 'سجل صرف وتوزيعات الأرباح' : 'Disbursements Timeline'}</span>
        </h2>

        {distributions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {isRTL ? 'لم يتم تسجيل أي عمليات صرف أرباح سابقة.' : 'No profit disbursements logged yet.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {distributions.map(d => {
              const partner = partners.find(p => p.id === d.partnerId);

              return (
                <div key={d.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {partner ? partner.name : (isRTL ? 'شريك' : 'Partner')}
                      </span>
                      {partner?.isSelf && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                          {isRTL ? 'محول إلى ماليتك الشخصية' : 'Linked to Personal Wallet'}
                        </span>
                      )}
                    </div>
                    {d.notes && <p className="text-slate-500 mt-0.5">{d.notes}</p>}
                    <span className="text-[11px] font-mono text-slate-400">{d.date}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(d.amount, d.currency || 'EGP')}
                    </span>
                    <button
                      onClick={() => handleDeleteDistribution(d)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Partner Modal */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              {isRTL ? 'إضافة شريك جديد' : 'New Partner'}
            </h2>

            <form onSubmit={handleSavePartner} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'اسم الشريك *' : 'Partner Name *'}
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder={isRTL ? 'مثال: م / كريم، أو اسمك الشخصي' : 'e.g. Karim Ahmed'}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'نسبة الشراكة (%) *' : 'Share (%) *'}
                  </label>
                  <input
                    type="number"
                    value={partnerShare}
                    onChange={(e) => setPartnerShare(Number(e.target.value))}
                    min={1}
                    max={100}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'الدور أو المنصب' : 'Role'}
                  </label>
                  <input
                    type="text"
                    value={partnerRole}
                    onChange={(e) => setPartnerRole(e.target.value)}
                    placeholder={isRTL ? 'شريك مؤسس، مطور رئيسي...' : 'Co-founder, Tech Lead...'}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="selfPartnerCheck"
                  checked={isSelf}
                  onChange={(e) => setIsSelf(e.target.checked)}
                  className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="selfPartnerCheck" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                  {isRTL ? 'هذا حسابي أنا (ترحيل أرباحي تلقائياً لحسابي الشخصي)' : 'This is my share (Auto-bridge disbursements to Personal Finance)'}
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isRTL ? 'حفظ الشريك' : 'Save Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Profit Modal */}
      {isDistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              {isRTL ? 'صرف وتوزيع أرباح' : 'Disburse Partner Profit'}
            </h2>

            <form onSubmit={handleDisburseProfit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'الشريك المستلم *' : 'Partner *'}
                </label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sharePercentage}%)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'مبلغ الصرف (EGP) *' : 'Amount (EGP) *'}
                  </label>
                  <input
                    type="number"
                    value={distAmount}
                    onChange={(e) => setDistAmount(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'تاريخ الصرف *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    value={distDate}
                    onChange={(e) => setDistDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'ملاحظات' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={distNotes}
                  onChange={(e) => setDistNotes(e.target.value)}
                  placeholder={isRTL ? 'أرباح الربع الأول، أرباح مشروع...' : 'Q1 distribution...'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDistModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {isRTL ? 'تأكيد الصرف' : 'Confirm Disbursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
