import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Check,
  Calendar,
  Trash2,
  Search,
  Filter,
  Clock,
  AlertCircle
} from 'lucide-react';
import { db } from '../../db/db';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';

export const TasksView: React.FC = () => {
  const { t, isRTL, activeWorkspaceId } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const loadTasks = async () => {
    try {
      const list = await db.tasks
        .where('workspaceId')
        .equals(activeWorkspaceId)
        .toArray();
      setTasks(list);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [activeWorkspaceId]);

  const handleToggleComplete = async (task: Task) => {
    try {
      const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
      await db.tasks.update(task.id, {
        status: nextStatus,
        completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined
      });
      await loadTasks();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذه المهمة؟' : 'Delete this task?')) {
      try {
        await db.tasks.delete(id);
        await loadTasks();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const newTask: Task = {
        id: crypto.randomUUID(),
        workspaceId: activeWorkspaceId,
        title,
        description: description || undefined,
        dueDate: dueDate || undefined,
        priority,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await db.tasks.add(newTask);

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      await loadTasks();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const filtered = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (filter === 'pending' && task.status === 'completed') return false;
    if (filter === 'completed' && task.status !== 'completed') return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <span>{isRTL ? 'قائمة المهام والمسؤوليات' : 'Action Tasks'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? `مهام بيئة العمل الحالية: ${activeWorkspaceId.toUpperCase()}` : `Tasks isolated to workspace: ${activeWorkspaceId.toUpperCase()}`}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRTL ? 'إضافة مهمة جديدة' : 'Add Task'}</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          {(['pending', 'completed', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === tab
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'pending' && (isRTL ? 'المعلقة' : 'Pending')}
              {tab === 'completed' && (isRTL ? 'المكتملة' : 'Completed')}
              {tab === 'all' && (isRTL ? 'الكل' : 'All Tasks')}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRTL ? 'بحث في المهام...' : 'Search tasks...'}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Tasks List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={isRTL ? 'لا توجد مهام' : 'No Tasks Found'}
          description={isRTL ? 'أضف مهام العمل لمتابعة إنجازها في هذه البيئة.' : 'Keep track of to-dos and action items in this workspace.'}
          icon={CheckSquare}
          actionLabel={isRTL ? 'إضافة مهمة' : 'Add Task'}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map(t => (
            <div
              key={t.id}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                t.status === 'completed'
                  ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-70'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  onClick={() => handleToggleComplete(t)}
                  className={`mt-0.5 p-1.5 rounded-lg border transition-colors shrink-0 ${
                    t.status === 'completed'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        t.status === 'completed'
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {t.priority}
                    </span>
                  </div>

                  {t.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {t.description}
                    </p>
                  )}

                  {t.dueDate && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(t.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              {isRTL ? 'إضافة مهمة جديدة' : 'Add New Task'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'عنوان المهمة *' : 'Task Title *'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isRTL ? 'ما الذي يجب إنجازه؟' : 'What needs to be done?'}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'تفاصيل إضافية' : 'Description'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isRTL ? 'الأولوية' : 'Priority'}
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="low">{isRTL ? 'منخفضة' : 'Low'}</option>
                    <option value="medium">{isRTL ? 'متوسطة' : 'Medium'}</option>
                    <option value="high">{isRTL ? 'عالية' : 'High'}</option>
                    <option value="urgent">{isRTL ? 'عاجلة' : 'Urgent'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                >
                  {isRTL ? 'حفظ المهمة' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
