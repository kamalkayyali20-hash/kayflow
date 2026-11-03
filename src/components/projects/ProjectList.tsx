import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type { Project } from '../../types';
import { formatCurrency } from '../../services/currencyService';
import { calculateProjectFinancials } from '../../services/accountingEngine';
import { ProjectModal } from './ProjectModal';
import { ProjectDetail } from './ProjectDetail';
import { EmptyState } from '../common/EmptyState';

export const ProjectList: React.FC = () => {
  const { t, isRTL, activeWorkspaceId, reportingCurrency } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [financialSummaries, setFinancialSummaries] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const loadProjects = async () => {
    let projs = await db.projects.toArray();
    if ((activeWorkspaceId as string) !== 'all') {
      projs = projs.filter((p) => p.workspaceId === activeWorkspaceId);
    }
    setProjects(projs);

    // Calculate financials for each project
    const summaries: Record<string, any> = {};
    for (const p of projs) {
      const fin = await calculateProjectFinancials(p.id);
      if (fin) summaries[p.id] = fin;
    }
    setFinancialSummaries(summaries);
  };

  useEffect(() => {
    loadProjects();
  }, [activeWorkspaceId]);

  if (selectedProjectId) {
    return (
      <ProjectDetail
        projectId={selectedProjectId}
        onBack={() => {
          setSelectedProjectId(null);
          loadProjects();
        }}
      />
    );
  }

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client && p.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.projectType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.projectsTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? 'إدارة مشاريع كاي-سوفت للبرمجيات والعقود، وتتبع الإيرادات ونسب الأرباح وهوامش الربحية.'
              : 'Enterprise project portfolio, contract financials, milestone revenues, and profit distribution.'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createProject}</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
          <input
            type="text"
            placeholder={isRTL ? 'بحث بالاسم أو العميل أو نوع المشروع...' : 'Search by name, client, or type...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        >
          <option value="all">{isRTL ? 'جميع الحالات' : 'All Statuses'}</option>
          <option value="in_development">{isRTL ? 'قيد التطوير' : 'In Development'}</option>
          <option value="delivered">{isRTL ? 'تم التسليم' : 'Delivered'}</option>
          <option value="planning">{isRTL ? 'تخطيط' : 'Planning'}</option>
          <option value="maintenance">{isRTL ? 'صيانة ودعم' : 'Maintenance'}</option>
          <option value="on_hold">{isRTL ? 'معلق' : 'On Hold'}</option>
        </select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={isRTL ? 'لا توجد مشاريع مضافة بعد' : 'No projects found'}
          description={
            isRTL
              ? 'أضف أول مشروع برمجي أو استشاري لمتابعة ميزانيته، تدفقاته النقدية، وتقاسم أرباح الشركاء.'
              : 'Create your first software or consulting project to track contract value, milestones, and partner profit allocations.'
          }
          primaryActionLabel={t.createProject}
          onPrimaryAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const fin = financialSummaries[proj.id];
            const netProfit = fin ? fin.netProjectProfit : 0;
            const profitMargin = fin ? fin.profitMarginPercent : null;

            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-xs cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {proj.client}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                      {proj.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {proj.name}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <span>{proj.projectType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{proj.startDate}</span>
                  </div>

                  {/* Financial Stats strip */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t.contractValue}</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(proj.contractValue || 0, proj.currency)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">{t.netProjectProfit}</span>
                      <span
                        className={`font-mono font-bold ${
                          netProfit >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatCurrency(netProfit, proj.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {profitMargin !== null ? `${t.profitMargin}: ${profitMargin}%` : ''}
                  </span>
                  <div className="flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>{isRTL ? 'التفاصيل المالية' : 'View Financials'}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadProjects}
      />
    </div>
  );
};
