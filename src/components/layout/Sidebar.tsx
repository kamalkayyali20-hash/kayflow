import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Building2,
  Users,
  FileText,
  PhoneCall,
  Clock,
  AlertCircle,
  CheckSquare,
  StickyNote,
  BarChart3,
  Settings,
  Code2,
  FolderKanban,
  Repeat,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Percent,
  Wallet,
  PiggyBank,
  Target,
  Banknote,
  CreditCard,
  Sun,
  Shield,
  Briefcase,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useApp, type WorkspaceId } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    t,
    activeWorkspaceId,
    setActiveWorkspaceId,
    activeNav,
    setActiveNav,
    isRTL,
  } = useApp();

  const renderOfisMenu = () => (
    <div className="space-y-6">
      {/* OVERVIEW */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
          {isRTL ? 'نظرة عامة' : 'Overview'}
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => setActiveNav('ofis-dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-dashboard'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>{t.navDashboard}</span>
          </button>

          <button
            onClick={() => setActiveNav('ofis-schedule')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-schedule'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{t.navSchedule}</span>
          </button>
        </div>
      </div>

      {/* CLIENT MANAGEMENT */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
          {isRTL ? 'إدارة العملاء والشركات' : 'Client Management'}
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => setActiveNav('ofis-companies')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-companies'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>{t.navCompanies}</span>
          </button>

          <button
            onClick={() => setActiveNav('ofis-contacts')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-contacts'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>{t.navContacts}</span>
          </button>

          <button
            onClick={() => setActiveNav('ofis-contracts')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-contracts'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>{t.navContracts}</span>
          </button>

          <button
            onClick={() => setActiveNav('ofis-visits')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-visits'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <PhoneCall className="w-4 h-4 shrink-0" />
            <span>{t.navVisits}</span>
          </button>

          <button
            onClick={() => setActiveNav('ofis-followups')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-followups'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{t.navFollowUps}</span>
          </button>

          <button
            onClick={() => setActiveNav('ofis-issues')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-issues'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{t.navSupportIssues}</span>
          </button>
        </div>
      </div>

      {/* PRODUCTIVITY */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
          {isRTL ? 'الإنتاجية والمتابعة' : 'Productivity'}
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => setActiveNav('ofis-tasks')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-tasks'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span>{t.navTasks}</span>
          </button>

          <button
            onClick={() => setActiveNav('ofis-calendar')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-calendar'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{t.navCalendar}</span>
          </button>

          <button
            onClick={() => setActiveNav('ofis-notes')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-notes'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <StickyNote className="w-4 h-4 shrink-0" />
            <span>{t.navNotes}</span>
          </button>
        </div>
      </div>

      {/* INSIGHTS & SETTINGS */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
          {isRTL ? 'التقارير والإعدادات' : 'Insights & Settings'}
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => setActiveNav('ofis-analytics')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-analytics'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>{t.navAnalytics}</span>
          </button>

          <button
            onClick={() => setActiveNav('ofis-settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'ofis-settings'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>{t.navSettings}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderKayMenu = () => (
    <div className="space-y-6">
      {/* OVERVIEW */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
          {isRTL ? 'نظرة عامة' : 'Overview'}
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => setActiveNav('kay-dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'kay-dashboard'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>{t.navDashboard}</span>
          </button>

          <button
            onClick={() => setActiveNav('kay-calendar')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'kay-calendar'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{isRTL ? 'تقويم الأعمال' : 'Business Calendar'}</span>
          </button>
        </div>
      </div>

      {/* BUSINESS */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
          {isRTL ? 'الأعمال والمشاريع' : 'Business'}
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => setActiveNav('kay-projects')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'kay-projects'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FolderKanban className="w-4 h-4 shrink-0" />
            <span>{t.navProjects}</span>
          </button>

          <button
            onClick={() => setActiveNav('kay-customers')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'kay-customers'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>{t.navCustomers}</span>
          </button>

          <button
            onClick={() => setActiveNav('kay-sales')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'kay-sales'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Repeat className="w-4 h-4 shrink-0" />
            <span>{t.navProjectSales}</span>
          </button>
        </div>
      </div>

      {/* FINANCE */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
          {isRTL ? 'المالية والأرباح' : 'Finance & Profit'}
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => setActiveNav('kay-revenue')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'kay-revenue'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>{t.navRevenue}</span>
          </button>

          <button
            onClick={() => setActiveNav('kay-expenses')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'kay-expenses'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingDown className="w-4 h-4 shrink-0" />
            <span>{t.navExpenses}</span>
          </button>

          <button
            onClick={() => setActiveNav('kay-profit-loss')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'kay-profit-loss'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>{t.navProfitLoss}</span>
          </button>

          <button
            onClick={() => setActiveNav('kay-partners')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'kay-partners'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Percent className="w-4 h-4 shrink-0" />
            <span>{t.navPartnerShares}</span>
          </button>
        </div>
      </div>

      {/* OPERATIONS & SETTINGS */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
          {isRTL ? 'العمليات والإعدادات' : 'Operations & Settings'}
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => setActiveNav('kay-tasks')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'kay-tasks'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span>{t.navTasks}</span>
          </button>

          <button
            onClick={() => setActiveNav('kay-notes')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'kay-notes'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <StickyNote className="w-4 h-4 shrink-0" />
            <span>{t.navNotes}</span>
          </button>

          <button
            onClick={() => setActiveNav('kay-settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'kay-settings'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>{t.navBusinessSettings}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderPersonalMenu = () => (
    <div className="space-y-6">
      {/* OVERVIEW */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
          {isRTL ? 'نظرة عامة' : 'Overview'}
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => setActiveNav('personal-dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-dashboard'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>{t.navPersonalDashboard}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-my-day')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-my-day'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4 shrink-0" />
            <span>{t.navMyDay}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-calendar')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-calendar'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{t.navCalendar}</span>
          </button>
        </div>
      </div>

      {/* FINANCE */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
          {isRTL ? 'المالية الشخصية' : 'Personal Finance'}
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => setActiveNav('personal-finance')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-finance'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>{t.navFinanceOverview}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-income')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-income'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>{t.navIncome}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-expenses')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-expenses'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingDown className="w-4 h-4 shrink-0" />
            <span>{t.navPersonalExpenses}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-salary')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-salary'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Banknote className="w-4 h-4 shrink-0" />
            <span>{t.navSalary}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-debts')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-debts'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>{t.navDebts}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-accounts')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-accounts'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span>{t.navAccounts}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-budgets')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-budgets'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <PiggyBank className="w-4 h-4 shrink-0" />
            <span>{t.navBudgets}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-goals')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-goals'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Target className="w-4 h-4 shrink-0" />
            <span>{t.navGoals}</span>
          </button>
        </div>
      </div>

      {/* PRODUCTIVITY & REPORTS */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1.5">
          {isRTL ? 'الإنتاجية والتقارير' : 'Productivity & Reports'}
        </div>
        <div className="space-y-0.5">
          <button
            onClick={() => setActiveNav('personal-tasks')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-tasks'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span>{t.navPersonalTasks}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-reminders')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-reminders'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{t.navReminders}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-notes')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-notes'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <StickyNote className="w-4 h-4 shrink-0" />
            <span>{t.navNotes}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-analytics')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-analytics'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>{t.navAnalytics}</span>
          </button>

          <button
            onClick={() => setActiveNav('personal-settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeNav === 'personal-settings'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>{t.navSettings}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-53px)] select-none">
      {/* Prominent Workspace Selector in Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">
          {t.workspace}
        </label>
        <div className="relative">
          <select
            value={activeWorkspaceId}
            onChange={(e) => setActiveWorkspaceId(e.target.value as WorkspaceId)}
            className="w-full text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            <option value="ofis-soft">OFIS-SOFT (Account Management)</option>
            <option value="kay-soft">KAY-SOFT (Software Business)</option>
            <option value="personal">PERSONAL (Finance & Productivity)</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute top-3 right-3 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Dynamic Navigation Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {activeWorkspaceId === 'ofis-soft' && renderOfisMenu()}
        {activeWorkspaceId === 'kay-soft' && renderKayMenu()}
        {activeWorkspaceId === 'personal' && renderPersonalMenu()}
      </div>
    </aside>
  );
};
