import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  PieChart,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type { FinancialTransaction, Project, Debt, CustomCategory } from '../../types';
import { formatCurrency, SUPPORTED_CURRENCIES, convertCurrency } from '../../services/currencyService';
import { calculateProjectFinancials } from '../../services/accountingEngine';
import { EmptyState } from '../common/EmptyState';

const CHART_COLORS = [
  '#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED',
  '#0891B2', '#EC4899', '#F97316', '#6366F1', '#14B8A6',
];

export const AnalyticsView: React.FC = () => {
  const { t, isRTL, reportingCurrency, setReportingCurrency, activeWorkspaceId } = useApp();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [categories, setCategories] = useState<Record<string, CustomCategory>>({});

  // Chart datasets
  const [monthlyBarData, setMonthlyBarData] = useState<any[]>([]);
  const [expensePieData, setExpensePieData] = useState<any[]>([]);
  const [projectProfitData, setProjectProfitData] = useState<any[]>([]);

  const loadData = async () => {
    const txs = await db.transactions.toArray();
    setTransactions(txs);

    const projs = await db.projects.toArray();
    setProjects(projs);

    const dList = await db.debts.toArray();
    setDebts(dList);

    const cats = await db.categories.toArray();
    const catMap: Record<string, CustomCategory> = {};
    cats.forEach((c) => (catMap[c.id] = c));
    setCategories(catMap);

    // 1. Calculate Monthly Inflow vs Outflow
    const monthlyMap: Record<string, { month: string; income: number; expense: number }> = {};
    for (const tx of txs) {
      const month = tx.date.substring(0, 7);
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, income: 0, expense: 0 };
      }

      let amount = tx.amount;
      if (tx.currency !== reportingCurrency) {
        const conv = await convertCurrency(tx.amount, tx.currency, reportingCurrency);
        if (conv) amount = conv.convertedAmount;
      }

      if (tx.type === 'income' || tx.type === 'customer_payment') {
        monthlyMap[month].income += amount;
      } else if (tx.type === 'expense' || tx.type === 'loan_repayment') {
        monthlyMap[month].expense += amount;
      }
    }

    const sortedMonthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
    setMonthlyBarData(sortedMonthly);

    // 2. Category Expense Breakdown
    const catExpenseMap: Record<string, number> = {};
    for (const tx of txs.filter((t) => t.type === 'expense')) {
      let amount = tx.amount;
      if (tx.currency !== reportingCurrency) {
        const conv = await convertCurrency(tx.amount, tx.currency, reportingCurrency);
        if (conv) amount = conv.convertedAmount;
      }
      const catName = tx.categoryId && catMap[tx.categoryId] ? catMap[tx.categoryId].name : 'Uncategorized';
      catExpenseMap[catName] = (catExpenseMap[catName] || 0) + amount;
    }

    const pieList = Object.entries(catExpenseMap).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));
    setExpensePieData(pieList);

    // 3. Project Profitability
    const projList: any[] = [];
    for (const p of projs) {
      const fin = await calculateProjectFinancials(p.id);
      if (fin) {
        let profit = fin.netProjectProfit;
        let revenue = fin.recognizedRevenue;
        if (p.currency !== reportingCurrency) {
          const convP = await convertCurrency(profit, p.currency, reportingCurrency);
          const convR = await convertCurrency(revenue, p.currency, reportingCurrency);
          if (convP) profit = convP.convertedAmount;
          if (convR) revenue = convR.convertedAmount;
        }
        projList.push({
          name: p.name,
          revenue,
          profit,
          client: p.client,
        });
      }
    }
    setProjectProfitData(projList);
  };

  useEffect(() => {
    loadData();
  }, [reportingCurrency, activeWorkspaceId]);

  const hasData = transactions.length > 0 || projects.length > 0;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.navReports}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? 'تحليلات تفصيلية للتدفقات النقدية وهوامش أرباح المشاريع وتوزيع المصروفات.'
              : 'Interactive financial intelligence, cash flow trends, and project profitability analysis.'}
          </p>
        </div>

        {/* Currency Switcher for Reporting */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t.reportingCurrency}:
          </span>
          <select
            value={reportingCurrency}
            onChange={(e) => setReportingCurrency(e.target.value)}
            className="text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({isRTL ? c.nameAr : c.nameEn})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon={PieChart}
          title={isRTL ? 'لا توجد بيانات كافية للرسوم البيانية' : 'No financial data recorded yet'}
          description={
            isRTL
              ? 'سجل معاملاتك المالية ومشاريعك لعرض المخططات والتحليلات التلقائية بدقة.'
              : 'Add financial transactions or software projects to generate real analytical charts.'
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Monthly Income vs Outflows */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              {isRTL ? 'مقارنة الدخل الشهري والمصروفات' : 'Monthly Inflow vs Outflow'} ({reportingCurrency})
            </h3>
            {monthlyBarData.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">No monthly transactions recorded</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBarData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val), reportingCurrency)}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="income" name={t.navIncome} fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name={t.navExpenses} fill="#DC2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Expense Breakdown */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
                {isRTL ? 'توزيع المصروفات حسب التصنيف' : 'Expense Breakdown by Category'}
              </h3>
              {expensePieData.length === 0 ? (
                <p className="text-xs text-slate-400 py-10 text-center">No expense categories to display</p>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={expensePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => formatCurrency(Number(val), reportingCurrency)}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Project Profitability */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
                {isRTL ? 'ربحية المشاريع (KAY-SOFT)' : 'Project Profitability'} ({reportingCurrency})
              </h3>
              {projectProfitData.length === 0 ? (
                <p className="text-xs text-slate-400 py-10 text-center">No projects to display</p>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectProfitData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val: any) => formatCurrency(Number(val), reportingCurrency)}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="revenue" name={t.recognizedRevenue} fill="#2563EB" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="profit" name={t.netProjectProfit} fill="#059669" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
