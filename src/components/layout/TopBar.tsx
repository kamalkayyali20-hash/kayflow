import React from 'react';
import { Plus, Sun, Moon, Globe, Building2, Code2, User } from 'lucide-react';
import { useApp, type WorkspaceId } from '../../context/AppContext';

export const TopBar: React.FC = () => {
  const {
    t,
    language,
    setLanguage,
    theme,
    setTheme,
    activeWorkspaceId,
    setActiveWorkspaceId,
    openQuickAdd,
    isRTL,
  } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3 max-w-7xl mx-auto">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
            KAYFLOW
          </span>

          {/* Mobile Workspace Switcher (visible on mobile only) */}
          <div className="lg:hidden flex items-center">
            <select
              value={activeWorkspaceId}
              onChange={(e) => setActiveWorkspaceId(e.target.value as WorkspaceId)}
              className="text-xs font-bold py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-blue-600 dark:text-blue-400"
            >
              <option value="ofis-soft">OFIS-SOFT</option>
              <option value="kay-soft">KAY-SOFT</option>
              <option value="personal">PERSONAL</option>
            </select>
          </div>
        </div>

        {/* Zone 2: Workspace indicators on Desktop */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setActiveWorkspaceId('ofis-soft')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeWorkspaceId === 'ofis-soft'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>OFIS-SOFT</span>
          </button>

          <button
            onClick={() => setActiveWorkspaceId('kay-soft')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeWorkspaceId === 'kay-soft'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>KAY-SOFT</span>
          </button>

          <button
            onClick={() => setActiveWorkspaceId('personal')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeWorkspaceId === 'personal'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>PERSONAL</span>
          </button>
        </div>

        {/* Zone 3: 1 Primary action button + Utilities */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            title="Switch Language (English / العربية)"
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Globe className="w-4 h-4 text-slate-500" />
            <span className="uppercase">{language === 'en' ? 'عربي' : 'EN'}</span>
          </button>

          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title="Toggle Light / Dark mode"
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            onClick={() => openQuickAdd()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.quickAdd}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
