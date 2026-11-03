import { db } from '../db/db';

export interface BackupData {
  version: number;
  exportedAt: string;
  app: string;
  workspaces: any[];
  categories: any[];
  accounts: any[];
  transactions: any[];
  journalEntries: any[];
  salaryAgreements: any[];
  salaryPayments: any[];
  debts: any[];
  debtPayments: any[];
  budgets: any[];
  goals: any[];
  goalAllocations: any[];
  projects: any[];
  projectRevenues: any[];
  projectExpenses: any[];
  projectParticipants: any[];
  profitAllocations: any[];
  ownerDistributions: any[];
  exchangeRates: any[];
  reminders: any[];
}

export async function exportAllDataToJSON(): Promise<string> {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'KAYFLOW',
    workspaces: await db.workspaces.toArray(),
    categories: await db.categories.toArray(),
    accounts: await db.accounts.toArray(),
    transactions: await db.transactions.toArray(),
    journalEntries: await db.journalEntries.toArray(),
    salaryAgreements: await db.salaryAgreements.toArray(),
    salaryPayments: await db.salaryPayments.toArray(),
    debts: await db.debts.toArray(),
    debtPayments: await db.debtPayments.toArray(),
    budgets: await db.budgets.toArray(),
    goals: await db.goals.toArray(),
    goalAllocations: await db.goalAllocations.toArray(),
    projects: await db.projects.toArray(),
    projectRevenues: await db.projectRevenues.toArray(),
    projectExpenses: await db.projectExpenses.toArray(),
    projectParticipants: await db.projectParticipants.toArray(),
    profitAllocations: await db.profitAllocations.toArray(),
    ownerDistributions: await db.ownerDistributions.toArray(),
    exchangeRates: await db.exchangeRates.toArray(),
    reminders: await db.reminders.toArray(),
  };

  return JSON.stringify(backup, null, 2);
}

export function downloadJSONFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface BackupValidationSummary {
  isValid: boolean;
  version: number;
  exportedAt: string;
  counts: Record<string, number>;
  errorMessage?: string;
}

export function validateBackupJSON(jsonString: string): { summary?: BackupValidationSummary; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { error: 'Invalid JSON format' };
    }
    if (data.app !== 'KAYFLOW' && !data.version) {
      return { error: 'Unrecognized backup file. Not a valid KAYFLOW archive.' };
    }

    const counts: Record<string, number> = {
      accounts: Array.isArray(data.accounts) ? data.accounts.length : 0,
      transactions: Array.isArray(data.transactions) ? data.transactions.length : 0,
      projects: Array.isArray(data.projects) ? data.projects.length : 0,
      debts: Array.isArray(data.debts) ? data.debts.length : 0,
      salaries: Array.isArray(data.salaryAgreements) ? data.salaryAgreements.length : 0,
      categories: Array.isArray(data.categories) ? data.categories.length : 0,
      budgets: Array.isArray(data.budgets) ? data.budgets.length : 0,
      goals: Array.isArray(data.goals) ? data.goals.length : 0,
    };

    return {
      summary: {
        isValid: true,
        version: data.version || 1,
        exportedAt: data.exportedAt || 'Unknown',
        counts,
      },
    };
  } catch (err: any) {
    return { error: `JSON Parse error: ${err.message}` };
  }
}

export async function restoreFromBackup(jsonString: string, mode: 'merge' | 'replace' = 'replace'): Promise<void> {
  const data = JSON.parse(jsonString) as BackupData;

  await db.transaction(
    'rw',
    [
      db.workspaces,
      db.categories,
      db.accounts,
      db.transactions,
      db.journalEntries,
      db.salaryAgreements,
      db.salaryPayments,
      db.debts,
      db.debtPayments,
      db.budgets,
      db.goals,
      db.goalAllocations,
      db.projects,
      db.projectRevenues,
      db.projectExpenses,
      db.projectParticipants,
      db.profitAllocations,
      db.ownerDistributions,
      db.exchangeRates,
      db.reminders,
    ],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.workspaces.clear(),
          db.categories.clear(),
          db.accounts.clear(),
          db.transactions.clear(),
          db.journalEntries.clear(),
          db.salaryAgreements.clear(),
          db.salaryPayments.clear(),
          db.debts.clear(),
          db.debtPayments.clear(),
          db.budgets.clear(),
          db.goals.clear(),
          db.goalAllocations.clear(),
          db.projects.clear(),
          db.projectRevenues.clear(),
          db.projectExpenses.clear(),
          db.projectParticipants.clear(),
          db.profitAllocations.clear(),
          db.ownerDistributions.clear(),
          db.exchangeRates.clear(),
          db.reminders.clear(),
        ]);
      }

      if (data.workspaces?.length) await db.workspaces.bulkPut(data.workspaces);
      if (data.categories?.length) await db.categories.bulkPut(data.categories);
      if (data.accounts?.length) await db.accounts.bulkPut(data.accounts);
      if (data.transactions?.length) await db.transactions.bulkPut(data.transactions);
      if (data.journalEntries?.length) await db.journalEntries.bulkPut(data.journalEntries);
      if (data.salaryAgreements?.length) await db.salaryAgreements.bulkPut(data.salaryAgreements);
      if (data.salaryPayments?.length) await db.salaryPayments.bulkPut(data.salaryPayments);
      if (data.debts?.length) await db.debts.bulkPut(data.debts);
      if (data.debtPayments?.length) await db.debtPayments.bulkPut(data.debtPayments);
      if (data.budgets?.length) await db.budgets.bulkPut(data.budgets);
      if (data.goals?.length) await db.goals.bulkPut(data.goals);
      if (data.goalAllocations?.length) await db.goalAllocations.bulkPut(data.goalAllocations);
      if (data.projects?.length) await db.projects.bulkPut(data.projects);
      if (data.projectRevenues?.length) await db.projectRevenues.bulkPut(data.projectRevenues);
      if (data.projectExpenses?.length) await db.projectExpenses.bulkPut(data.projectExpenses);
      if (data.projectParticipants?.length) await db.projectParticipants.bulkPut(data.projectParticipants);
      if (data.profitAllocations?.length) await db.profitAllocations.bulkPut(data.profitAllocations);
      if (data.ownerDistributions?.length) await db.ownerDistributions.bulkPut(data.ownerDistributions);
      if (data.exchangeRates?.length) await db.exchangeRates.bulkPut(data.exchangeRates);
      if (data.reminders?.length) await db.reminders.bulkPut(data.reminders);
    }
  );
}
