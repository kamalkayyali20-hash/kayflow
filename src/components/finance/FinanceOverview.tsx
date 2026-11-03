import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  ArrowRight,
  Plus,
  AlertCircle,
  Calendar,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculatePersonalFinancialOverview,
  type FinancialOverviewMetrics,
} from '../../services/accountingEngine';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../../services/currencyService';
import { EmptyState } from '../common/EmptyState';
import { TransactionModal } from './TransactionModal';

export const FinanceOverview: React.FC = () => {
  const {
    t,
    isRTL,
    reportingCurrency,
    setReportingCurrency,
    currentMonth,
    setCurrentMonth,
    setActiveNav,
    openQuickAdd,
  } = useApp();

  const [metrics, setMetrics] = useState<FinancialOverviewMetrics | null>(null);
  const [basis, setBasis] = useState<'cash' | 'accrual'>('cash');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  const loadMetrics = async () => {
    const data = await calculatePersonalFinancialOverview(currentMonth, reportingCurrency, basis);
    setMetrics(data);
  };

  useEffect(() => {
    loadMetrics();
  }, [currentMonth, reportingCurrency, basis]);

  if (!metrics) return null;

  const isCompletelyEmpty =
    metrics.monthlyIncome === 0 &&
    metrics.monthlyExpenses === 0 &&
    metrics.totalCashAvailable === 0 &&
    metrics.totalDebtLiability === 0;

  return (
    <div className="space-y-6">
      {/* Top Controls Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.financialOverview}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? 'المركز المالي الشامل، السيولة النقدية، صافي الثروة، وفائض التدفق النقدي الشهري.'
              : 'Consolidated personal financial health, liquidity, net worth, and monthly surplus.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="bg-transparent border-none text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden"
            />
          </div>

          {/* Basis Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setBasis('cash')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                basis === 'cash'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {t.cashBasis}
            </button>
            <button
              onClick={() => setBasis('accrual')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                basis === 'accrual'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {t.accrualBasis}
            </button>
          </div>

          {/* Reporting Currency Picker */}
          <select
            value={reportingCurrency}
            onChange={(e) => setReportingCurrency(e.target.value)}
            className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Multi-currency warning if present */}
      {metrics.hasMultiCurrencyWarnings && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            {isRTL
              ? 'توجد معاملات بعملات متعددة بدون سعر تحويل مسجل. تم استبعادها أو عرضها بعملتها الأصلية لمنع الخلط.'
              : 'Some transactions have currencies without an explicit exchange rate conversion defined.'}
          </span>
        </div>
      )}

      {/* Accounting Note Pill */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="leading-relaxed">{t.accountingNote}</span>
      </div>

      {isCompletelyEmpty ? (
        <EmptyState
          icon={Wallet}
          title={t.emptyJourneyTitle}
          description={t.emptyJourneyDesc}
          primaryActionLabel={t.addAccount}
          onPrimaryAction={() => setActiveNav('finance-accounts')}
          secondaryActionLabel={t.addExpense}
          onSecondaryAction={() => setIsTxModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Main KPI Strip (Financial Position) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Available Cash */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {t.cashAvailable}
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {formatCurrency(metrics.totalCashAvailable, metrics.currency)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                {isRTL ? 'السيولة بالحسابات والمحافظ' : 'Personal accounts liquidity'}
              </span>
            </div>

            {/* Monthly Surplus */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {t.monthlyCashSurplus}
              </span>
              <span
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  metrics.monthlyCashSurplus >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {metrics.monthlyCashSurplus >= 0 ? '+' : ''}
                {formatCurrency(metrics.monthlyCashSurplus, metrics.currency)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                {t.savingsRate}:{' '}
                {metrics.savingsRate !== null ? `${metrics.savingsRate}%` : 'N/A'}
              </span>
            </div>

            {/* Total Debt Liability */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {t.totalDebt}
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {formatCurrency(metrics.totalDebtLiability, metrics.currency)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                {isRTL ? 'أصل الالتزامات القائمة' : 'Principal debt liabilities'}
              </span>
            </div>

            {/* Net Worth */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {t.netWorth}
              </span>
              <span
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  metrics.netWorth >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {formatCurrency(metrics.netWorth, metrics.currency)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                {isRTL ? 'الأصول − الالتزامات' : 'Total Assets − Total Liabilities'}
              </span>
            </div>
          </div>

          {/* Monthly Inflow & Outflow Detail Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Income Panel */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t.monthlyIncome}
                    </h3>
                    <span className="text-[11px] text-slate-400">{currentMonth}</span>
                  </div>
                </div>

                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(metrics.monthlyIncome, metrics.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{isRTL ? 'المتحصلات النقدية المسجلة' : 'Recorded Cash Inflows'}</span>
                <button
                  onClick={() => setActiveNav('finance-transactions')}
                  className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>{t.viewAll}</span>
                  <ArrowRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Expense Panel */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t.monthlyExpenses}
                    </h3>
                    <span className="text-[11px] text-slate-400">{currentMonth}</span>
                  </div>
                </div>

                <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                  -{formatCurrency(metrics.monthlyExpenses, metrics.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{isRTL ? 'المصروفات التشغيلية والفوائد' : 'Operating Outflows & Interest'}</span>
                <button
                  onClick={() => setActiveNav('finance-transactions')}
                  className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>{t.viewAll}</span>
                  <ArrowRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSaved={loadMetrics}
      />
    </div>
  );
};
