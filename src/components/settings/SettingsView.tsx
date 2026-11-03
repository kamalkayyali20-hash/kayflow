import React, { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Lock,
  Download,
  Upload,
  Layers,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type { ExchangeRate, Workspace } from '../../types';
import {
  SUPPORTED_CURRENCIES,
  saveExchangeRate,
} from '../../services/currencyService';
import {
  exportAllDataToJSON,
  downloadJSONFile,
  validateBackupJSON,
  restoreFromBackup,
  type BackupValidationSummary,
} from '../../services/backupService';
import { Modal } from '../common/Modal';

export const SettingsView: React.FC = () => {
  const {
    t,
    isRTL,
    language,
    setLanguage,
    theme,
    setTheme,
    reportingCurrency,
    setReportingCurrency,
    workspaces,
    refreshWorkspaces,
    hasPin,
    setPinCode,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'currencies' | 'workspaces' | 'security' | 'backup'>('currencies');

  // Exchange Rates State
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateFrom, setRateFrom] = useState('USD');
  const [rateTo, setRateTo] = useState('EGP');
  const [rateValue, setRateValue] = useState<number>(49.5);

  // Security PIN state
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  // Backup & Restore State
  const [restoreFileSummary, setRestoreFileSummary] = useState<BackupValidationSummary | null>(null);
  const [restoreJSONContent, setRestoreJSONContent] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const loadRates = async () => {
    const list = await db.exchangeRates.toArray();
    setRates(list);
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateFrom === rateTo || rateValue <= 0) return;
    await saveExchangeRate(rateFrom, rateTo, Number(rateValue));
    setIsRateModalOpen(false);
    loadRates();
  };

  const handleDeleteRate = async (id: string) => {
    await db.exchangeRates.delete(id);
    loadRates();
  };

  const handleSetNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4) {
      setPinMessage(isRTL ? 'يجب أن يتكون رمز المرور من 4 أرقام على الأقل' : 'PIN must be at least 4 digits');
      return;
    }
    if (pinInput !== confirmPinInput) {
      setPinMessage(isRTL ? 'الرمزان غير متطابقين' : 'PINs do not match');
      return;
    }
    setPinCode(pinInput);
    setPinInput('');
    setConfirmPinInput('');
    setPinMessage(isRTL ? 'تم تفعيل قفل التطبيق بنجاح' : 'App lock PIN enabled successfully');
  };

  const handleRemovePin = () => {
    setPinCode(null);
    setPinMessage(isRTL ? 'تم إلغاء قفل التطبيق' : 'App lock removed');
  };

  const handleExportBackup = async () => {
    const json = await exportAllDataToJSON();
    const dateStr = new Date().toISOString().split('T')[0];
    downloadJSONFile(json, `kayflow_backup_${dateStr}.json`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    setRestoreFileSummary(null);
    setRestoreJSONContent(null);
    setRestoreSuccess(false);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const val = validateBackupJSON(content);
      if (val.error) {
        setRestoreError(val.error);
      } else if (val.summary) {
        setRestoreFileSummary(val.summary);
        setRestoreJSONContent(content);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!restoreJSONContent) return;
    try {
      await restoreFromBackup(restoreJSONContent, 'replace');
      setRestoreSuccess(true);
      setRestoreFileSummary(null);
      setRestoreJSONContent(null);
      refreshWorkspaces();
    } catch (err: any) {
      setRestoreError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t.navSettings}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isRTL
            ? 'تكوين أسعار الصرف، العملة المعتمدة، النسخ الاحتياطي، وإعدادات الأمان المحلي.'
            : 'Multi-currency rates, local app lock, workspaces, and full JSON backup & restore.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('currencies')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'currencies'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t.navCurrencies}
        </button>
        <button
          onClick={() => setActiveTab('workspaces')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'workspaces'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t.navWorkspaces}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'security'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t.navSecurity}
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'backup'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t.navBackup}
        </button>
      </div>

      {/* Currencies & Rates Tab */}
      {activeTab === 'currencies' && (
        <div className="space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t.reportingCurrency}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isRTL
                ? 'العملة الأساسية المستخدمة في توحيد حسابات صافي الثروة والتقارير المالية. يدعم النظام الجنيه المصري (EGP) وكافة العملات الرئيسية.'
                : 'Primary currency for consolidated net worth, cash flow surplus, and reports. Supports EGP, USD, EUR, SAR, and more.'}
            </p>
            <div className="w-64">
              <select
                value={reportingCurrency}
                onChange={(e) => setReportingCurrency(e.target.value)}
                className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({isRTL ? c.nameAr : c.nameEn})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t.exchangeRates}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRTL
                    ? 'يتم التحويل بدقة بناءً على الأسعار المدخلة وتاريخها دون تخمين ضمني.'
                    : 'Explicit conversion rates. No currency conversion is guessed without user rate.'}
                </p>
              </div>

              <button
                onClick={() => setIsRateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addRate}</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {rates.map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    1 {r.fromCurrency} = <span className="font-mono text-blue-600">{r.rate}</span> {r.toCurrency}
                    <span className="text-[10px] text-slate-400 font-normal ml-2">
                      ({r.rateDate})
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteRate(r.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Workspaces Tab */}
      {activeTab === 'workspaces' && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t.navWorkspaces}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isRTL
              ? 'فصل تام بين مساحة الأعمال (KAY-SOFT) والمساحة الشخصية لضمان عدم خلط أرباح الشركة بالمصروفات اليومية.'
              : 'Strict separation of personal funds and business software company accounts.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: ws.color || '#2563EB' }}
                >
                  {(ws.type === 'business' || ws.type === 'kay-soft' || ws.type === 'ofis-soft') ? <Briefcase className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{ws.name}</h4>
                  <span className="text-xs text-slate-400 capitalize">{ws.type} Workspace</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4 max-w-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isRTL ? 'قفل التطبيق برمز مرور (PIN)' : 'Local App Lock (PIN)'}
              </h3>
              <p className="text-xs text-slate-500">
                {isRTL
                  ? 'حماية خصوصية بياناتك المالية محلياً على هذا الجهاز.'
                  : 'Protect your financial records with a local device passcode.'}
              </p>
            </div>
          </div>

          {pinMessage && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs">
              {pinMessage}
            </div>
          )}

          {hasPin ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRTL ? 'قفل التطبيق مفعل حالياً' : 'App Lock is currently ACTIVE'}</span>
              </div>
              <button
                onClick={handleRemovePin}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
              >
                {isRTL ? 'إلغاء رمز المرور والقفل' : 'Disable App Lock'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSetNewPin} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'رمز المرور الجديد (4-8 أرقام)' : 'New PIN (4-8 digits)'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'تأكيد رمز المرور' : 'Confirm PIN'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  required
                  maxLength={8}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
              >
                {isRTL ? 'حفظ وتفعيل القفل' : 'Enable App Lock'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              {isRTL
                ? 'لا يتم إرسال أي بيانات أو أرقام إلى خوادم سحابية. يعمل التطبيق بدون اتصال كلياً.'
                : 'Zero telemetry. All data is persisted securely in browser IndexedDB.'}
            </span>
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6 max-w-xl">
          {/* Export Panel */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-500" />
              <span>{isRTL ? 'تصدير نسخة احتياطية كاملة' : 'Export Full JSON Backup'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isRTL
                ? 'تصدير ملف JSON يحتوي على كافة الحسابات والمعاملات والمشاريع والأرباح والديون والتصنيفات بدقة.'
                : 'Download all financial ledgers, salary history, projects, and custom categories into a validated JSON archive.'}
            </p>
            <button
              onClick={handleExportBackup}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
            >
              {isRTL ? 'تحميل ملف النسخة الاحتياطية' : 'Download Backup Archive (.json)'}
            </button>
          </div>

          {/* Restore Panel */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>{isRTL ? 'استعادة نسخة احتياطية' : 'Restore From Backup'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isRTL
                ? 'استعادة بياناتك السابقة مع التحقق الصارم من صحة الملف قبل الاستبدال.'
                : 'Upload a validated KAYFLOW JSON file to restore your database.'}
            </p>

            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 cursor-pointer"
            />

            {restoreError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}

            {restoreSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {isRTL
                    ? 'تم استعادة النسخة الاحتياطية بنجاح وتحديث كافة السجلات.'
                    : 'Backup restored successfully! All records updated.'}
                </span>
              </div>
            )}

            {restoreFileSummary && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 text-xs space-y-3">
                <div className="font-bold text-blue-900 dark:text-blue-200">
                  {isRTL ? 'ملخص محتويات النسخة:' : 'Validated Archive Summary:'}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-mono">
                  <div>Accounts: {restoreFileSummary.counts.accounts}</div>
                  <div>Transactions: {restoreFileSummary.counts.transactions}</div>
                  <div>Projects: {restoreFileSummary.counts.projects}</div>
                  <div>Debts: {restoreFileSummary.counts.debts}</div>
                  <div>Salaries: {restoreFileSummary.counts.salaries}</div>
                  <div>Categories: {restoreFileSummary.counts.categories}</div>
                </div>

                <div className="pt-2 border-t border-blue-200 dark:border-blue-800 flex items-center justify-end gap-2">
                  <button
                    onClick={handleConfirmRestore}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    {isRTL ? 'تأكيد واستبدال البيانات' : 'Confirm & Restore'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Rate Modal */}
      <Modal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        title={t.addRate}
      >
        <form onSubmit={handleSaveRate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'من عملة' : 'From Currency'}
              </label>
              <select
                value={rateFrom}
                onChange={(e) => setRateFrom(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'إلى عملة' : 'To Currency'}
              </label>
              <select
                value={rateTo}
                onChange={(e) => setRateTo(e.target.value)}
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

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'سعر الصرف (1 وحدة من العملة الأولى = كم من الثانية؟)' : 'Exchange Rate Value'}
            </label>
            <input
              type="number"
              step="any"
              min="0.0001"
              required
              value={rateValue}
              onChange={(e) => setRateValue(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-mono py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRateModalOpen(false)}
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
    </div>
  );
};
