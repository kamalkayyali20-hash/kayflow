import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LockScreen: React.FC = () => {
  const { unlockApp, t, isRTL } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockApp(pin);
    if (!success) {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center shadow-2xl">
        <div className="w-14 h-14 mx-auto mb-6 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-400 border border-slate-700">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">KAYFLOW SECURE</h2>
        <p className="text-xs text-slate-400 mb-6">
          {isRTL ? 'أدخل رمز المرور الشخصي لفك قفل التطبيق' : 'Enter your security PIN to unlock your financial data.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => {
                setError(false);
                setPin(e.target.value);
              }}
              placeholder="••••"
              className={`w-full text-center text-2xl tracking-widest font-mono py-3 px-4 rounded-xl bg-slate-800 text-white border ${
                error ? 'border-red-500' : 'border-slate-700'
              } focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all`}
            />
            {error && (
              <p className="text-xs text-red-400 mt-2">
                {isRTL ? 'رمز المرور غير صحيح' : 'Incorrect PIN code. Please try again.'}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
          >
            <span>{isRTL ? 'دخول' : 'Unlock Application'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{isRTL ? 'تخزين محلي مؤمن بدون خوادم خارجية' : 'Local Offline Vault · Zero Cloud Tracking'}</span>
        </div>
      </div>
    </div>
  );
};
