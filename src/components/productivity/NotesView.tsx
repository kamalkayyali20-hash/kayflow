import React, { useState, useEffect } from 'react';
import {
  StickyNote,
  Plus,
  Trash2,
  Search,
  Pin,
  Tag,
  Edit,
  Check
} from 'lucide-react';
import { db } from '../../db/db';
import { Note } from '../../types';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';

export const NotesView: React.FC = () => {
  const { t, isRTL, activeWorkspaceId } = useApp();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const loadNotes = async () => {
    try {
      const list = await db.notes
        .where('workspaceId')
        .equals(activeWorkspaceId)
        .reverse()
        .sortBy('updatedAt');
      setNotes(list);
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [activeWorkspaceId]);

  const handleOpenAdd = () => {
    setEditingNote(undefined);
    setTitle('');
    setContent('');
    setTagsInput('');
    setIsPinned(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (n: Note) => {
    setEditingNote(n);
    setTitle(n.title);
    setContent(n.content);
    setTagsInput(n.tags ? n.tags.join(', ') : '');
    setIsPinned(n.isPinned || false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(isRTL ? 'حذف هذه الملاحظة؟' : 'Delete this note?')) {
      try {
        await db.notes.delete(id);
        await loadNotes();
      } catch (err) {
        console.error('Failed to delete note:', err);
      }
    }
  };

  const handleTogglePin = async (n: Note) => {
    try {
      await db.notes.update(n.id, {
        isPinned: !n.isPinned,
        updatedAt: new Date().toISOString()
      });
      await loadNotes();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    try {
      const now = new Date().toISOString();
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      if (editingNote) {
        await db.notes.update(editingNote.id, {
          title: title || 'Untitled Note',
          content,
          tags,
          isPinned,
          updatedAt: now
        });
      } else {
        const newNote: Note = {
          id: crypto.randomUUID(),
          workspaceId: activeWorkspaceId,
          title: title || 'Untitled Note',
          content,
          tags,
          isPinned,
          createdAt: now,
          updatedAt: now
        };
        await db.notes.add(newNote);
      }

      setIsModalOpen(false);
      await loadNotes();
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const filtered = notes.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.tags && n.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <StickyNote className="w-6 h-6 text-amber-500" />
            <span>{isRTL ? 'الملاحظات ومسودات العمل' : 'Work Notes & Knowledge'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? `ملاحظات بيئة العمل: ${activeWorkspaceId.toUpperCase()}` : `Notes isolated to: ${activeWorkspaceId.toUpperCase()}`}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isRTL ? 'ملاحظة جديدة' : 'New Note'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRTL ? 'بحث في الملاحظات والوسوم...' : 'Search notes and tags...'}
            className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={isRTL ? 'لا توجد ملاحظات' : 'No Notes Found'}
          description={isRTL ? 'دوّن الأفكار، مسودات الاجتماعات، ونقاط المتابعة.' : 'Capture meeting takeaways, ideas, and snippets.'}
          icon={StickyNote}
          actionLabel={isRTL ? 'كتابة ملاحظة' : 'Create Note'}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(n => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                n.isPinned
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {n.title}
                  </h3>

                  <button
                    onClick={() => handleTogglePin(n)}
                    className={`p-1 rounded-md transition-colors ${
                      n.isPinned ? 'text-amber-500 fill-amber-500' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line line-clamp-6">
                  {n.content}
                </p>

                {n.tags && n.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {n.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{new Date(n.updatedAt).toLocaleDateString()}</span>

                <div className="flex items-center gap-1 font-sans">
                  <button
                    onClick={() => handleOpenEdit(n)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              {editingNote ? (isRTL ? 'تعديل الملاحظة' : 'Edit Note') : (isRTL ? 'ملاحظة جديدة' : 'New Note')}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'العنوان' : 'Title'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isRTL ? 'عنوان الملاحظة...' : 'Note title...'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'المحتوى *' : 'Content *'}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder={isRTL ? 'اكتب ملاحظتك هنا...' : 'Write notes, ideas, code snippets...'}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isRTL ? 'وسوم (مفصولة بفاصلة)' : 'Tags (comma separated)'}
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="meeting, idea, architecture"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinNoteCheck"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded-md border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="pinNoteCheck" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                  {isRTL ? 'تثبيت الملاحظة في الأعلى' : 'Pin note to top'}
                </label>
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
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                >
                  {isRTL ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
