import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Clock,
  Calendar,
  MoreHorizontal,
  X,
  Code2,
  FolderKanban,
  DollarSign,
  CheckSquare,
  Users,
  FileText,
  PhoneCall,
  AlertCircle,
  StickyNote,
  BarChart3,
  Settings,
  TrendingDown,
  TrendingUp,
  Percent,
  Wallet,
  Banknote,
  CreditCard,
  PiggyBank,
  Target,
  Sun,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MobileNav: React.FC = () => {
  const { t, activeWorkspaceId, activeNav, setActiveNav, isRTL } = useApp();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleNavClick = (nav: string) => {
    setActiveNav(nav);
    setShowMoreMenu(false);
  };

  const renderMoreOfis = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <button
        onClick={() => handleNavClick('ofis-schedule')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <Calendar className="w-4 h-4 text-sky-500" />
        <span>{t.navSchedule}</span>
      </button>

      <button
        onClick={() => handleNavClick('ofis-contacts')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <Users className="w-4 h-4 text-sky-500" />
        <span>{t.navContacts}</span>
      </button>

      <button
        onClick={() => handleNavClick('ofis-contracts')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <FileText className="w-4 h-4 text-sky-500" />
        <span>{t.navContracts}</span>
      </button>

      <button
        onClick={() => handleNavClick('ofis-visits')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <PhoneCall className="w-4 h-4 text-sky-500" />
        <span>{t.navVisits}</span>
      </button>

      <button
        onClick={() => handleNavClick('ofis-issues')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <AlertCircle className="w-4 h-4 text-rose-500" />
        <span>{t.navSupportIssues}</span>
      </button>

      <button
        onClick={() => handleNavClick('ofis-tasks')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <CheckSquare className="w-4 h-4 text-blue-500" />
        <span>{t.navTasks}</span>
      </button>

      <button
        onClick={() => handleNavClick('ofis-notes')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <StickyNote className="w-4 h-4 text-amber-500" />
        <span>{t.navNotes}</span>
      </button>

      <button
        onClick={() => handleNavClick('ofis-analytics')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <BarChart3 className="w-4 h-4 text-purple-500" />
        <span>{t.navAnalytics}</span>
      </button>
    </div>
  );

  const renderMoreKay = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <button
        onClick={() => handleNavClick('kay-customers')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <Users className="w-4 h-4 text-emerald-500" />
        <span>{t.navCustomers}</span>
      </button>

      <button
        onClick={() => handleNavClick('kay-sales')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <FileText className="w-4 h-4 text-emerald-500" />
        <span>{t.navProjectSales}</span>
      </button>

      <button
        onClick={() => handleNavClick('kay-expenses')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <TrendingDown className="w-4 h-4 text-rose-500" />
        <span>{t.navExpenses}</span>
      </button>

      <button
        onClick={() => handleNavClick('kay-profit-loss')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <TrendingUp className="w-4 h-4 text-emerald-500" />
        <span>{t.navProfitLoss}</span>
      </button>

      <button
        onClick={() => handleNavClick('kay-partners')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <Percent className="w-4 h-4 text-purple-500" />
        <span>{t.navPartnerShares}</span>
      </button>

      <button
        onClick={() => handleNavClick('kay-calendar')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <Calendar className="w-4 h-4 text-blue-500" />
        <span>{t.navCalendar}</span>
      </button>

      <button
        onClick={() => handleNavClick('kay-notes')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <StickyNote className="w-4 h-4 text-amber-500" />
        <span>{t.navNotes}</span>
      </button>

      <button
        onClick={() => handleNavClick('kay-settings')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <Settings className="w-4 h-4 text-slate-500" />
        <span>{t.navSettings}</span>
      </button>
    </div>
  );

  const renderMorePersonal = () => (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <button
        onClick={() => handleNavClick('personal-income')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <TrendingUp className="w-4 h-4 text-emerald-500" />
        <span>{t.navIncome}</span>
      </button>

      <button
        onClick={() => handleNavClick('personal-expenses')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <TrendingDown className="w-4 h-4 text-rose-500" />
        <span>{t.navPersonalExpenses}</span>
      </button>

      <button
        onClick={() => handleNavClick('personal-salary')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <Banknote className="w-4 h-4 text-emerald-500" />
        <span>{t.navSalary}</span>
      </button>

      <button
        onClick={() => handleNavClick('personal-debts')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <CreditCard className="w-4 h-4 text-amber-500" />
        <span>{t.navDebts}</span>
      </button>

      <button
        onClick={() => handleNavClick('personal-accounts')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <Wallet className="w-4 h-4 text-blue-500" />
        <span>{t.navAccounts}</span>
      </button>

      <button
        onClick={() => handleNavClick('personal-budgets')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <PiggyBank className="w-4 h-4 text-purple-500" />
        <span>{t.navBudgets}</span>
      </button>

      <button
        onClick={() => handleNavClick('personal-goals')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <Target className="w-4 h-4 text-indigo-500" />
        <span>{t.navGoals}</span>
      </button>

      <button
        onClick={() => handleNavClick('personal-reminders')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <Clock className="w-4 h-4 text-rose-500" />
        <span>{t.navReminders}</span>
      </button>

      <button
        onClick={() => handleNavClick('personal-settings')}
        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-left"
      >
        <Settings className="w-4 h-4 text-slate-500" />
        <span>{t.navSettings}</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer for More Items */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 max-h-[75vh] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.more} — {activeWorkspaceId.toUpperCase()}
              </h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeWorkspaceId === 'ofis-soft' && renderMoreOfis()}
            {activeWorkspaceId === 'kay-soft' && renderMoreKay()}
            {activeWorkspaceId === 'personal' && renderMorePersonal()}
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around select-none">
        {activeWorkspaceId === 'ofis-soft' && (
          <>
            <button
              onClick={() => setActiveNav('ofis-dashboard')}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
                activeNav === 'ofis-dashboard'
                  ? 'text-sky-600 dark:text-sky-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>{t.navDashboard}</span>
            </button>
            <button
              onClick={() => setActiveNav('ofis-companies')}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
                activeNav === 'ofis-companies'
                  ? 'text-sky-600 dark:text-sky-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span>{t.navCompanies}</span>
            </button>
            <button
              onClick={() => setActiveNav('ofis-followups')}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
                activeNav === 'ofis-followups'
                  ? 'text-sky-600 dark:text-sky-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>{t.navFollowUps}</span>
            </button>
            <button
              onClick={() => setActiveNav('ofis-calendar')}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
                activeNav === 'ofis-calendar'
                  ? 'text-sky-600 dark:text-sky-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>{t.navCalendar}</span>
            </button>
          </>
        )}

        {activeWorkspaceId === 'kay-soft' && (
          <>
            <button
              onClick={() => setActiveNav('kay-dashboard')}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
                activeNav === 'kay-dashboard'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>{t.navDashboard}</span>
            </button>
            <button
              onClick={() => setActiveNav('kay-projects')}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
                activeNav === 'kay-projects'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <FolderKanban className="w-5 h-5" />
              <span>{t.navProjects}</span>
            </button>
            <button
              onClick={() => setActiveNav('kay-revenue')}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
                activeNav === 'kay-revenue'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span>{t.navRevenue}</span>
            </button>
            <button
              onClick={() => setActiveNav('kay-tasks')}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
                activeNav === 'kay-tasks'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span>{t.navTasks}</span>
            </button>
          </>
        )}

        {activeWorkspaceId === 'personal' && (
          <>
            <button
              onClick={() => setActiveNav('personal-dashboard')}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
                activeNav === 'personal-dashboard'
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>{t.navDashboard}</span>
            </button>
            <button
              onClick={() => setActiveNav('personal-finance')}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
                activeNav === 'personal-finance'
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span>{t.navFinanceOverview}</span>
            </button>
            <button
              onClick={() => setActiveNav('personal-calendar')}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
                activeNav === 'personal-calendar'
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>{t.navCalendar}</span>
            </button>
            <button
              onClick={() => setActiveNav('personal-tasks')}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium ${
                activeNav === 'personal-tasks'
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span>{t.navTasks}</span>
            </button>
          </>
        )}

        <button
          onClick={() => setShowMoreMenu(true)}
          className="flex flex-col items-center gap-1 p-1 text-[10px] font-medium text-slate-500"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>{t.more}</span>
        </button>
      </nav>
    </>
  );
};
