import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type {
  FinancialTransaction,
  FinancialAccount,
  CustomCategory,
} from '../../types';
import { formatCurrency } from '../../services/currencyService';
import { TransactionModal } from './TransactionModal';
import { EmptyState } from '../common/EmptyState';

export const TransactionsView: React.FC = () => {
  const { t, isRTL, activeWorkspaceId, reportingCurrency } = useApp();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [accounts, setAccounts] = useState<Record<string, FinancialAccount>>({});
  const [categories, setCategories] = useState<Record<string, CustomCategory>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<any>('expense');

  const loadData = async () => {
    let txs = await db.transactions.toArray();
    if ((activeWorkspaceId as string) !== 'all') {
      txs = txs.filter((t) => !t.workspaceId || t.workspaceId === activeWorkspaceId);
    }
    // Sort descending by date
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(txs);

    const accList = await db.accounts.toArray();
    const accMap: Record<string, FinancialAccount> = {};
    accList.forEach((a) => (accMap[a.id] = a));
    setAccounts(accMap);

    const catList = await db.categories.toArray();
    const catMap: Record<string, CustomCategory> = {};
    catList.forEach((c) => (catMap[c.id] = c));
    setCategories(catMap);
  };

  useEffect(() => {
    loadData();
  }, [activeWorkspaceId]);

  const handleDelete = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذه المعاملة؟' : 'Are you sure you want to delete this transaction?')) {
      await db.transactions.delete(id);
      loadData();
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesAccount =
      accountFilter === 'all' ||
      tx.fromAccountId === accountFilter ||
      tx.toAccountId === accountFilter;

    return matchesSearch && matchesType && matchesAccount;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.navTransactions}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? 'سجل المعاملات اليومية، المصروفات، الإيرادات والتحويلات المالية.'
              : 'Complete financial transaction journal, income, expenses, and account transfers.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setModalType('income');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addIncome}</span>
          </button>
          <button
            onClick={() => {
              setModalType('expense');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addExpense}</span>
          </button>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
          <input
            type="text"
            placeholder={isRTL ? 'بحث في المعاملات...' : 'Search transactions...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        >
          <option value="all">{isRTL ? 'كافة الأنواع' : 'All Types'}</option>
          <option value="expense">{t.navExpenses}</option>
          <option value="income">{t.navIncome}</option>
          <option value="transfer">{isRTL ? 'تحويلات' : 'Transfers'}</option>
          <option value="loan_repayment">{isRTL ? 'سداد قسط دين' : 'Debt Repayment'}</option>
          <option value="owner_distribution">{isRTL ? 'توزيعات أرباح' : 'Owner Distribution'}</option>
          <option value="customer_payment">{isRTL ? 'تحصيل عميل' : 'Customer Payment'}</option>
        </select>

        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        >
          <option value="all">{isRTL ? 'كافة الحسابات' : 'All Accounts'}</option>
          {Object.values(accounts).map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({acc.currency})
            </option>
          ))}
        </select>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={isRTL ? 'لا توجد معاملات مسجلة بعد' : 'No transactions recorded yet'}
          description={
            isRTL
              ? 'سجل أول مصروف أو إيراد لتتبع تدفقاتك المالية بدقة.'
              : 'Record your first expense or income entry to start tracking cash flow.'
          }
          primaryActionLabel={t.addExpense}
          onPrimaryAction={() => {
            setModalType('expense');
            setIsModalOpen(true);
          }}
          secondaryActionLabel={t.addIncome}
          onSecondaryAction={() => {
            setModalType('income');
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filteredTransactions.map((tx) => {
              const cat = tx.categoryId ? categories[tx.categoryId] : null;
              const fromAcc = tx.fromAccountId ? accounts[tx.fromAccountId] : null;
              const toAcc = tx.toAccountId ? accounts[tx.toAccountId] : null;

              const isExpenseType =
                tx.type === 'expense' ||
                tx.type === 'loan_repayment' ||
                tx.type === 'owner_distribution';
              const isIncomeType =
                tx.type === 'income' ||
                tx.type === 'customer_payment' ||
                tx.type === 'loan_received';

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncomeType
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : isExpenseType
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isIncomeType ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : isExpenseType ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <ArrowLeftRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {tx.description}
                      </div>

                      {/* Clean unboxed metadata */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        <span>{tx.date}</span>
                        {cat && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span style={{ color: cat.color }}>{cat.name}</span>
                          </>
                        )}
                        {tx.type === 'transfer' ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>
                              {fromAcc?.name} → {toAcc?.name}
                            </span>
                          </>
                        ) : (
                          (fromAcc || toAcc) && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{(fromAcc || toAcc)?.name}</span>
                            </>
                          )
                        )}
                        {tx.recurrence && tx.recurrence !== 'none' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">{tx.recurrence}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`font-mono font-bold text-sm ${
                          isIncomeType
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isExpenseType
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {isIncomeType ? '+' : isExpenseType ? '-' : ''}
                        {formatCurrency(tx.amount, tx.currency)}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {tx.type.replace('_', ' ')}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(tx.id)}
                      title="Delete"
                      className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors"
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

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadData}
        initialType={modalType}
      />
    </div>
  );
};
