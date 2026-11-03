import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Archive,
  ChevronRight,
  AlertTriangle,
  Folder,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/db';
import type { CustomCategory, CategoryType } from '../../types';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';

const CATEGORY_TYPES: { id: CategoryType; labelEn: string; labelAr: string }[] = [
  { id: 'expense', labelEn: 'Expense', labelAr: 'مصروفات' },
  { id: 'income', labelEn: 'Income', labelAr: 'إيرادات ودخل' },
  { id: 'project', labelEn: 'Projects', labelAr: 'مشاريع' },
  { id: 'debt', labelEn: 'Debts & Loans', labelAr: 'ديون وقروض' },
  { id: 'company', labelEn: 'Companies', labelAr: 'شركات' },
  { id: 'task', labelEn: 'Tasks', labelAr: 'مهام' },
  { id: 'contract', labelEn: 'Contracts', labelAr: 'عقود' },
  { id: 'contact', labelEn: 'Contacts', labelAr: 'جهات اتصال' },
  { id: 'transaction', labelEn: 'Transactions', labelAr: 'معاملات عامة' },
];

const PRESET_COLORS = [
  '#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED',
  '#0891B2', '#4F46E5', '#DB2777', '#475569', '#10B981',
];

export const CategoryManager: React.FC = () => {
  const { t, isRTL, workspaces, activeWorkspaceId } = useApp();
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CategoryType | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [color, setColor] = useState('#2563EB');
  const [parentId, setParentId] = useState<string>('');
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');

  // Deletion warning state
  const [deleteWarning, setDeleteWarning] = useState<{ id: string; name: string; count: number } | null>(null);

  const loadCategories = async () => {
    let cats = await db.categories.toArray();
    if (activeWorkspaceId !== 'all') {
      cats = cats.filter((c) => !c.workspaceId || c.workspaceId === activeWorkspaceId);
    }
    setCategories(cats);
  };

  useEffect(() => {
    loadCategories();
  }, [activeWorkspaceId]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setType(selectedType !== 'all' ? selectedType : 'expense');
    setColor('#2563EB');
    setParentId('');
    setWorkspaceId(activeWorkspaceId !== 'all' ? activeWorkspaceId : '');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CustomCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setType(cat.type);
    setColor(cat.color || '#2563EB');
    setParentId(cat.parentId || '');
    setWorkspaceId(cat.workspaceId || '');
    setStatus(cat.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const now = new Date().toISOString();
    if (editingCategory) {
      await db.categories.update(editingCategory.id, {
        name: name.trim(),
        description: description.trim(),
        type,
        color,
        parentId: parentId || null,
        workspaceId: workspaceId || undefined,
        status,
        updatedAt: now,
      });
    } else {
      const newCat: CustomCategory = {
        id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        description: description.trim(),
        type,
        color,
        parentId: parentId || null,
        workspaceId: workspaceId || undefined,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      await db.categories.add(newCat);
    }

    setIsModalOpen(false);
    loadCategories();
  };

  const handlePromptDelete = async (cat: CustomCategory) => {
    // Check if category is used in transactions or projects
    const txCount = await db.transactions.where('categoryId').equals(cat.id).count();
    const projCount = await db.projects.where('categoryId').equals(cat.id).count();
    const totalUsage = txCount + projCount;

    if (totalUsage > 0) {
      setDeleteWarning({ id: cat.id, name: cat.name, count: totalUsage });
    } else {
      await db.categories.delete(cat.id);
      loadCategories();
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteWarning) {
      await db.categories.delete(deleteWarning.id);
      setDeleteWarning(null);
      loadCategories();
    }
  };

  const handleToggleArchive = async (cat: CustomCategory) => {
    const newStatus = cat.status === 'active' ? 'archived' : 'active';
    await db.categories.update(cat.id, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    loadCategories();
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || cat.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Group by parent / hierarchy
  const parentCategories = filteredCategories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {t.navCategories}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRTL
              ? 'إنشاء وتنظيم التصنيفات المخصصة والهرمية لمشاريعك ومصروفاتك وإيراداتك.'
              : 'Create and organize hierarchical custom categories for projects, expenses, income, and debts.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createCategory}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
          <input
            type="text"
            placeholder={isRTL ? 'بحث في التصنيفات...' : 'Search categories...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Type pills filter (Interactive Segmented buttons) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedType === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.all}
          </button>
          {CATEGORY_TYPES.map((ct) => (
            <button
              key={ct.id}
              onClick={() => setSelectedType(ct.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedType === ct.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {isRTL ? ct.labelAr : ct.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Category List */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={isRTL ? 'لا توجد تصنيفات مضافة بعد' : 'No custom categories created yet'}
          description={
            isRTL
              ? 'أنشئ تصنيفاتك الخاصة بالمصروفات أو المشاريع أو الدخل للبدء في تنظيم حساباتك بحرية.'
              : 'Create custom categories for your expenses, projects, or income to organize your finances with precision.'
          }
          primaryActionLabel={t.createCategory}
          onPrimaryAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
          {parentCategories.map((parent) => {
            const children = filteredCategories.filter((c) => c.parentId === parent.id);
            return (
              <div key={parent.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: parent.color || '#2563EB' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {parent.name}
                        </span>
                        {parent.status === 'archived' && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            ({isRTL ? 'مؤرشف' : 'Archived'})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="capitalize">{parent.type}</span>
                        {parent.description && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{parent.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleArchive(parent)}
                      title={parent.status === 'active' ? 'Archive' : 'Restore'}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(parent)}
                      title="Edit"
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePromptDelete(parent)}
                      title="Delete"
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories (Hierarchy) */}
                {children.length > 0 && (
                  <div className="mt-3 pl-6 pr-2 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: child.color || '#2563EB' }}
                          />
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {child.name}
                          </span>
                          {child.description && (
                            <span className="text-[11px] text-slate-400">
                              - {child.description}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(child)}
                            className="p-1 text-slate-400 hover:text-blue-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePromptDelete(child)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? (isRTL ? 'تعديل التصنيف' : 'Edit Category') : (isRTL ? 'إنشاء تصنيف جديد' : 'New Custom Category')}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'اسم التصنيف *' : 'Category Name *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRTL ? 'مثال: اشتراكات البرمجيات' : 'e.g. Software Subscriptions'}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'نوع التصنيف' : 'Category Type'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CategoryType)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {CATEGORY_TYPES.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {isRTL ? ct.labelAr : ct.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {isRTL ? 'التصنيف الرئيسي (اختياري)' : 'Parent Category (Optional)'}
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="">{isRTL ? 'بدون تصنيف رئيسي (مستوى أعلى)' : 'None (Top Level)'}</option>
                {categories
                  .filter((c) => !c.parentId && (!editingCategory || c.id !== editingCategory.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'مساحة العمل المخصصة' : 'Assign Workspace (Optional)'}
            </label>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">{isRTL ? 'عام (متاح في جميع المساحات)' : 'Global (All Workspaces)'}</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name} ({ws.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'لون التمييز' : 'Color Accent'}
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isRTL ? 'الوصف' : 'Description'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isRTL ? 'ملاحظات وتفاصيل إضافية عن التصنيف...' : 'Additional notes...'}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              {t.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Warning Modal */}
      {deleteWarning && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteWarning(null)}
          title={isRTL ? 'تحذير ارتباط السجلات' : 'Category Usage Warning'}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                {isRTL ? (
                  <span>
                    هذا التصنيف مرتبطة به <strong>{deleteWarning.count}</strong> من المعاملات أو المشاريع. حذف هذا التصنيف سيترك السجلات المرتبطة بدون تصنيف.
                  </span>
                ) : (
                  <span>
                    This category is currently assigned to <strong>{deleteWarning.count}</strong> transactions or projects. Deleting it will leave those records unassigned.
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isRTL
                ? 'هل أنت متأكد من رغبتك في حذف التصنيف نهائياً؟ يمكنك أرشفتها بدلاً من ذلك.'
                : 'Are you sure you want to permanently delete it? You can archive it instead.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setDeleteWarning(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                {isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
