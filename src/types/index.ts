export type WorkspaceType = 'ofis-soft' | 'kay-soft' | 'personal' | 'business' | 'shared';

export interface Workspace {
  id: string; // 'ofis-soft' | 'kay-soft' | 'personal' or custom
  name: string;
  type: WorkspaceType;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

// -------------------------------------------------------------
// OFIS-SOFT Entities (Account Management)
// -------------------------------------------------------------

export type CompanyStatus = 'active' | 'prospect' | 'lead' | 'dormant' | 'lost' | 'at_risk' | 'inactive';
export type FollowUpFrequency = '7_days' | '14_days' | '30_days' | 'custom';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Company {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  primaryContactName?: string;
  primaryContactRole?: string;
  rating?: number;
  businessActivity?: string;
  industry?: string;
  area?: string;
  city?: string;
  fullAddress?: string;
  googleMapsUrl?: string;
  website?: string;
  status: CompanyStatus;
  accountPriority: PriorityLevel;
  workspaceId: string; // 'ofis-soft'
  lastVisitDate?: string;
  nextFollowUpDate?: string;
  followUpFrequency: FollowUpFrequency;
  customFollowUpDays?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  position?: string;
  role?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  isPrimary?: boolean;
  notes?: string;
  workspaceId?: string;
  createdAt: string;
}

export type ContractType =
  | 'erp_implementation'
  | 'maintenance'
  | 'consulting'
  | 'license'
  | 'custom';

export type ContractStatus = 'active' | 'pending' | 'expired' | 'terminated';

export interface Contract {
  id: string;
  companyId: string;
  contractNumber: string;
  title?: string;
  type?: ContractType;
  billingCycle?: string;
  startDate: string;
  endDate?: string;
  contractValue: number;
  currency: string;
  servicesModules?: string;
  supportAgreement?: string;
  renewalDate?: string;
  status: ContractStatus;
  notes?: string;
  workspaceId?: string;
  createdAt: string;
}

export type InteractionType = 'visit' | 'call' | 'online_meeting' | 'demo' | 'support';

export interface Visit {
  id: string;
  companyId: string;
  contactId?: string;
  date?: string;
  visitDate?: string;
  type: InteractionType;
  purpose: string;
  outcome?: string;
  summary?: string;
  notes?: string;
  nextFollowUpDate?: string;
  completed?: boolean;
  workspaceId?: string;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  dueDate: string;
  priority?: PriorityLevel;
  status: 'pending' | 'completed' | 'overdue';
  completedDate?: string;
  completedAt?: string;
  notes?: string;
  workspaceId?: string;
  createdAt: string;
}

export interface SupportIssue {
  id: string;
  companyId: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reportedDate?: string;
  resolvedDate?: string;
  resolvedAt?: string;
  updatedAt?: string;
  resolutionNotes?: string;
  assignedTo?: string;
  notes?: string;
  workspaceId?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// Productivity (Common to Workspaces)
// -------------------------------------------------------------

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'pending';
  priority: PriorityLevel;
  dueDate?: string;
  workspaceId: string;
  relatedType?: 'company' | 'project' | 'personal';
  relatedId?: string;
  completedDate?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  type?: string;
  workspaceId: string;
  relatedType?: string;
  relatedId?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  isPinned?: boolean;
  workspaceId: string;
  relatedType?: 'company' | 'project' | 'personal';
  relatedId?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// KAY-SOFT Entities (Software Business & Multi-Customer Sales)
// -------------------------------------------------------------

export type ProjectStatus =
  | 'planning'
  | 'proposal'
  | 'approved'
  | 'in_development'
  | 'testing'
  | 'delivered'
  | 'maintenance'
  | 'on_hold'
  | 'cancelled';

export interface Project {
  id: string;
  name: string;
  categoryId?: string;
  workspaceId: string; // 'kay-soft'
  description: string;
  projectType: string; // ERP, Mobile App, Web, SaaS, Custom
  startDate: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  notes?: string;

  // Backward compatibility fields
  client?: string;
  clientContact?: string;
  contractValue?: number;

  // Development Costs
  developmentCost: number;
  monthlyOperatingCost: number;
  hostingCost: number;
  maintenanceCost: number;
  otherExpenses: number;

  // Sales defaults
  defaultSellingPrice: number;
  defaultSetupFee: number;
  defaultMonthlySubscription: number;
  defaultYearlySubscription: number;
  pricingModel: 'subscription' | 'one_time' | 'hybrid' | 'custom';
  currency: string;

  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  code?: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  address?: string;
  status: 'active' | 'prospect' | 'inactive' | 'lead';
  workspaceId?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type SubscriptionStatus = 'trial' | 'active' | 'paused' | 'expired' | 'cancelled';
export type BillingFrequency = 'monthly' | 'yearly' | 'one_time' | 'quarterly' | 'custom';

export interface ProjectSale {
  id: string;
  projectId: string;
  customerId: string;
  contractId?: string;
  sellingPrice?: number;
  setupFee?: number;
  subscriptionAmount?: number;
  billingFrequency: BillingFrequency;
  currency: string;
  startDate?: string;
  saleDate?: string;
  renewalDate?: string;
  endDate?: string;
  status: SubscriptionStatus;
  paymentMethod?: string;
  customTerms?: string;
  notes?: string;
  workspaceId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentType =
  | 'setup_fee'
  | 'monthly_sub'
  | 'yearly_sub'
  | 'subscription'
  | 'custom_dev'
  | 'maintenance'
  | 'additional_service'
  | 'custom';

export type PaymentStatus =
  | 'expected'
  | 'pending'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface CustomerPayment {
  id: string;
  customerId: string;
  projectId: string;
  projectSaleId?: string;
  saleId?: string;
  date?: string;
  paymentDate?: string;
  amount: number;
  currency: string;
  paymentType?: PaymentType;
  type?: string;
  paymentMethod?: string;
  billingPeriod?: string; // YYYY-MM
  status?: PaymentStatus;
  receivedAccountId?: string;
  notes?: string;
  workspaceId?: string;
  createdAt: string;
}

export type ExpenseType = 'project_specific' | 'general_business';
export type AllocationMethod = 'equal' | 'percentage' | 'fixed' | 'unallocated';

export interface BusinessExpense {
  id: string;
  name?: string;
  title?: string;
  amount: number;
  currency: string;
  category: string;
  date?: string;
  expenseDate?: string;
  workspaceId?: string;
  projectId?: string;
  relatedProjectId?: string; // For project-specific
  expenseType?: ExpenseType;
  allocationMethod?: AllocationMethod;
  recurrence?: 'none' | 'monthly' | 'quarterly' | 'yearly';
  paymentStatus?: 'paid' | 'pending';
  paymentAccountId?: string;
  allocations?: { projectId: string; amount: number }[];
  notes?: string;
  createdAt?: string;
}

export interface Partner {
  id: string;
  name: string;
  ownershipPercentage?: number;
  profitSharingPercentage?: number;
  sharePercentage?: number;
  role?: string;
  isSelf?: boolean;
  effectiveDate?: string;
  notes?: string;
  workspaceId?: string;
  createdAt: string;
}

export interface PartnerDistribution {
  id: string;
  partnerId: string;
  partnerName?: string;
  projectId?: string;
  date: string;
  amount: number;
  currency: string;
  paymentAccountId?: string;
  status?: 'allocated' | 'paid';
  linkedPersonalTxId?: string; // Links to personal finance income transaction!
  workspaceId?: string;
  notes?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// Legacy & Compatibility Project Financial Entities
// -------------------------------------------------------------

export type ProjectRevenueType =
  | 'one_time'
  | 'installment'
  | 'recurring_subscription'
  | 'maintenance_fee'
  | 'additional_service'
  | 'custom';

export interface ProjectRevenue {
  id: string;
  projectId: string;
  date: string;
  amount: number;
  currency: string;
  revenueType: ProjectRevenueType;
  description: string;
  invoiceNumber?: string;
  receivedAccountId?: string;
  isReceived: boolean;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
}

export interface ProjectExpense {
  id: string;
  projectId: string;
  date: string;
  amount: number;
  currency: string;
  categoryId?: string;
  description: string;
  paymentAccountId?: string;
  isPaid: boolean;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

export interface ProjectParticipant {
  id: string;
  projectId: string;
  name: string;
  role: string;
  profitSharePercentage: number;
  notes?: string;
  createdAt: string;
}

export interface ProfitAllocation {
  id: string;
  projectId: string;
  participantId: string;
  date: string;
  profitShareAmount: number;
  currency: string;
  notes?: string;
  createdAt: string;
}

export interface OwnerDistribution {
  id: string;
  projectId: string;
  participantId: string;
  participantName: string;
  date: string;
  amount: number;
  currency: string;
  paymentAccountId?: string;
  workspaceId?: string;
  notes?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// Categories & Accounts
// -------------------------------------------------------------

export type CategoryType =
  | 'company'
  | 'project'
  | 'task'
  | 'expense'
  | 'income'
  | 'debt'
  | 'contract'
  | 'contact'
  | 'note'
  | 'activity'
  | 'transaction';

export interface CustomCategory {
  id: string;
  name: string;
  description?: string;
  type: CategoryType;
  workspaceId?: string; // empty means global
  icon?: string;
  color?: string;
  parentId?: string | null;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type AccountType =
  | 'cash'
  | 'bank'
  | 'mobile_wallet'
  | 'savings'
  | 'credit_card'
  | 'business'
  | 'other';

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number;
  openingBalanceDate: string;
  workspaceScope: 'personal' | 'business';
  workspaceId?: string;
  accountNumber?: string;
  institution?: string;
  notes?: string;
  isArchived?: boolean;
  createdAt: string;
}

export type TransactionType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'loan_received'
  | 'loan_repayment'
  | 'loan_given'
  | 'loan_collection'
  | 'owner_contribution'
  | 'owner_distribution'
  | 'invoice'
  | 'customer_payment'
  | 'refund'
  | 'adjustment';

export interface FinancialTransaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  type: TransactionType;
  categoryId?: string;
  workspaceId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  relatedProjectId?: string;
  relatedCompany?: string;
  linkedTransferId?: string; // Connected partner distribution ID
  description: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  attachment?: string;
  notes?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  transactionId?: string;
  date: string;
  description: string;
  reference?: string;
  lines: JournalLine[];
  createdAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debit: number;
  credit: number;
  currency: string;
  description?: string;
}

export interface SalaryAgreement {
  id: string;
  employer: string;
  workspaceId?: string;
  baseSalary: number;
  currency: string;
  paymentFrequency: 'monthly' | 'bi-weekly' | 'weekly';
  expectedPaymentDay: number;
  effectiveStartDate: string;
  effectiveEndDate?: string;
  bonuses: number;
  commissions: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentStatus: 'active' | 'paused' | 'terminated';
  notes?: string;
  createdAt: string;
}

export interface SalaryPayment {
  id: string;
  salaryAgreementId: string;
  employer: string;
  date: string;
  monthYear: string;
  baseSalary: number;
  bonuses: number;
  commissions: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  currency: string;
  receivedAccountId: string;
  status: 'received' | 'pending';
  notes?: string;
  createdAt: string;
}

export type DebtType =
  | 'personal_loan'
  | 'bank_loan'
  | 'credit_card'
  | 'installment_purchase'
  | 'money_borrowed'
  | 'money_lent'
  | 'business_loan'
  | 'custom';

export type DebtDirection = 'owe' | 'owed';

export interface Debt {
  id: string;
  name: string;
  debtType: DebtType;
  direction: DebtDirection;
  creditorDebtor: string;
  originalPrincipal: number;
  currency: string;
  startDate: string;
  interestRate: number;
  interestCalculationMethod: 'fixed' | 'reducing_balance' | 'simple' | 'none';
  paymentFrequency: 'monthly' | 'quarterly' | 'yearly' | 'custom' | 'lump_sum';
  installmentAmount: number;
  nextPaymentDate: string;
  maturityDate?: string;
  status: 'active' | 'paid_off' | 'defaulted' | 'forgiven';
  workspaceScope: 'personal' | 'business';
  workspaceId?: string;
  notes?: string;
  reminderDaysBefore?: number[];
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  date: string;
  totalAmount: number;
  principalComponent: number;
  interestComponent: number;
  fees: number;
  currency: string;
  paymentAccountId: string;
  notes?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  name: string;
  workspaceId?: string;
  categoryId: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  budgetAmount: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAllocatedAmount: number;
  currency: string;
  targetDate: string;
  categoryId?: string;
  priority: 'low' | 'medium' | 'high';
  workspaceScope: 'personal' | 'business';
  notes?: string;
  createdAt: string;
}

export interface GoalAllocation {
  id: string;
  goalId: string;
  date: string;
  amount: number;
  currency: string;
  fromAccountId: string;
  notes?: string;
  createdAt: string;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateDate: string;
  updatedAt: string;
}

export type ReminderType =
  | 'salary_expected'
  | 'debt_installment'
  | 'contract_payment'
  | 'invoice_due'
  | 'subscription_renewal'
  | 'recurring_expense'
  | 'budget_review'
  | 'savings_goal'
  | 'followup_due';

export interface FinancialReminder {
  id: string;
  title: string;
  reminderType: ReminderType;
  dueDate: string;
  amount?: number;
  currency?: string;
  relatedEntityId?: string;
  isCompleted: boolean;
  completedDate?: string;
  workspaceId?: string;
  notes?: string;
  createdAt: string;
}
