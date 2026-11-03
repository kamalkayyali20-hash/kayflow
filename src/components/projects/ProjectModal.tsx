import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type { Project, ProjectStatus, CustomCategory, PriorityLevel } from '../../types';
import { Modal } from '../common/Modal';
import { SUPPORTED_CURRENCIES } from '../../services/currencyService';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  projectToEdit?: Project | null;
}

const PROJECT_STATUSES: { id: ProjectStatus; labelEn: string; labelAr: string }[] = [
  { id: 'planning', labelEn: 'Planning', labelAr: 'تخطيط' },
  { id: 'proposal', labelEn: 'Proposal', labelAr: 'عرض سعر' },
  { id: 'approved', labelEn: 'Approved', labelAr: 'معتمد' },
  { id: 'in_development', labelEn: 'In Development', labelAr: 'قيد التطوير' },
  { id: 'testing', labelEn: 'Testing', labelAr: 'اختبار وتدقيق' },
  { id: 'delivered', labelEn: 'Delivered', labelAr: 'تم التسليم' },
  { id: 'maintenance', labelEn: 'Maintenance', labelAr: 'صيانة ودعم' },
  { id: 'on_hold', labelEn: 'On Hold', labelAr: 'معلق' },
  { id: 'cancelled', labelEn: 'Cancelled', labelAr: 'ملغي' },
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  projectToEdit,
}) => {
  const { t, isRTL, workspaces, activeWorkspaceId, reportingCurrency } = useApp();

  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('ERP Development');
  const [workspaceId, setWorkspaceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [contractValue, setContractValue] = useState<number>(0);
  const [currency, setCurrency] = useState(reportingCurrency);
  const [status, setStatus] = useState<ProjectStatus>('in_development');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [actualCompletionDate, setActualCompletionDate] = useState('');
  const [notes, setNotes] = useState('');

  const [categories, setCategories] = useState<CustomCategory[]>([]);

  useEffect(() => {
    db.categories.where('type').equals('project').toArray().then(setCategories);
  }, [isOpen]);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setClient(projectToEdit.client || '');
      setClientContact(projectToEdit.clientContact || '');
      setDescription(projectToEdit.description);
      setProjectType(projectToEdit.projectType);
      setWorkspaceId(projectToEdit.workspaceId);
      setCategoryId(projectToEdit.categoryId || '');
      setContractValue(projectToEdit.contractValue || 0);
      setCurrency(projectToEdit.currency);
      setStatus(projectToEdit.status);
      setPriority(projectToEdit.priority);
      setStartDate(projectToEdit.startDate);
      setExpectedCompletionDate(projectToEdit.expectedCompletionDate || '');
      setActualCompletionDate(projectToEdit.actualCompletionDate || '');
      setNotes(projectToEdit.notes || '');
    } else {
      setName('');
      setClient('');
      setClientContact('');
      setDescription('');
      setProjectType('ERP Development');
      // Default to business workspace if available
      const bWs = workspaces.find((w) => (w.type as string) === 'business' || w.type === 'kay-soft');
      setWorkspaceId(bWs ? bWs.id : workspaces[0]?.id || 'kay-soft');
      setCategoryId('');
      setContractValue(0);
      setCurrency(reportingCurrency);
      setStatus('in_development');
      setPriority('medium');
      setStartDate(new Date().toISOString().split('T')[0]);
      setExpectedCompletionDate('');
      setActualCompletionDate('');
      setNotes('');
    }
  }, [projectToEdit, isOpen, workspaces, reportingCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !client.trim()) return;

    const now = new Date().toISOString();

    if (projectToEdit) {
      await db.projects.update(projectToEdit.id, {
        name: name.trim(),
        client: client.trim(),
        clientContact: clientContact.trim(),
        description: description.trim(),
        projectType: projectType.trim(),
        workspaceId,
        categoryId: categoryId || undefined,
        contractValue: Number(contractValue) || 0,
        currency,
        status,
        priority,
        startDate,
        expectedCompletionDate: expectedCompletionDate || undefined,
        actualCompletionDate: actualCompletionDate || undefined,
        notes: notes.trim(),
        updatedAt: now,
      });
    } else {
      const newProject: Project = {
        id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        client: client.trim(),
        clientContact: clientContact.trim(),
        description: description.trim(),
        projectType: projectType.trim(),
        workspaceId,
        categoryId: categoryId || undefined,
        contractValue: Number(contractValue) || 0,
        currency,
        status,
        priority,
        startDate,
        expectedCompletionDate: expectedCompletionDate || undefined,
        actualCompletionDate: actualCompletionDate || undefined,
        notes: notes.trim(),
        developmentCost: 0,
        monthlyOperatingCost: 0,
        hostingCost: 0,
        maintenanceCost: 0,
        otherExpenses: 0,
        defaultSellingPrice: Number(contractValue) || 0,
        defaultSetupFee: 0,
        defaultMonthlySubscription: 0,
        defaultYearlySubscription: 0,
        pricingModel: 'subscription',
        createdAt: now,
        updatedAt: now,
      };
      await db.projects.add(newProject);
    }

    onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? (isRTL ? 'تعديل بيانات المشروع' : 'Edit Project') : (isRTL ? 'إنشاء مشروع جديد (KAY-SOFT)' : 'New Project')}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'اسم المشروع *' : 'Project Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kayflow Enterprise ERP"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'العميل / الجهة *' : 'Client / Customer *'}
            </label>
            <input
              type="text"
              required
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="e.g. Al-Noor Medical Center"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'نوع المشروع' : 'Project Type'}
            </label>
            <input
              type="text"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="e.g. ERP, Mobile, Web"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'قيمة العقد الإجمالية' : 'Contract Value'}
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={contractValue}
              onChange={(e) => setContractValue(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.currency}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({isRTL ? c.nameAr : c.nameEn})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.status}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {PROJECT_STATUSES.map((st) => (
                <option key={st.id} value={st.id}>
                  {isRTL ? st.labelAr : st.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.priority}
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="low">{isRTL ? 'منخفضة' : 'Low'}</option>
              <option value="medium">{isRTL ? 'متوسطة' : 'Medium'}</option>
              <option value="high">{isRTL ? 'عالية / عاجل' : 'High / Urgent'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.workspace}
            </label>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'تاريخ البدء' : 'Start Date'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'الموعد المتوقع للتسليم' : 'Expected Completion'}
            </label>
            <input
              type="date"
              value={expectedCompletionDate}
              onChange={(e) => setExpectedCompletionDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'التسليم الفعلي (اختياري)' : 'Actual Completion'}
            </label>
            <input
              type="date"
              value={actualCompletionDate}
              onChange={(e) => setActualCompletionDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            {isRTL ? 'وصف المشروع ونطاق العمل' : 'Description & Scope'}
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief scope, deliverables, key milestones..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
          >
            {t.save}
          </button>
        </div>
      </form>
    </Modal>
  );
};
