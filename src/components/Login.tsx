import React, { useState } from 'react';
import { ShieldAlert, FileText, ClipboardList } from 'lucide-react';
import { UserRole } from '../types';

interface LoginProps {
  onLoginSuccess: (role: UserRole, userName: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('bureau');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setError("Veuillez saisir votre code d'accès.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiBase = (import.meta as any).env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: selectedRole, passcode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLoginSuccess(data.role, data.userName);
      } else {
        setError(data.error || "Code d'accès incorrect. Veuillez réessayer.");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur backend. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header Decore */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center text-white relative">
          <div className="absolute top-4 left-4 flex gap-1 items-center bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Version 1.0
          </div>
          <div className="mx-auto w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-3">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-tight">Suivi de Livraisons</h1>
          <p className="text-white/80 text-xs mt-1">Plateforme synchronisée pour l'Atelier et les Bureaux</p>
        </div>

        {/* Content Form */}
        <div className="p-6 md:p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Sélectionnez votre espace :
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  id="role-bureau-btn"
                  onClick={() => { setSelectedRole('bureau'); setError(null); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedRole === 'bureau'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <FileText className="w-6 h-6 mb-2" />
                  <span className="font-semibold text-sm">Bureaux</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Commandes, Planification</span>
                </button>

                <button
                  type="button"
                  id="role-atelier-btn"
                  onClick={() => { setSelectedRole('atelier'); setError(null); }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedRole === 'atelier'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <ClipboardList className="w-6 h-6 mb-2" />
                  <span className="font-semibold text-sm">Atelier</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Production, Statuts</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="passcode">
                  Code d'accès :
                </label>
              </div>
              <input
                type="password"
                maxLength={4}
                id="passcode"
                placeholder="••••"
                pattern="[0-9]*"
                inputMode="numeric"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value.replace(/\D/g, ''));
                  setError(null);
                }}
                className="w-full text-center text-2xl tracking-widest font-mono py-3 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-800 dark:text-white"
              />
            </div>

            {error && (
              <div id="login-error-alert" className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs border border-red-100 dark:border-red-900/40">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-50030 flex items-center justify-center gap-2 cursor-pointer ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Quick Notice */}
          <div className="mt-8 text-center text-[11px] text-slate-400/90 dark:text-slate-500 leading-relaxed">
            Pour tester l'accès simultané, vous pouvez vous connecter sur deux onglets différents :
            l'un comme <strong>Bureau</strong> pour créer, et l'autre comme <strong>Atelier</strong> pour changer le statut. Les mises à jour s'affichent instantanément.
          </div>
        </div>
      </div>
    </div>
  );
}
