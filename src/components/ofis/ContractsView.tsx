import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  Building2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { db } from '../../db/db';
import { Contract, Company } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/currencyService';
import { EmptyState } from '../common/EmptyState';

export const ContractsView: React.FC = () => {
  const { t, isRTL } = useApp();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [companyId, setCompanyId] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [title, setTitle] = useState('');
  const [contractValue, setContractValue] = useState<number>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'semi_annually' | 'annually' | 'one_time'>('annually');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      const [ctList, cList] = await Promise.all([
        db.contracts.toArray(),
        db.companies.toArray()
      ]);
      setContracts(ctList);
      setCompanies(cList);
      if (cList.length > 0 && !companyId) {
        setCompanyId(cList[0].id);
      }
    } catch (err) {
      console.error('Failed to load contracts:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا العقد؟' : 'Delete this contract?')) {
      try {
        await db.contracts.delete(id);
        await loadData();
      } catch (err) {
        console.error('Failed to delete contract:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !title) return;

    try {
      const newContract: Contract = {
        id: crypto.randomUUID(),
        companyId,
        contractNumber: contractNumber || `CTR-${Date.now().toString().slice(-6)}`,
        title,
        contractValue: Number(contractValue) || 0,
        billingCycle,
        currency: 'EGP',
        startDate,
        endDate: endDate || undefined,
        status: 'active',
        notes: notes || undefined,
        createdAt: new Date().toISOString()
      };
      await db.contracts.add(newContract);

      setIsModalOpen(false);
      setTitle('');
      setContractValue(0);
      setNotes('');
      await loadData();
    } catch (err) {
      console.error('Failed to add contract:', err);
    }
  };

  const filtered = contracts.filter(c => {
    const comp = companies.find(cp => cp.id === c.companyId);
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contractNumber && c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (comp && comp.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <span>{isRTL ? 'إدارة العقود والاشتراكات' : 'Contracts & SLA Agreements'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'إدارة عقود الصيانة، التراخيص السنوية، وقيم الاشتراكات مع الشركات' : 'Manage maintenance SLAs, annual renewals, and subscription terms'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRTL ? 'إضافة عقد جديد' : 'New Contract'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['active', 'pending', 'expired', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'active' && (isRTL ? 'النشطة' : 'Active')}
              {tab === 'pending' && (isRTL ? 'قيد المراجعة' : 'Pending')}
              {tab === 'expired' && (isRTL ? 'المنتهية' : 'Expired')}
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
            placeholder={isRTL ? 'بحث برقم أو اسم العقد أو الشركة...' : 'Search contracts...'}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={isRTL ? 'لا توجد عقود مسجلة' : 'No Contracts Found'}
          description={isRTL ? 'سجّل عقود الصيانة والاتفاقيات التجارية مع عملائك.' : 'Register and track client maintenance agreements and licenses.'}
          icon={FileText}
          actionLabel={isRTL ? 'إضافة عقد' : 'Add Contract'}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const comp = companies.find(cp => cp.id === c.companyId);

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                      {c.contractNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                      {c.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {c.title}
                  </h3>

                  {comp && (
                    <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 mt-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {comp.name}
                    </p>
                  )}

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isRTL ? 'قيمة العقد / الدورية:' : 'Contract Value / Cycle:'}
                    </div>
                    <div className="text-base font-black text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
                      {formatCurrency(c.contractValue, c.currency || 'EGP')}
                      <span className="text-xs font-normal text-slate-500 ml-1.5">
                        / {c.billingCycle}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{isRTL ? 'البداية:' : 'Start:'} {c.startDate}</span>
                    {c.endDate && <span>{isRTL ? 'النهاية:' : 'End:'} {c.endDate}</span>}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleDelete(c.id)}
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
              {isRTL ? 'تسجيل عقد جديد' : 'New Contract'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'الشركة الطرف الثاني *' : 'Company *'}
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
                  {isRTL ? 'مسمى أو نوع العقد *' : 'Contract Title *'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isRTL ? 'عقد صيانة ودعم فني سنوي، ترخيص سحابي...' : 'Annual maintenance SLA, Cloud subscription...'}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'القيمة المالية (EGP)' : 'Value (EGP)'}
                  </label>
                  <input
                    type="number"
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    min={0}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'دورية الدفع' : 'Billing Cycle'}
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="annually">{isRTL ? 'سنوي' : 'Annually'}</option>
                    <option value="semi_annually">{isRTL ? 'نصف سنوي' : 'Semi-Annually'}</option>
                    <option value="quarterly">{isRTL ? 'ربع سنوي' : 'Quarterly'}</option>
                    <option value="monthly">{isRTL ? 'شهري' : 'Monthly'}</option>
                    <option value="one_time">{isRTL ? 'دفعة واحدة' : 'One-time'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'تاريخ البداية *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'تاريخ الانتهاء' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
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
                  {isRTL ? 'حفظ العقد' : 'Save Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
