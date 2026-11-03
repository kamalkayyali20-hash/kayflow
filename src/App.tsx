/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { QuickAddModal } from './components/common/QuickAddModal';
import { LockScreen } from './components/common/LockScreen';

// OFIS-SOFT Views
import { OfisDashboard } from './components/ofis/OfisDashboard';
import { CompanyList } from './components/ofis/CompanyList';
import { ContactsView } from './components/ofis/ContactsView';
import { ContractsView } from './components/ofis/ContractsView';
import { VisitsView } from './components/ofis/VisitsView';
import { FollowUpsView } from './components/ofis/FollowUpsView';
import { SupportIssuesView } from './components/ofis/SupportIssuesView';

// KAY-SOFT Views
import { KayDashboard } from './components/kaysoft/KayDashboard';
import { CustomersView } from './components/kaysoft/CustomersView';
import { ProjectSalesView } from './components/kaysoft/ProjectSalesView';
import { RevenuePaymentsView } from './components/kaysoft/RevenuePaymentsView';
import { BusinessExpensesView } from './components/kaysoft/BusinessExpensesView';
import { PartnerSharesView } from './components/kaysoft/PartnerSharesView';
import { ProjectList } from './components/projects/ProjectList';

// PERSONAL Finance Views
import { FinanceOverview } from './components/finance/FinanceOverview';
import { TransactionsView } from './components/finance/TransactionsView';
import { SalaryView } from './components/finance/SalaryView';
import { DebtView } from './components/finance/DebtView';
import { AccountsView } from './components/finance/AccountsView';
import { BudgetsView } from './components/finance/BudgetsView';
import { GoalsView } from './components/finance/GoalsView';
import { AnalyticsView } from './components/finance/AnalyticsView';
import { RemindersView } from './components/finance/RemindersView';

// Shared Productivity & Settings
import { TasksView } from './components/productivity/TasksView';
import { CalendarView } from './components/productivity/CalendarView';
import { NotesView } from './components/productivity/NotesView';
import { CategoryManager } from './components/categories/CategoryManager';
import { SettingsView } from './components/settings/SettingsView';

const MainContent: React.FC = () => {
  const { activeNav, activeWorkspaceId, isLocked } = useApp();

  if (isLocked) {
    return <LockScreen />;
  }

  const renderActiveView = () => {
    // 1. OFIS-SOFT Routes
    if (activeNav === 'ofis-dashboard') return <OfisDashboard />;
    if (activeNav === 'ofis-companies') return <CompanyList />;
    if (activeNav === 'ofis-contacts') return <ContactsView />;
    if (activeNav === 'ofis-contracts') return <ContractsView />;
    if (activeNav === 'ofis-visits') return <VisitsView />;
    if (activeNav === 'ofis-followups') return <FollowUpsView />;
    if (activeNav === 'ofis-issues') return <SupportIssuesView />;
    if (activeNav === 'ofis-schedule' || activeNav === 'ofis-calendar') return <CalendarView />;
    if (activeNav === 'ofis-tasks') return <TasksView />;
    if (activeNav === 'ofis-notes') return <NotesView />;
    if (activeNav === 'ofis-analytics') return <AnalyticsView />;
    if (activeNav === 'ofis-settings') return <SettingsView />;

    // 2. KAY-SOFT Routes
    if (activeNav === 'kay-dashboard') return <KayDashboard />;
    if (activeNav === 'kay-projects') return <ProjectList />;
    if (activeNav === 'kay-customers') return <CustomersView />;
    if (activeNav === 'kay-sales') return <ProjectSalesView />;
    if (activeNav === 'kay-revenue') return <RevenuePaymentsView />;
    if (activeNav === 'kay-expenses') return <BusinessExpensesView />;
    if (activeNav === 'kay-profit-loss' || activeNav === 'kay-partners') return <PartnerSharesView />;
    if (activeNav === 'kay-calendar') return <CalendarView />;
    if (activeNav === 'kay-tasks') return <TasksView />;
    if (activeNav === 'kay-notes') return <NotesView />;
    if (activeNav === 'kay-settings') return <SettingsView />;

    // 3. PERSONAL Routes
    if (activeNav === 'personal-dashboard' || activeNav === 'personal-finance' || activeNav === 'finance' || activeNav === 'finance-overview' || activeNav === 'overview') {
      return <FinanceOverview />;
    }
    if (activeNav === 'personal-my-day') return <TasksView />;
    if (activeNav === 'personal-calendar') return <CalendarView />;
    if (activeNav === 'personal-income' || activeNav === 'personal-expenses' || activeNav === 'finance-transactions' || activeNav === 'finance-income' || activeNav === 'finance-expenses') {
      return <TransactionsView />;
    }
    if (activeNav === 'personal-salary' || activeNav === 'finance-salary') return <SalaryView />;
    if (activeNav === 'personal-debts' || activeNav === 'finance-debts') return <DebtView />;
    if (activeNav === 'personal-accounts' || activeNav === 'finance-accounts') return <AccountsView />;
    if (activeNav === 'personal-budgets' || activeNav === 'finance-budgets') return <BudgetsView />;
    if (activeNav === 'personal-goals' || activeNav === 'finance-goals') return <GoalsView />;
    if (activeNav === 'personal-tasks') return <TasksView />;
    if (activeNav === 'personal-reminders' || activeNav === 'finance-reminders') return <RemindersView />;
    if (activeNav === 'personal-notes') return <NotesView />;
    if (activeNav === 'personal-analytics' || activeNav === 'finance-reports') return <AnalyticsView />;
    if (activeNav === 'personal-settings' || activeNav === 'settings') return <SettingsView />;
    if (activeNav === 'categories') return <CategoryManager />;
    if (activeNav === 'projects') return <ProjectList />;

    // Default workspace fallback
    if (activeWorkspaceId === 'ofis-soft') return <OfisDashboard />;
    if (activeWorkspaceId === 'kay-soft') return <KayDashboard />;
    return <FinanceOverview />;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <TopBar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-full overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      <MobileNav />
      <QuickAddModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
