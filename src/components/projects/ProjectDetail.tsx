import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type {
  Project,
  ProjectRevenue,
  ProjectExpense,
  ProjectParticipant,
  OwnerDistribution,
  FinancialAccount,
  CustomCategory,
} from '../../types';
import {
  calculateProjectFinancials,
  type ProjectFinancialSummary,
} from '../../services/accountingEngine';
import { formatCurrency } from '../../services/currencyService';
import { Modal } from '../common/Modal';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack }) => {
  const { t, isRTL } = useApp();
  const [project, setProject] = useState<Project | null>(null);
  const [financials, setFinancials] = useState<ProjectFinancialSummary | null>(null);
  const [revenues, setRevenues] = useState<ProjectRevenue[]>([]);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
  const [distributions, setDistributions] = useState<OwnerDistribution[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CustomCategory[]>([]);

  const [activeTab, setActiveTab] = useState<'financials' | 'profit_sharing' | 'details'>('financials');

  // Modals
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);

  // Revenue Form
  const [revAmount, setRevAmount] = useState<number>(0);
  const [revType, setRevType] = useState<any>('installment');
  const [revDesc, setRevDesc] = useState('');
  const [revIsReceived, setRevIsReceived] = useState(true);
  const [revAccountId, setRevAccountId] = useState('');

  // Expense Form
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expCategory, setExpCategory] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expIsPaid, setExpIsPaid] = useState(true);
  const [expAccountId, setExpAccountId] = useState('');

  // Participant Form
  const [partName, setPartName] = useState('');
  const [partRole, setPartRole] = useState('Partner / Lead Dev');
  const [partPercent, setPartPercent] = useState<number>(50);

  // Distribution Form
  const [distParticipantId, setDistParticipantId] = useState('');
  const [distAmount, setDistAmount] = useState<number>(0);
  const [distAccountId, setDistAccountId] = useState('');

  const loadData = async () => {
    const proj = await db.projects.get(projectId);
    if (!proj) return;
    setProject(proj);

    const fin = await calculateProjectFinancials(projectId);
    setFinancials(fin);

    const revs = await db.projectRevenues.where('projectId').equals(projectId).toArray();
    setRevenues(revs);

    const exps = await db.projectExpenses.where('projectId').equals(projectId).toArray();
    setExpenses(exps);

    const parts = await db.projectParticipants.where('projectId').equals(projectId).toArray();
    setParticipants(parts);

    const dists = await db.ownerDistributions.where('projectId').equals(projectId).toArray();
    setDistributions(dists);

    const accs = await db.accounts.toArray();
    setAccounts(accs);

    const cats = await db.categories.where('type').equals('expense').toArray();
    setExpenseCategories(cats);
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  if (!project || !financials) return null;

  // Add Revenue Handler
  const handleAddRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (revAmount <= 0) return;

    const today = new Date().toISOString().split('T')[0];
    const newRev: ProjectRevenue = {
      id: `prev-${Date.now()}`,
      projectId,
      date: today,
      amount: Number(revAmount),
      currency: project.currency,
      revenueType: revType,
      description: revDesc.trim() || 'Project Revenue Milestone',
      isReceived: revIsReceived,
      receivedAccountId: revIsReceived ? revAccountId || undefined : undefined,
      receivedDate: revIsReceived ? today : undefined,
      createdAt: new Date().toISOString(),
    };

    await db.transaction('rw', [db.projectRevenues, db.transactions], async () => {
      await db.projectRevenues.add(newRev);

      // If marked received and account selected, post to transaction ledger as customer payment!
      if (revIsReceived && revAccountId) {
        await db.transactions.add({
          id: `tx-rev-${newRev.id}`,
          date: today,
          amount: Number(revAmount),
          currency: project.currency,
          type: 'customer_payment',
          toAccountId: revAccountId,
          relatedProjectId: projectId,
          workspaceId: project.workspaceId,
          description: `Revenue: ${project.name} (${newRev.description})`,
          createdAt: new Date().toISOString(),
        });
      }
    });

    setIsRevenueModalOpen(false);
    setRevAmount(0);
    setRevDesc('');
    loadData();
  };

  // Add Expense Handler
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) return;

    const today = new Date().toISOString().split('T')[0];
    const newExp: ProjectExpense = {
      id: `pexp-${Date.now()}`,
      projectId,
      date: today,
      amount: Number(expAmount),
      currency: project.currency,
      categoryId: expCategory || undefined,
      description: expDesc.trim() || 'Project Expense',
      isPaid: expIsPaid,
      paymentAccountId: expIsPaid ? expAccountId || undefined : undefined,
      paidDate: expIsPaid ? today : undefined,
      createdAt: new Date().toISOString(),
    };

    await db.transaction('rw', [db.projectExpenses, db.transactions], async () => {
      await db.projectExpenses.add(newExp);

      // If marked as paid from an account, post ledger entry
      if (expIsPaid && expAccountId) {
        await db.transactions.add({
          id: `tx-exp-${newExp.id}`,
          date: today,
          amount: Number(expAmount),
          currency: project.currency,
          type: 'expense',
          fromAccountId: expAccountId,
          relatedProjectId: projectId,
          workspaceId: project.workspaceId,
          categoryId: expCategory || undefined,
          description: `Project Expense: ${project.name} (${newExp.description})`,
          createdAt: new Date().toISOString(),
        });
      }
    });

    setIsExpenseModalOpen(false);
    setExpAmount(0);
    setExpDesc('');
    loadData();
  };

  // Add Participant
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) return;

    const newPart: ProjectParticipant = {
      id: `part-${Date.now()}`,
      projectId,
      name: partName.trim(),
      role: partRole.trim(),
      profitSharePercentage: Number(partPercent) || 0,
      createdAt: new Date().toISOString(),
    };

    await db.projectParticipants.add(newPart);
    setIsParticipantModalOpen(false);
    setPartName('');
    loadData();
  };

  // Add Distribution
  const handleAddDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (distAmount <= 0 || !distParticipantId) return;

    const part = participants.find((p) => p.id === distParticipantId);
    if (!part) return;

    const today = new Date().toISOString().split('T')[0];
    const newDist: OwnerDistribution = {
      id: `dist-${Date.now()}`,
      projectId,
      participantId: distParticipantId,
      participantName: part.name,
      date: today,
      amount: Number(distAmount),
      currency: project.currency,
      paymentAccountId: distAccountId || undefined,
      workspaceId: project.workspaceId,
      createdAt: new Date().toISOString(),
    };

    await db.transaction('rw', [db.ownerDistributions, db.transactions], async () => {
      await db.ownerDistributions.add(newDist);

      // If paid from business account, record owner distribution transaction
      if (distAccountId) {
        await db.transactions.add({
          id: `tx-dist-${newDist.id}`,
          date: today,
          amount: Number(distAmount),
          currency: project.currency,
          type: 'owner_distribution',
          fromAccountId: distAccountId,
          relatedProjectId: projectId,
          workspaceId: project.workspaceId,
          description: `Owner Distribution to ${part.name} (${project.name})`,
          createdAt: new Date().toISOString(),
        });
      }
    });

    setIsDistributionModalOpen(false);
    setDistAmount(0);
    loadData();
  };

  const totalParticipantPercentage = participants.reduce(
    (sum, p) => sum + (p.profitSharePercentage || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {project.name}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {project.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{project.client}</span>
              <span aria-hidden="true">·</span>
              <span>{project.projectType}</span>
              <span aria-hidden="true">·</span>
              <span>
                {t.contractValue}: {formatCurrency(project.contractValue || 0, project.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRevAmount(0);
              setIsRevenueModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.recordProjectRevenue}</span>
          </button>
          <button
            onClick={() => {
              setExpAmount(0);
              setIsExpenseModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.recordProjectExpense}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('financials')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'financials'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isRTL ? 'اللوحة المالية والأرباح' : 'Financial Dashboard'}
        </button>
        <button
          onClick={() => setActiveTab('profit_sharing')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'profit_sharing'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isRTL ? 'توزيع الأرباح والشركاء' : 'Profit Sharing & Distributions'}
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'details'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {isRTL ? 'تفاصيل العقد والعميل' : 'Contract & Scope'}
        </button>
      </div>

      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Financial KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {t.recognizedRevenue}
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                {formatCurrency(financials.recognizedRevenue, project.currency)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {t.receivedRevenue}: {formatCurrency(financials.cashReceived, project.currency)}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {t.projectExpenses}
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                {formatCurrency(financials.recognizedExpenses, project.currency)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {isRTL ? 'المدفوع نقداً' : 'Cash Paid'}: {formatCurrency(financials.cashPaid, project.currency)}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {t.netProjectProfit}
              </span>
              <span
                className={`text-lg font-bold font-mono ${
                  financials.netProjectProfit >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatCurrency(financials.netProjectProfit, project.currency)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {t.profitMargin}:{' '}
                {financials.profitMarginPercent !== null
                  ? `${financials.profitMarginPercent}%`
                  : 'N/A'}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {t.projectCashSurplus}
              </span>
              <span
                className={`text-lg font-bold font-mono ${
                  financials.projectCashSurplus >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {formatCurrency(financials.projectCashSurplus, project.currency)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {isRTL ? 'النقد الفعلي بالمحفظة' : 'Actual Cash In Hand'}
              </span>
            </div>
          </div>

          {/* Tables: Revenue & Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenues */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {isRTL ? 'دفعات وإيرادات المشروع' : 'Revenue Entries'}
                </h3>
                <span className="text-xs font-mono font-semibold text-emerald-600">
                  {formatCurrency(financials.recognizedRevenue, project.currency)}
                </span>
              </div>

              {revenues.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  {isRTL ? 'لم يتم تسجيل أي إيرادات للمشروع بعد.' : 'No revenue records entered yet.'}
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {revenues.map((r) => (
                    <div key={r.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {r.description}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.date} · {r.revenueType.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-slate-900 dark:text-slate-100">
                          {formatCurrency(r.amount, r.currency)}
                        </div>
                        <span
                          className={`text-[10px] ${
                            r.isReceived ? 'text-emerald-500' : 'text-amber-500'
                          }`}
                        >
                          {r.isReceived ? (isRTL ? 'محصل' : 'Received') : (isRTL ? 'مستحق' : 'Pending')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expenses */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {isRTL ? 'مصروفات المشروع' : 'Project Expenses'}
                </h3>
                <span className="text-xs font-mono font-semibold text-rose-600">
                  {formatCurrency(financials.recognizedExpenses, project.currency)}
                </span>
              </div>

              {expenses.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  {isRTL ? 'لم يتم تسجيل أي مصروفات للمشروع بعد.' : 'No expenses recorded yet.'}
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {expenses.map((e) => (
                    <div key={e.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {e.description}
                        </div>
                        <div className="text-[11px] text-slate-400">{e.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-slate-900 dark:text-slate-100">
                          {formatCurrency(e.amount, e.currency)}
                        </div>
                        <span
                          className={`text-[10px] ${
                            e.isPaid ? 'text-emerald-500' : 'text-amber-500'
                          }`}
                        >
                          {e.isPaid ? (isRTL ? 'مدفوع' : 'Paid') : (isRTL ? 'غير مسدد' : 'Unpaid')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profit_sharing' && (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {t.netProjectProfit}
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                {formatCurrency(financials.netProjectProfit, project.currency)}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {t.distributions}
              </span>
              <span className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
                {formatCurrency(financials.totalOwnerDistributions, project.currency)}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                {t.undistributedProfit}
              </span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(financials.undistributedProfit, project.currency)}
              </span>
            </div>
          </div>

          {/* Validation note */}
          {totalParticipantPercentage !== 100 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {isRTL
                  ? `مجموع نسب الشركاء الحالي ${totalParticipantPercentage}% (${100 - totalParticipantPercentage}% أرباح مبقاة للشركة).`
                  : `Active allocated profit share is ${totalParticipantPercentage}% (Remaining ${100 - totalParticipantPercentage}% retained as company reserves).`}
              </span>
            </div>
          )}

          {/* Participants */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {t.participants}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsParticipantModalOpen(true)}
                  className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t.addParticipant}
                </button>
                {participants.length > 0 && (
                  <button
                    onClick={() => {
                      setDistParticipantId(participants[0]?.id || '');
                      setIsDistributionModalOpen(true);
                    }}
                    className="px-3 py-1 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {t.distributeProfit}
                  </button>
                )}
              </div>
            </div>

            {participants.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {isRTL
                  ? 'لم يتم إضافة شركاء بعد. يمكنك إضافة شركاء وتحديد نسب حصص الأرباح لكل شريك.'
                  : 'No participants registered yet. Add partners or co-founders to define profit share.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {participants.map((p) => {
                  const shareOfProfit = Math.max(0, (financials.netProjectProfit * p.profitSharePercentage) / 100);
                  const pDists = distributions
                    .filter((d) => d.participantId === p.id)
                    .reduce((sum, d) => sum + d.amount, 0);
                  const pRemaining = Math.max(0, shareOfProfit - pDists);

                  return (
                    <div key={p.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.role} · {p.profitSharePercentage}% Share
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(shareOfProfit, project.currency)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isRTL ? 'موزع' : 'Distributed'}: {formatCurrency(pDists, project.currency)} · {isRTL ? 'متبقي' : 'Available'}: {formatCurrency(pRemaining, project.currency)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Distribution History */}
          {distributions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
                {isRTL ? 'سجل توزيعات الأرباح المسددة' : 'Distribution Payout History'}
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {distributions.map((d) => (
                  <div key={d.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {d.participantName}
                      </div>
                      <div className="text-[11px] text-slate-400">{d.date}</div>
                    </div>
                    <div className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(d.amount, d.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold text-slate-500 block mb-1">{t.client}:</span>
              <span className="text-slate-900 dark:text-slate-100">{project.client || '-'}</span>
              {project.clientContact && (
                <span className="text-slate-400 block mt-0.5">{project.clientContact}</span>
              )}
            </div>

            <div>
              <span className="font-semibold text-slate-500 block mb-1">{isRTL ? 'التواريخ' : 'Dates'}:</span>
              <span className="text-slate-900 dark:text-slate-100 block">
                {isRTL ? 'البدء' : 'Start'}: {project.startDate}
              </span>
              {project.expectedCompletionDate && (
                <span className="text-slate-500 block">
                  {isRTL ? 'المتوقع' : 'Expected'}: {project.expectedCompletionDate}
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="font-semibold text-slate-500 block mb-1">{t.description}:</span>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {project.description || 'No description provided.'}
            </p>
          </div>
        </div>
      )}

      {/* Record Revenue Modal */}
      <Modal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        title={t.recordProjectRevenue}
      >
        <form onSubmit={handleAddRevenue} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.amount} ({project.currency}) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={revAmount || ''}
              onChange={(e) => setRevAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full text-base font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'نوع الإيراد' : 'Revenue Type'}
            </label>
            <select
              value={revType}
              onChange={(e) => setRevType(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="installment">{isRTL ? 'دفعة / قسط من العقد' : 'Installment Payment'}</option>
              <option value="one_time">{isRTL ? 'دفعة واحدة كاملة' : 'One-Time Payment'}</option>
              <option value="recurring_subscription">{isRTL ? 'اشتراك متكرر' : 'Recurring Subscription'}</option>
              <option value="maintenance_fee">{isRTL ? 'رسوم صيانة ودعم' : 'Maintenance Fee'}</option>
              <option value="additional_service">{isRTL ? 'خدمات إضافية' : 'Additional Services'}</option>
              <option value="custom">{isRTL ? 'مخصص' : 'Custom'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.description}
            </label>
            <input
              type="text"
              value={revDesc}
              onChange={(e) => setRevDesc(e.target.value)}
              placeholder="e.g. Milestone 2 Deliverable"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="revReceived"
              checked={revIsReceived}
              onChange={(e) => setRevIsReceived(e.target.checked)}
              className="rounded-sm text-blue-600"
            />
            <label htmlFor="revReceived" className="text-xs text-slate-700 dark:text-slate-300">
              {isRTL ? 'تم تحصيل المبلغ نقداً بالفعل' : 'Cash has already been received'}
            </label>
          </div>

          {revIsReceived && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'إيداع إلى حساب / محفظة' : 'Deposit Into Account'}
              </label>
              <select
                value={revAccountId}
                onChange={(e) => setRevAccountId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">{isRTL ? '-- اختر الحساب المالي --' : '-- Select Account --'}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency}) - {a.workspaceScope}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRevenueModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-xs"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={t.recordProjectExpense}
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.amount} ({project.currency}) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={expAmount || ''}
              onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full text-base font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.category}
            </label>
            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">{isRTL ? 'عام / غير مصنف' : 'General'}</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.description}
            </label>
            <input
              type="text"
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              placeholder="e.g. AWS Cloud Hosting, Freelance UI Designer"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="expPaid"
              checked={expIsPaid}
              onChange={(e) => setExpIsPaid(e.target.checked)}
              className="rounded-sm text-blue-600"
            />
            <label htmlFor="expPaid" className="text-xs text-slate-700 dark:text-slate-300">
              {isRTL ? 'تم سداد المصروف نقداً' : 'Expense has already been paid'}
            </label>
          </div>

          {expIsPaid && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'تم الدفع من حساب' : 'Paid From Account'}
              </label>
              <select
                value={expAccountId}
                onChange={(e) => setExpAccountId(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">{isRTL ? '-- اختر الحساب --' : '-- Select Account --'}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency}) - {a.workspaceScope}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg shadow-xs"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Participant Modal */}
      <Modal
        isOpen={isParticipantModalOpen}
        onClose={() => setIsParticipantModalOpen(false)}
        title={t.addParticipant}
      >
        <form onSubmit={handleAddParticipant} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'اسم الشريك / المشارك *' : 'Participant Name *'}
            </label>
            <input
              type="text"
              required
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="e.g. Kamal Kayyali"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'الدور / الصفة' : 'Role'}
            </label>
            <input
              type="text"
              value={partRole}
              onChange={(e) => setPartRole(e.target.value)}
              placeholder="e.g. Managing Partner, Lead Architect"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'نسبة المشاركة في الأرباح (%) *' : 'Profit Share Percentage (%) *'}
            </label>
            <input
              type="number"
              step="any"
              min="0"
              max="100"
              required
              value={partPercent}
              onChange={(e) => setPartPercent(parseFloat(e.target.value) || 0)}
              className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsParticipantModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-xs"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Distribute Profit Modal */}
      <Modal
        isOpen={isDistributionModalOpen}
        onClose={() => setIsDistributionModalOpen(false)}
        title={t.distributeProfit}
      >
        <form onSubmit={handleAddDistribution} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'الشريك المستفيد *' : 'Beneficiary Partner *'}
            </label>
            <select
              value={distParticipantId}
              onChange={(e) => setDistParticipantId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.profitSharePercentage}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'مبلغ التوزيع *' : 'Distribution Amount *'} ({project.currency})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={distAmount || ''}
              onChange={(e) => setDistAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full text-base font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {isRTL
                ? `الربح غير الموزع المتاح حالياً: ${formatCurrency(financials.undistributedProfit, project.currency)}`
                : `Current available undistributed profit: ${formatCurrency(financials.undistributedProfit, project.currency)}`}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'الصرف من حساب' : 'Payout Account'}
            </label>
            <select
              value={distAccountId}
              onChange={(e) => setDistAccountId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">{isRTL ? '-- اختر الحساب المالي --' : '-- Select Account --'}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsDistributionModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 rounded-lg shadow-xs"
            >
              {isRTL ? 'تأكيد وصرف التوزيع' : 'Confirm & Disburse'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
