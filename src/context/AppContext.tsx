import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language } from '../i18n/translations';
import { db, initializeDatabaseDefaults } from '../db/db';
import type { Workspace } from '../types';

export type WorkspaceId = 'ofis-soft' | 'kay-soft' | 'personal';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: typeof translations.en;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  activeWorkspaceId: WorkspaceId;
  setActiveWorkspaceId: (id: WorkspaceId) => void;
  workspaces: Workspace[];
  refreshWorkspaces: () => Promise<void>;
  reportingCurrency: string;
  setReportingCurrency: (curr: string) => void;
  currentMonth: string;
  setCurrentMonth: (ym: string) => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  quickAddDefaultType: string | null;
  openQuickAdd: (type?: string) => void;
  isLocked: boolean;
  hasPin: boolean;
  unlockApp: (enteredPin: string) => boolean;
  setPinCode: (newPin: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('kayflow_lang') as Language) || 'en';
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('kayflow_theme') as 'light' | 'dark') || 'light';
  });

  const [reportingCurrency, setReportingCurrencyState] = useState<string>(() => {
    return localStorage.getItem('kayflow_reporting_curr') || 'EGP';
  });

  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<WorkspaceId>(() => {
    const saved = localStorage.getItem('kayflow_active_workspace');
    if (saved === 'ofis-soft' || saved === 'kay-soft' || saved === 'personal') {
      return saved as WorkspaceId;
    }
    // Backward compatibility with previous ws-business / ws-personal
    if (saved === 'ws-business') return 'kay-soft';
    if (saved === 'ws-personal') return 'personal';
    return 'ofis-soft';
  });

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // Default initial navigation route based on workspace
  const [activeNav, setActiveNav] = useState<string>(() => {
    const savedWs = localStorage.getItem('kayflow_active_workspace') || 'ofis-soft';
    if (savedWs === 'kay-soft') return 'kay-dashboard';
    if (savedWs === 'personal') return 'personal-dashboard';
    return 'ofis-dashboard';
  });

  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const [quickAddDefaultType, setQuickAddDefaultType] = useState<string | null>(null);

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [currentMonth, setCurrentMonth] = useState<string>(currentMonthStr);

  // Security Lock
  const [savedPin, setSavedPin] = useState<string | null>(() => {
    return localStorage.getItem('kayflow_pin');
  });
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return !!localStorage.getItem('kayflow_pin');
  });

  const isRTL = language === 'ar';
  const t = translations[language];

  // Set RTL and HTML language
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('kayflow_lang', language);
  }, [language, isRTL]);

  // Set Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('kayflow_theme', theme);
  }, [theme]);

  // Refresh workspaces
  const refreshWorkspaces = async () => {
    await initializeDatabaseDefaults();
    const ws = await db.workspaces.toArray();
    setWorkspaces(ws);
  };

  useEffect(() => {
    refreshWorkspaces();
  }, []);

  const setActiveWorkspaceId = (id: WorkspaceId) => {
    setActiveWorkspaceIdState(id);
    localStorage.setItem('kayflow_active_workspace', id);

    // Switch to root dashboard of selected environment
    if (id === 'ofis-soft') {
      setActiveNav('ofis-dashboard');
    } else if (id === 'kay-soft') {
      setActiveNav('kay-dashboard');
    } else if (id === 'personal') {
      setActiveNav('personal-dashboard');
    }
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setTheme = (th: 'light' | 'dark') => {
    setThemeState(th);
  };

  const setReportingCurrency = (curr: string) => {
    setReportingCurrencyState(curr);
    localStorage.setItem('kayflow_reporting_curr', curr);
  };

  const openQuickAdd = (type?: string) => {
    setQuickAddDefaultType(type || null);
    setQuickAddOpen(true);
  };

  const unlockApp = (enteredPin: string): boolean => {
    if (enteredPin === savedPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const setPinCode = (newPin: string | null) => {
    if (newPin) {
      localStorage.setItem('kayflow_pin', newPin);
      setSavedPin(newPin);
      setIsLocked(false);
    } else {
      localStorage.removeItem('kayflow_pin');
      setSavedPin(null);
      setIsLocked(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        isRTL,
        t,
        theme,
        setTheme,
        activeWorkspaceId,
        setActiveWorkspaceId,
        workspaces,
        refreshWorkspaces,
        reportingCurrency,
        setReportingCurrency,
        currentMonth,
        setCurrentMonth,
        activeNav,
        setActiveNav,
        quickAddOpen,
        setQuickAddOpen,
        quickAddDefaultType,
        openQuickAdd,
        isLocked,
        hasPin: !!savedPin,
        unlockApp,
        setPinCode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
