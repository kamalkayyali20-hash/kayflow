import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Calendar,
  Building2,
  FolderKanban,
  Trash2,
  Search,
  CheckCircle2,
  Filter,
  CreditCard,
  Download
} from 'lucide-react';
import { db } from '../../db/db';
import { CustomerPayment, Customer, Project } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../services/currencyService';
import { EmptyState } from '../common/EmptyState';

export const RevenuePaymentsView: React.FC = () => {
  const { t, isRTL } = useApp();
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pmList, cList, pList] = await Promise.all([
        db.customerPayments.orderBy('paymentDate').reverse().toArray(),
        db.customers.toArray(),
        db.projects.toArray()
      ]);
      setPayments(pmList);
      setCustomers(cList);
      setProjects(pList);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذه الدفعة المحصلة؟' : 'Delete this revenue record?')) {
      try {
        await db.customerPayments.delete(id);
        await loadData();
      } catch (err) {
        console.error('Failed to delete payment:', err);
      }
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const filtered = payments.filter(p => {
    const cust = customers.find(c => c.id === p.customerId);
    const proj = projects.find(pr => pr.id === p.projectId);

    const matchesSearch =
      (cust && cust.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proj && proj.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (typeFilter !== 'all' && (p.type || p.paymentType) !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>{isRTL ? 'إيرادات وتحصيلات العملاء' : 'Collected Revenue & Invoices'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'سجل التدفقات النقدية الداخلة من الاشتراكات ورسوم التأسيس لـ KAY-SOFT' : 'Actual cash inflows from software subscriptions, setup fees, and custom development'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">{isRTL ? 'إجمالي المحصل:' : 'Total Collected:'}</span>
          <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalCollected, 'EGP')}
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'subscription', 'setup_fee', 'custom_dev'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setTypeFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                typeFilter === tab
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'all' && (isRTL ? 'الكل' : 'All Inflows')}
              {tab === 'subscription' && (isRTL ? 'اشتراكات' : 'Subscriptions')}
              {tab === 'setup_fee' && (isRTL ? 'رسوم تأسيس' : 'Setup Fees')}
              {tab === 'custom_dev' && (isRTL ? 'تطوير خاص' : 'Custom Dev')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRTL ? 'بحث بالعميل، النظام...' : 'Search payments...'}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={isRTL ? 'لا توجد دفعات محصلة' : 'No Payments Recorded'}
          description={isRTL ? 'قم بتسجيل دفعات العملاء من صفحة مبيعات المشاريع.' : 'Record payments when customers pay setup fees or renew subscriptions.'}
          icon={DollarSign}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(p => {
              const cust = customers.find(c => c.id === p.customerId);
              const proj = projects.find(pr => pr.id === p.projectId);

              return (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {cust ? cust.name : (isRTL ? 'عميل' : 'Customer')}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {p.type || p.paymentType}
                        </span>
                        {p.paymentMethod && (
                          <span className="text-[10px] text-slate-400">
                            • {p.paymentMethod}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {proj && <span className="font-medium text-emerald-600 dark:text-emerald-400">{proj.name}</span>}
                        {p.notes && <span>• {p.notes}</span>}
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        {p.paymentDate || p.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +{formatCurrency(p.amount, p.currency || 'EGP')}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(p.id)}
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
    </div>
  );
};
