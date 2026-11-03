import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  ArrowLeftRight,
  Building,
  CreditCard,
  Smartphone,
  Banknote,
  Briefcase,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type { FinancialAccount, AccountType } from '../../types';
import {
  calculateAccountBalance,
  calculateAllAccountBalances,
  type AccountBalanceResult,
} from '../../services/accountingEngine';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../../services/currencyService';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

const ACCOUNT_TYPE_ICONS: Record<AccountType, any> = {
  cash: Banknote,
  bank: Building,
  mobile_wallet: Smartphone,
  savings: Wallet,
  credit_card: CreditCard,
  business: Briefcase,
  other: Wallet,
};

export const AccountsView: React.FC = () => {
  const { t, isRTL, reportingCurrency, activeWorkspaceId } = useApp();

  const [accountBalances, setAccountBalances] = useState<AccountBalanceResult[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // New Account Form
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [currency, setCurrency] = useState(reportingCurrency);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [scope, setScope] = useState<'personal' | 'business'>('personal');
  const [accountNumber, setAccountNumber] = useState('');
  const [institution, setInstitution] = useState('');
  const [notes, setNotes] = useState('');

  // Transfer Form
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferDesc, setTransferDesc] = useState('');

  const loadAccounts = async () => {
    const scopeFilter =
      activeWorkspaceId === 'ws-business'
        ? 'business'
        : activeWorkspaceId === 'ws-personal'
        ? 'personal'
        : undefined;

    const balances = await calculateAllAccountBalances(scopeFilter);
    setAccountBalances(balances);
  };

  useEffect(() => {
    loadAccounts();
  }, [activeWorkspaceId]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    const newAcc: FinancialAccount = {
      id: `acc-${Date.now()}`,
      name: name.trim(),
      type,
      currency,
      openingBalance: Number(openingBalance) || 0,
      openingBalanceDate: today,
      workspaceScope: scope,
      accountNumber: accountNumber.trim() || undefined,
      institution: institution.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await db.accounts.add(newAcc);
    setIsAccountModalOpen(false);
    setName('');
    setOpeningBalance(0);
    loadAccounts();
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId || transferAmount <= 0) return;

    const fromAcc = accountBalances.find((b) => b.account.id === fromAccountId)?.account;
    if (!fromAcc) return;

    // Non-income, non-expense balanced transfer transaction!
    await db.transactions.add({
      id: `tx-xfer-${Date.now()}`,
      date: transferDate,
      amount: Number(transferAmount),
      currency: fromAcc.currency,
      type: 'transfer',
      fromAccountId,
      toAccountId,
      description: transferDesc.trim() || `Transfer from ${fromAcc.name}`,
      createdAt: new Date().toISOString(),
    });

    setIsTransferModalOpen(false);
    setTransferAmount(0);
    setTransferDesc('');
    loadAccounts();
  };

  const personalBalances = accountBalances.filter((b) => b.account.workspaceScope === 'personal');
  const businessBalances = accountBalances.filter((b) => b.account.workspaceScope === 'business');

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.accountsTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? 'إدارة الحسابات البنكية، الكاش، المحافظ الإلكترونية، مع الفصل المحاسبي بين الحسابات الشخصية والتجارية.'
              : 'Cash balances, bank accounts, mobile wallets, and strictly isolated business accounts.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {accountBalances.length > 1 && (
            <button
              onClick={() => {
                setFromAccountId(accountBalances[0]?.account.id || '');
                setToAccountId(accountBalances[1]?.account.id || '');
                setIsTransferModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
            >
              <ArrowLeftRight className="w-4 h-4 text-blue-500" />
              <span>{t.transferMoney}</span>
            </button>
          )}

          <button
            onClick={() => {
              setName('');
              setOpeningBalance(0);
              setIsAccountModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addAccount}</span>
          </button>
        </div>
      </div>

      {accountBalances.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={isRTL ? 'لا توجد حسابات أو محافظ مضافة' : 'No financial accounts registered yet'}
          description={
            isRTL
              ? 'أضف حسابك البنكي أو المحفظة الإلكترونية (فودافون كاش، محفظة بنكية) أو النقد لبدء تسجيل المعاملات.'
              : 'Add your cash wallet, bank checking, or mobile money account to track liquidity and balances.'
          }
          primaryActionLabel={t.addAccount}
          onPrimaryAction={() => setIsAccountModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Personal Accounts */}
          {personalBalances.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isRTL ? 'الحسابات والمحافظ الشخصية' : 'Personal Accounts & Wallets'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalBalances.map((b) => {
                  const Icon = ACCOUNT_TYPE_ICONS[b.account.type] || Wallet;
                  return (
                    <div
                      key={b.account.id}
                      className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {b.account.name}
                            </h3>
                            <span className="text-[11px] text-slate-400 capitalize">
                              {b.account.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block mb-0.5">
                          {t.currentBalance}
                        </span>
                        <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                          {formatCurrency(b.currentBalance, b.account.currency)}
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono">
                        <span>
                          {isRTL ? 'إيداعات' : 'In'}: +{formatCurrency(b.totalInflows, b.account.currency)}
                        </span>
                        <span>
                          {isRTL ? 'مسحوبات' : 'Out'}: -{formatCurrency(b.totalOutflows, b.account.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Business Accounts */}
          {businessBalances.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isRTL ? 'حسابات ومحافظ الأعمال التجارية (مفصولة تماماً)' : 'Business Accounts (Isolated)'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessBalances.map((b) => {
                  const Icon = ACCOUNT_TYPE_ICONS[b.account.type] || Briefcase;
                  return (
                    <div
                      key={b.account.id}
                      className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {b.account.name}
                            </h3>
                            <span className="text-[11px] text-slate-400 capitalize">
                              {b.account.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block mb-0.5">
                          {t.currentBalance}
                        </span>
                        <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(b.currentBalance, b.account.currency)}
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono">
                        <span>
                          {isRTL ? 'إيداعات' : 'In'}: +{formatCurrency(b.totalInflows, b.account.currency)}
                        </span>
                        <span>
                          {isRTL ? 'مسحوبات' : 'Out'}: -{formatCurrency(b.totalOutflows, b.account.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Account Modal */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title={t.addAccount}
      >
        <form onSubmit={handleSaveAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.accountName} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CIB Bank Account, Vodafone Cash, Cash Safe"
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.accountType}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="cash">{t.cash}</option>
                <option value="bank">{t.bank}</option>
                <option value="mobile_wallet">{t.mobileWallet}</option>
                <option value="savings">{t.savings}</option>
                <option value="credit_card">{t.creditCard}</option>
                <option value="business">{t.businessAccount}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.currency}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.openingBalance}
              </label>
              <input
                type="number"
                step="any"
                value={openingBalance || ''}
                onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.scope}
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="personal">{t.personalWorkspace}</option>
                <option value="business">{t.businessWorkspace}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(false)}
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

      {/* Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={t.transferMoney}
      >
        <form onSubmit={handleExecuteTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.fromAccount} *
              </label>
              <select
                required
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {accountBalances.map((b) => (
                  <option key={b.account.id} value={b.account.id}>
                    {b.account.name} ({b.account.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.toAccount} *
              </label>
              <select
                required
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {accountBalances.map((b) => (
                  <option key={b.account.id} value={b.account.id}>
                    {b.account.name} ({b.account.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.amount} *
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={transferAmount || ''}
              onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full text-xl font-bold font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-xs"
            >
              {isRTL ? 'تنفيذ التحويل' : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
