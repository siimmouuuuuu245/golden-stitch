import React from 'react';
import { 
  Clipboard, 
  Clock, 
  Printer, 
  Eye, 
  CheckCircle2, 
  Inbox, 
  FileSignature, 
  FileCheck 
} from 'lucide-react';
import { Stats } from '../types';

interface DashboardStatsProps {
  stats: Stats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      {/* Total Deliveries Card */}
      <div 
        id="stat-card-total" 
        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
      >
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total</p>
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-mono leading-none">{stats.total}</h3>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 italic">Travaux</span>
          <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg flex items-center justify-center shrink-0">
            <Clipboard className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* À Saisir (Rose/Rouge) */}
      <div 
        id="stat-card-asaisir" 
        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between border-l-3 border-l-rose-400"
      >
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">À Saisir</p>
          <h3 className="text-xl font-extrabold text-rose-700 dark:text-rose-400/90 font-mono leading-none">{stats.aSaisir}</h3>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[9px] text-rose-500 dark:text-rose-400/80 italic">En attente</span>
          <div className="w-7 h-7 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 rounded-lg flex items-center justify-center shrink-0">
            <Inbox className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* En cours de saisie (Orange avec Pulse) */}
      <div 
        id="stat-card-encoursesaisie" 
        className="bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between border-l-3 border-l-amber-500 relative overflow-hidden animate-pulse"
      >
        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400  uppercase tracking-wider">Saisie En Cours</p>
          <h3 className="text-xl font-extrabold text-amber-800 dark:text-amber-450 font-mono leading-none">{stats.enCoursSaisie}</h3>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium italic">Activité active</span>
          <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center shrink-0">
            <FileSignature className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Saisi (Sky) */}
      <div 
        id="stat-card-saisi" 
        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between border-l-3 border-l-cyan-400"
      >
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Saisi</p>
          <h3 className="text-xl font-extrabold text-cyan-700 dark:text-cyan-400/95 font-mono leading-none">{stats.saisi}</h3>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 italic">Enregistré</span>
          <div className="w-7 h-7 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500 dark:text-cyan-400 rounded-lg flex items-center justify-center shrink-0">
            <FileCheck className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Cliché en préparation (Jaune) */}
      <div 
        id="stat-card-cliche" 
        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between border-l-3 border-l-yellow-400"
      >
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">Cliché Prép.</p>
          <h3 className="text-xl font-extrabold text-yellow-700 dark:text-yellow-400/90 font-mono leading-none">{stats.cliche}</h3>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[9px] text-slate-500 dark:text-slate-400 italic">Préparation</span>
          <div className="w-7 h-7 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-500 dark:text-yellow-400 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* En fabrication (Bleu) */}
      <div 
        id="stat-card-fabrication" 
        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between border-l-3 border-l-blue-400"
      >
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Fabrication</p>
          <h3 className="text-xl font-extrabold text-blue-700 dark:text-blue-400/90 font-mono leading-none">{stats.fabrication}</h3>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[9px] text-slate-500 dark:text-slate-400 italic">Impression</span>
          <div className="w-7 h-7 bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0">
            <Printer className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Prêt pour validation (Violet) */}
      <div 
        id="stat-card-valready" 
        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between border-l-3 border-l-purple-400"
      >
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Validation</p>
          <h3 className="text-xl font-extrabold text-purple-700 dark:text-purple-400/90 font-mono leading-none">{stats.valReady}</h3>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[9px] text-slate-500 dark:text-slate-400 italic">Prêt</span>
          <div className="w-7 h-7 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-450 rounded-lg flex items-center justify-center shrink-0">
            <Eye className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Terminé / Versions envoyées (Vert) */}
      <div 
        id="stat-card-completed" 
        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between border-l-3 border-l-emerald-400"
      >
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Envoyé</p>
          <h3 className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400/90 font-mono leading-none">{stats.completed}</h3>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[9px] text-slate-500 dark:text-slate-400 italic font-medium">Finalisé</span>
          <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
