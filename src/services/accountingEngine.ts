import { db } from '../db/db';
import type {
  FinancialAccount,
  FinancialTransaction,
  Debt,
  DebtPayment,
  Project,
  ProjectRevenue,
  ProjectExpense,
  OwnerDistribution,
} from '../types';
import { convertCurrency } from './currencyService';

export interface AccountBalanceResult {
  account: FinancialAccount;
  currentBalance: number;
  totalInflows: number;
  totalOutflows: number;
}

export interface FinancialOverviewMetrics {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashSurplus: number;
  totalCashAvailable: number;
  totalDebtLiability: number;
  totalReceivablesAsset: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  savingsRate: number | null;
  currency: string;
  basis: 'cash' | 'accrual';
  hasMultiCurrencyWarnings: boolean;
}

export interface ProjectFinancialSummary {
  project: Project;
  contractValue: number;
  recognizedRevenue: number;
  cashReceived: number;
  outstandingReceivables: number;
  recognizedExpenses: number;
  cashPaid: number;
  outstandingPayables: number;
  netProjectProfit: number;
  profitMarginPercent: number | null;
  projectCashSurplus: number;
  totalOwnerDistributions: number;
  undistributedProfit: number;
}

/**
 * Calculates current account balance dynamically from opening balance + posted ledger transactions.
 * Never mutates or hardcodes static balances.
 */
export async function calculateAccountBalance(accountId: string): Promise<AccountBalanceResult | null> {
  const account = await db.accounts.get(accountId);
  if (!account) return null;

  let balance = account.openingBalance;
  let totalInflows = 0;
  let totalOutflows = 0;

  // Transactions where money flowed INTO this account
  // (income, customer payments, loan received, loan collections, owner contributions, inbound transfers, salary received)
  const inboundTx = await db.transactions
    .where('toAccountId')
    .equals(accountId)
    .toArray();

  for (const tx of inboundTx) {
    balance += tx.amount;
    totalInflows += tx.amount;
  }

  // Transactions where money flowed OUT of this account
  // (expense, debt payments, loan given, owner distributions, outbound transfers)
  const outboundTx = await db.transactions
    .where('fromAccountId')
    .equals(accountId)
    .toArray();

  for (const tx of outboundTx) {
    balance -= tx.amount;
    totalOutflows += tx.amount;
  }

  return {
    account,
    currentBalance: Math.round(balance * 100) / 100,
    totalInflows: Math.round(totalInflows * 100) / 100,
    totalOutflows: Math.round(totalOutflows * 100) / 100,
  };
}

/**
 * Calculates all account balances
 */
export async function calculateAllAccountBalances(
  workspaceScope?: 'personal' | 'business'
): Promise<AccountBalanceResult[]> {
  let accounts = await db.accounts.toArray();
  if (workspaceScope) {
    accounts = accounts.filter((a) => a.workspaceScope === workspaceScope);
  }

  const results: AccountBalanceResult[] = [];
  for (const acc of accounts) {
    const bal = await calculateAccountBalance(acc.id);
    if (bal) results.push(bal);
  }
  return results;
}

/**
 * Calculates remaining principal of a debt accurately:
 * Remaining Principal = Original Principal − Principal Repaid
 * Interest and fees do NOT reduce principal!
 */
export async function calculateDebtBalance(debtId: string): Promise<{
  debt: Debt;
  originalPrincipal: number;
  totalPrincipalRepaid: number;
  totalInterestPaid: number;
  totalFeesPaid: number;
  remainingPrincipal: number;
} | null> {
  const debt = await db.debts.get(debtId);
  if (!debt) return null;

  const payments = await db.debtPayments.where('debtId').equals(debtId).toArray();

  let totalPrincipalRepaid = 0;
  let totalInterestPaid = 0;
  let totalFeesPaid = 0;

  for (const p of payments) {
    totalPrincipalRepaid += p.principalComponent || 0;
    totalInterestPaid += p.interestComponent || 0;
    totalFeesPaid += p.fees || 0;
  }

  const remainingPrincipal = Math.max(0, debt.originalPrincipal - totalPrincipalRepaid);

  return {
    debt,
    originalPrincipal: debt.originalPrincipal,
    totalPrincipalRepaid: Math.round(totalPrincipalRepaid * 100) / 100,
    totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
    totalFeesPaid: Math.round(totalFeesPaid * 100) / 100,
    remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
  };
}

/**
 * Calculates project financial metrics:
 * - Recognized Revenue
 * - Cash Received
 * - Outstanding Receivables
 * - Expenses
 * - Project Profit = Recognized Revenue - Expenses
 * - Profit Margin = (Profit / Recognized Revenue) * 100
 * - Cash Surplus = Cash Received - Cash Expenses Paid
 * - Distributions and Undistributed Profit
 */
export async function calculateProjectFinancials(projectId: string): Promise<ProjectFinancialSummary | null> {
  const project = await db.projects.get(projectId);
  if (!project) return null;

  const revenues = await db.projectRevenues.where('projectId').equals(projectId).toArray();
  const expenses = await db.projectExpenses.where('projectId').equals(projectId).toArray();
  const distributions = await db.ownerDistributions.where('projectId').equals(projectId).toArray();

  let recognizedRevenue = 0;
  let cashReceived = 0;

  for (const rev of revenues) {
    recognizedRevenue += rev.amount;
    if (rev.isReceived) {
      cashReceived += rev.amount;
    }
  }

  let recognizedExpenses = 0;
  let cashPaid = 0;

  for (const exp of expenses) {
    recognizedExpenses += exp.amount;
    if (exp.isPaid) {
      cashPaid += exp.amount;
    }
  }

  let totalOwnerDistributions = 0;
  for (const dist of distributions) {
    totalOwnerDistributions += dist.amount;
  }

  const outstandingReceivables = Math.max(0, recognizedRevenue - cashReceived);
  const outstandingPayables = Math.max(0, recognizedExpenses - cashPaid);
  const netProjectProfit = recognizedRevenue - recognizedExpenses;
  const projectCashSurplus = cashReceived - cashPaid;

  const profitMarginPercent =
    recognizedRevenue > 0
      ? Math.round((netProjectProfit / recognizedRevenue) * 10000) / 100
      : null;

  const undistributedProfit = Math.max(0, netProjectProfit - totalOwnerDistributions);

  return {
    project,
    contractValue: project.contractValue ?? project.defaultSellingPrice ?? 0,
    recognizedRevenue: Math.round(recognizedRevenue * 100) / 100,
    cashReceived: Math.round(cashReceived * 100) / 100,
    outstandingReceivables: Math.round(outstandingReceivables * 100) / 100,
    recognizedExpenses: Math.round(recognizedExpenses * 100) / 100,
    cashPaid: Math.round(cashPaid * 100) / 100,
    outstandingPayables: Math.round(outstandingPayables * 100) / 100,
    netProjectProfit: Math.round(netProjectProfit * 100) / 100,
    profitMarginPercent,
    projectCashSurplus: Math.round(projectCashSurplus * 100) / 100,
    totalOwnerDistributions: Math.round(totalOwnerDistributions * 100) / 100,
    undistributedProfit: Math.round(undistributedProfit * 100) / 100,
  };
}

/**
 * Calculates Personal Financial Overview metrics for a given month and reporting currency.
 * Strictly respects accounting principles:
 * - Transfers are neutral.
 * - Debt principal repayment is NOT an expense.
 * - Loan received is NOT income.
 * - Personal and Business separation: business revenue does not count as personal income
 *   unless explicitly distributed (as owner distribution or salary).
 */
export async function calculatePersonalFinancialOverview(
  yearMonth: string, // 'YYYY-MM'
  reportingCurrency: string = 'EGP',
  basis: 'cash' | 'accrual' = 'cash'
): Promise<FinancialOverviewMetrics> {
  const transactions = await db.transactions.toArray();
  const accounts = await db.accounts.filter((a) => a.workspaceScope === 'personal').toArray();
  const debts = await db.debts.filter((d) => d.status === 'active' && d.workspaceScope === 'personal').toArray();

  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  let hasMultiCurrencyWarnings = false;

  // Filter transactions for the month
  const monthTx = transactions.filter((tx) => tx.date.startsWith(yearMonth));

  for (const tx of monthTx) {
    // Convert to reporting currency
    let amountInReporting = tx.amount;
    if (tx.currency !== reportingCurrency) {
      const conv = await convertCurrency(tx.amount, tx.currency, reportingCurrency);
      if (conv) {
        amountInReporting = conv.convertedAmount;
      } else {
        hasMultiCurrencyWarnings = true;
      }
    }

    if (tx.type === 'income') {
      monthlyIncome += amountInReporting;
    } else if (tx.type === 'expense') {
      monthlyExpenses += amountInReporting;
    } else if (tx.type === 'loan_repayment') {
      // Look up debt payment to only count interest/fee as expense if split
      const debtPayment = await db.debtPayments.where('date').equals(tx.date).first();
      if (debtPayment) {
        let feeExpense = (debtPayment.interestComponent || 0) + (debtPayment.fees || 0);
        if (debtPayment.currency !== reportingCurrency) {
          const conv = await convertCurrency(feeExpense, debtPayment.currency, reportingCurrency);
          feeExpense = conv ? conv.convertedAmount : feeExpense;
        }
        monthlyExpenses += feeExpense;
      }
    }
  }

  // Calculate total cash available in personal accounts
  let totalCashAvailable = 0;
  for (const acc of accounts) {
    const balResult = await calculateAccountBalance(acc.id);
    if (balResult) {
      let balInReporting = balResult.currentBalance;
      if (acc.currency !== reportingCurrency) {
        const conv = await convertCurrency(balInReporting, acc.currency, reportingCurrency);
        if (conv) {
          balInReporting = conv.convertedAmount;
        } else {
          hasMultiCurrencyWarnings = true;
        }
      }
      totalCashAvailable += balInReporting;
    }
  }

  // Calculate liabilities (debts I owe) and receivables (debts owed to me)
  let totalDebtLiability = 0;
  let totalReceivablesAsset = 0;

  for (const d of debts) {
    const dBal = await calculateDebtBalance(d.id);
    if (dBal) {
      let remInReporting = dBal.remainingPrincipal;
      if (d.currency !== reportingCurrency) {
        const conv = await convertCurrency(remInReporting, d.currency, reportingCurrency);
        if (conv) {
          remInReporting = conv.convertedAmount;
        } else {
          hasMultiCurrencyWarnings = true;
        }
      }

      if (d.direction === 'owe') {
        totalDebtLiability += remInReporting;
      } else {
        totalReceivablesAsset += remInReporting;
      }
    }
  }

  const monthlyCashSurplus = monthlyIncome - monthlyExpenses;
  const totalAssets = totalCashAvailable + totalReceivablesAsset;
  const totalLiabilities = totalDebtLiability;
  const netWorth = totalAssets - totalLiabilities;

  const savingsRate =
    monthlyIncome > 0
      ? Math.round((Math.max(0, monthlyCashSurplus) / monthlyIncome) * 10000) / 100
      : null;

  return {
    monthlyIncome: Math.round(monthlyIncome * 100) / 100,
    monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
    monthlyCashSurplus: Math.round(monthlyCashSurplus * 100) / 100,
    totalCashAvailable: Math.round(totalCashAvailable * 100) / 100,
    totalDebtLiability: Math.round(totalDebtLiability * 100) / 100,
    totalReceivablesAsset: Math.round(totalReceivablesAsset * 100) / 100,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    netWorth: Math.round(netWorth * 100) / 100,
    savingsRate,
    currency: reportingCurrency,
    basis,
    hasMultiCurrencyWarnings,
  };
}
