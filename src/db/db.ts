import Dexie, { type Table } from 'dexie';
import type {
  CustomCategory,
  FinancialAccount,
  FinancialTransaction,
  JournalEntry,
  SalaryAgreement,
  SalaryPayment,
  Debt,
  DebtPayment,
  Budget,
  FinancialGoal,
  GoalAllocation,
  Project,
  ProjectRevenue,
  ProjectExpense,
  ProjectParticipant,
  ProfitAllocation,
  OwnerDistribution,
  ExchangeRate,
  FinancialReminder,
  Workspace,
  Company,
  Contact,
  Contract,
  Visit,
  FollowUp,
  SupportIssue,
  Task,
  CalendarEvent,
  Note,
  Customer,
  ProjectSale,
  CustomerPayment,
  BusinessExpense,
  Partner,
  PartnerDistribution,
} from '../types';

export class KayFlowDatabase extends Dexie {
  workspaces!: Table<Workspace, string>;
  categories!: Table<CustomCategory, string>;
  accounts!: Table<FinancialAccount, string>;
  transactions!: Table<FinancialTransaction, string>;
  journalEntries!: Table<JournalEntry, string>;
  salaryAgreements!: Table<SalaryAgreement, string>;
  salaryPayments!: Table<SalaryPayment, string>;
  debts!: Table<Debt, string>;
  debtPayments!: Table<DebtPayment, string>;
  budgets!: Table<Budget, string>;
  goals!: Table<FinancialGoal, string>;
  goalAllocations!: Table<GoalAllocation, string>;
  projects!: Table<Project, string>;
  projectRevenues!: Table<ProjectRevenue, string>;
  projectExpenses!: Table<ProjectExpense, string>;
  projectParticipants!: Table<ProjectParticipant, string>;
  profitAllocations!: Table<ProfitAllocation, string>;
  ownerDistributions!: Table<OwnerDistribution, string>;
  exchangeRates!: Table<ExchangeRate, string>;
  reminders!: Table<FinancialReminder, string>;

  // OFIS-SOFT & KAY-SOFT V2 Tables
  companies!: Table<Company, string>;
  contacts!: Table<Contact, string>;
  contracts!: Table<Contract, string>;
  visits!: Table<Visit, string>;
  followUps!: Table<FollowUp, string>;
  supportIssues!: Table<SupportIssue, string>;
  tasks!: Table<Task, string>;
  calendarEvents!: Table<CalendarEvent, string>;
  notes!: Table<Note, string>;
  customers!: Table<Customer, string>;
  projectSales!: Table<ProjectSale, string>;
  customerPayments!: Table<CustomerPayment, string>;
  businessExpenses!: Table<BusinessExpense, string>;
  partners!: Table<Partner, string>;
  partnerDistributions!: Table<PartnerDistribution, string>;

  constructor() {
    super('kayflow_db');

    this.version(1).stores({
      workspaces: 'id, name, type',
      categories: 'id, name, type, workspaceId, parentId, status',
      accounts: 'id, name, type, currency, workspaceScope, workspaceId',
      transactions: 'id, date, type, categoryId, workspaceId, fromAccountId, toAccountId, relatedProjectId',
      journalEntries: 'id, transactionId, date',
      salaryAgreements: 'id, employer, workspaceId, paymentStatus',
      salaryPayments: 'id, salaryAgreementId, date, monthYear, status',
      debts: 'id, name, debtType, direction, creditorDebtor, status, nextPaymentDate',
      debtPayments: 'id, debtId, date',
      budgets: 'id, categoryId, period, workspaceId',
      goals: 'id, name, priority, targetDate',
      goalAllocations: 'id, goalId, date',
      projects: 'id, name, categoryId, workspaceId, client, status, priority',
      projectRevenues: 'id, projectId, date, revenueType, isReceived',
      projectExpenses: 'id, projectId, date, categoryId, isPaid',
      projectParticipants: 'id, projectId, name',
      profitAllocations: 'id, projectId, participantId, date',
      ownerDistributions: 'id, projectId, participantId, date',
      exchangeRates: 'id, fromCurrency, toCurrency, rateDate',
      reminders: 'id, reminderType, dueDate, isCompleted',
    });

    this.version(2).stores({
      companies: 'id, name, industry, city, status, workspaceId, nextFollowUpDate',
      contacts: 'id, companyId, name, phone, email, workspaceId',
      contracts: 'id, companyId, contractNumber, type, status, workspaceId',
      visits: 'id, companyId, date, type, status, workspaceId',
      followUps: 'id, companyId, dueDate, status, workspaceId',
      supportIssues: 'id, companyId, title, priority, status, workspaceId',
      tasks: 'id, title, status, priority, dueDate, workspaceId, relatedType, relatedId',
      calendarEvents: 'id, title, startDate, endDate, type, workspaceId',
      notes: 'id, title, workspaceId, relatedType, relatedId',
      customers: 'id, name, companyName, status, workspaceId',
      projectSales: 'id, projectId, customerId, status, billingFrequency, workspaceId',
      customerPayments: 'id, customerId, projectId, saleId, date, status, paymentType, workspaceId',
      businessExpenses: 'id, name, category, date, workspaceId, relatedProjectId, expenseType',
      partners: 'id, name, ownershipPercentage, profitSharingPercentage, workspaceId',
      partnerDistributions: 'id, partnerId, date, amount, status, workspaceId, linkedPersonalTxId',
    });
  }
}

export const db = new KayFlowDatabase();

// Default seed function for bare minimum structure (Workspaces and default conversion rates)
// Notice: We strictly DO NOT seed any sample financial transactions, salaries, debts, expenses, incomes, or projects!
export async function initializeDatabaseDefaults(): Promise<void> {
  const defaultWorkspaces: Workspace[] = [
    {
      id: 'ofis-soft',
      name: 'OFIS-SOFT',
      type: 'ofis-soft',
      color: '#0284C7', // Sky / Cyan
      icon: 'Building2',
      isDefault: true,
    },
    {
      id: 'kay-soft',
      name: 'KAY-SOFT',
      type: 'kay-soft',
      color: '#059669', // Emerald
      icon: 'Code2',
      isDefault: false,
    },
    {
      id: 'personal',
      name: 'PERSONAL',
      type: 'personal',
      color: '#2563EB', // Blue
      icon: 'User',
      isDefault: false,
    },
  ];

  for (const ws of defaultWorkspaces) {
    const existing = await db.workspaces.get(ws.id);
    if (!existing) {
      await db.workspaces.put(ws);
    }
  }

  // Pre-seed common exchange rates if none exist
  const ratesCount = await db.exchangeRates.count();
  if (ratesCount === 0) {
    const today = new Date().toISOString().split('T')[0];
    await db.exchangeRates.bulkAdd([
      { id: 'rate-usd-egp', fromCurrency: 'USD', toCurrency: 'EGP', rate: 49.50, rateDate: today, updatedAt: new Date().toISOString() },
      { id: 'rate-egp-usd', fromCurrency: 'EGP', toCurrency: 'USD', rate: 0.0202, rateDate: today, updatedAt: new Date().toISOString() },
      { id: 'rate-eur-egp', fromCurrency: 'EUR', toCurrency: 'EGP', rate: 53.20, rateDate: today, updatedAt: new Date().toISOString() },
      { id: 'rate-egp-eur', fromCurrency: 'EGP', toCurrency: 'EUR', rate: 0.0188, rateDate: today, updatedAt: new Date().toISOString() },
      { id: 'rate-sar-egp', fromCurrency: 'SAR', toCurrency: 'EGP', rate: 13.20, rateDate: today, updatedAt: new Date().toISOString() },
      { id: 'rate-egp-sar', fromCurrency: 'EGP', toCurrency: 'SAR', rate: 0.0758, rateDate: today, updatedAt: new Date().toISOString() },
      { id: 'rate-aed-egp', fromCurrency: 'AED', toCurrency: 'EGP', rate: 13.48, rateDate: today, updatedAt: new Date().toISOString() },
      { id: 'rate-egp-aed', fromCurrency: 'EGP', toCurrency: 'AED', rate: 0.0742, rateDate: today, updatedAt: new Date().toISOString() },
    ]);
  }
}
