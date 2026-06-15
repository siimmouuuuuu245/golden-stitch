import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PlusCircle, 
  Search, 
  LogOut, 
  Filter, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  RefreshCw, 
  Bell, 
  TrendingUp, 
  Sparkles,
  Layers,
  ChevronDown,
  Info,
  Sun,
  Moon,
  Clock
} from 'lucide-react';
import { Delivery, DeliveryStatus, UserRole, Stats } from './types';
import Login from './components/Login';
import DashboardStats from './components/DashboardStats';
import DeliveryForm from './components/DeliveryForm';
import WhatsAppTemplateModal from './components/WhatsAppTemplateModal';

const API_BASE = (import.meta as any).env.VITE_API_URL || '';

export default function App() {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<{ role: UserRole; userName: string } | null>(() => {
    // Attempt local storage restore
    const saved = localStorage.getItem('delivery_app_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('delivery_app_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('delivery_app_theme', next);
      return next;
    });
  };

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [imprimeurFilter, setImprimeurFilter] = useState<string>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [whatsAppDelivery, setWhatsAppDelivery] = useState<Delivery | null>(null);
  const [deletingDelivery, setDeletingDelivery] = useState<{ id: string; clientName: string } | null>(null);
  const [historyDelivery, setHistoryDelivery] = useState<Delivery | null>(null);

  // Direct Inline Status Editing loader state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Toast status notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Load deliveries
  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/deliveries`);
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data);
      } else {
        setError("Impossible de charger les données du serveur.");
      }
    } catch (err) {
      setError("Erreur technique de connexion réseau.");
    } finally {
      setLoading(false);
    }
  };

  // Helper for displaying toast alert
  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Initial load
  useEffect(() => {
    if (user) {
      fetchDeliveries();
    }
  }, [user]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (!user) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea, select or contentEditable elements
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.tagName === 'SELECT' ||
         target.isContentEditable)
      ) {
        return;
      }

      // Ignore if any modifier key (like Ctrl, Alt, Meta) is pressed to not break default system shortcuts
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      const key = event.key.toUpperCase();

      if (key === 'N') {
        if (user.role === 'atelier') {
          event.preventDefault();
          setEditingDelivery(null);
          setIsFormOpen(true);
          triggerToast("Information : Formulaire ouvert (Atelier)", 'info');
        } else {
          event.preventDefault();
          triggerToast("Seul le rôle Atelier peut créer de nouvelles livraisons", 'error');
        }
      } else if (key === 'S') {
        event.preventDefault();
        searchInputRef.current?.focus();
        triggerToast("Information : Recherche activée", 'info');
      } else if (key === 'R') {
        event.preventDefault();
        fetchDeliveries();
        triggerToast("Information : Données actualisées", 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user]);

  // Real-time EventSource (SSE) integration
  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource(`${API_BASE}/api/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === 'welcome') {
          console.log('[SSE Connected]:', data.payload);
          return;
        }

        const payload = data.payload as Delivery;

        if (data.action === 'create') {
          setDeliveries((prev) => {
            // Check if already in array to avoid duplicate duplicates
            if (prev.some((d) => d.id === payload.id)) return prev;
            
            // Notify if created by another person
            if (payload.updatedBy !== user.role) {
              triggerToast(`Nouvelle livraison ajoutée par le Bureau : ${payload.clientName}`, 'success');
            }
            return [payload, ...prev];
          });
        } 
        
        else if (data.action === 'update') {
          setDeliveries((prev) => {
            const index = prev.findIndex((d) => d.id === payload.id);
            if (index === -1) return [payload, ...prev]; // fallback add

            const updatedList = [...prev];
            const oldStatus = updatedList[index].status;
            updatedList[index] = payload;

            // Notify if status changed or modified by other team
            if (payload.updatedBy !== user.role) {
              if (oldStatus !== payload.status) {
                triggerToast(
                  `Le statut de la livraison pour ${payload.clientName} a changé : "${oldStatus}" ➡️ "${payload.status}" par l'Atelier`,
                  'info'
                );
              } else {
                triggerToast(`Livraison mise à jour pour : ${payload.clientName}`, 'info');
              }
            }
            return updatedList;
          });
        } 
        
        else if (data.action === 'delete') {
          const deletedId = data.payload.id;
          setDeliveries((prev) => {
            const toDelete = prev.find((d) => d.id === deletedId);
            if (toDelete && toDelete.updatedBy !== user.role) {
              triggerToast(`Une livraison (${toDelete.clientName}) a été supprimée.`, 'info');
            }
            return prev.filter((d) => d.id !== deletedId);
          });
        }
      } catch (e) {
        console.error("SSE parse error", e);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("SSE reconnecting or disconnected:", err);
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  // Authenticate
  const handleLoginSuccess = (role: UserRole, userName: string) => {
    const sessionDetail = { role, userName };
    setUser(sessionDetail);
    localStorage.setItem('delivery_app_session', JSON.stringify(sessionDetail));
    triggerToast(`Bienvenue, connecté en tant que ${userName} !`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('delivery_app_session');
    setUser(null);
    setDeliveries([]);
  };

  // Submit delivery creation or complete edit
  const handleFormSubmit = async (deliveryData: Partial<Delivery>) => {
    const url = editingDelivery ? `${API_BASE}/api/deliveries/${editingDelivery.id}` : `${API_BASE}/api/deliveries`;
    const method = editingDelivery ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deliveryData),
      });

      if (res.ok) {
        const result = await res.json();
        
        // Optimistic UI updates are handled gracefully by SSE anyway, 
        // fallback to instant manual update if SSE took a moment.
        if (editingDelivery) {
          setDeliveries((prev) => prev.map((item) => item.id === result.id ? result : item));
          triggerToast("Livraison mise à jour avec succès !", 'success');
        } else {
          setDeliveries((prev) => [result, ...prev]);
          triggerToast("Nouvelle livraison enregistrée !", 'success');
        }
      } else {
        triggerToast("Échec de l'enregistrement de la livraison.", 'error');
      }
    } catch (err) {
      triggerToast("Erreur de connexion lors de la sauvegarde.", 'error');
    }
  };

  // Inline single status modification (Atelier/Bureau dropdown)
  const handleInlineStatusChange = async (deliveryId: string, nextStatus: DeliveryStatus) => {
    setUpdatingId(deliveryId);
    try {
      const res = await fetch(`${API_BASE}/api/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: nextStatus,
          updatedBy: user?.role || 'atelier'
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDeliveries((prev) => prev.map((item) => item.id === updated.id ? updated : item));
        triggerToast(`Statut mis à jour : "${nextStatus}"`, 'success');
      } else {
        triggerToast("Impossible de changer le statut.", 'error');
      }
    } catch (err) {
      triggerToast("Erreur lors de la modification.", 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Set delivery to be deleted to open modal
  const handleDeleteDelivery = (id: string, clientName: string) => {
    setDeletingDelivery({ id, clientName });
  };

  // Perform actual API deletion
  const executeDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/deliveries/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeliveries((prev) => prev.filter((item) => item.id !== id));
        triggerToast("Livraison supprimée avec succès.", 'info');
      } else {
        triggerToast("Erreur lors de la suppression.", 'error');
      }
    } catch (err) {
      triggerToast("Impossible de contacter le serveur.", 'error');
    }
  };

  // Calculate dynamic stats
  const stats: Stats = useMemo(() => {
    const defaultStats = { total: 0, aSaisir: 0, enCoursSaisie: 0, saisi: 0, cliche: 0, fabrication: 0, valReady: 0, completed: 0 };
    if (!deliveries.length) return defaultStats;

    return deliveries.reduce((acc, curr) => {
      acc.total += 1;
      if (curr.status === 'À saisir') acc.aSaisir += 1;
      else if (curr.status === 'En cours de saisie') acc.enCoursSaisie += 1;
      else if (curr.status === 'Saisi') acc.saisi += 1;
      else if (curr.status === 'Cliché en préparation') acc.cliche += 1;
      else if (curr.status === 'En fabrication') acc.fabrication += 1;
      else if (curr.status === 'Prêt pour validation') acc.valReady += 1;
      else if (curr.status === 'Terminé / Versions envoyées') acc.completed += 1;
      return acc;
    }, defaultStats);
  }, [deliveries]);

  // Compute unique Imprimeur levels for filter dropdown
  const uniqueImprimeurs = useMemo(() => {
    const imprimeursSet = new Set(deliveries.map(d => d.imprimeur).filter(Boolean));
    return Array.from(imprimeursSet);
  }, [deliveries]);

  // Filter & Search computation
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((item) => {
      // Search matches
      const query = searchQuery.toLowerCase().trim();
      const matchSearch = query === '' || 
        item.clientName.toLowerCase().includes(query) ||
        item.product.toLowerCase().includes(query) ||
        item.notes.toLowerCase().includes(query) ||
        item.imprimeur.toLowerCase().includes(query) ||
        (item.phone && item.phone.toLowerCase().includes(query));

      // Status Filter matches
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;

      // Imprimeur Filter matches
      const matchImprimeur = imprimeurFilter === 'all' || item.imprimeur === imprimeurFilter;

      return matchSearch && matchStatus && matchImprimeur;
    });
  }, [deliveries, searchQuery, statusFilter, imprimeurFilter]);

  // Format Status Badge helper with clean professional styling
  const getStatusStyle = (status: DeliveryStatus) => {
    switch (status) {
      case 'À saisir':
        return 'bg-rose-50 text-rose-800 border-rose-200 font-medium';
      case 'En cours de saisie':
        return 'bg-amber-100 text-amber-900 border-amber-350 shadow-xs ring-2 ring-amber-500/20 font-bold animate-pulse';
      case 'Saisi':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200 font-medium';
      case 'Cliché en préparation':
        return 'bg-yellow-50 text-yellow-800 border-yellow-250 font-medium';
      case 'En fabrication':
        return 'bg-blue-50 text-blue-800 border-blue-200 font-medium';
      case 'Prêt pour validation':
        return 'bg-purple-50 text-purple-800 border-purple-200 font-medium';
      case 'Terminé / Versions envoyées':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200 font-medium';
    }
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      
      {/* Toast Alert Banner */}
      {toast && (
        <div 
          id="global-toast" 
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border text-sm max-w-sm flex items-center gap-3 animate-slide-up bg-white dark:bg-slate-900 ${
            toast.type === 'success' ? 'border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200' :
            toast.type === 'info' ? 'border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-200' :
            'border-red-200 dark:border-red-800 text-red-800 dark:text-red-250'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${
            toast.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' :
            toast.type === 'info' ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-450' :
            'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400'
          }`}>
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div className="flex-1 font-medium">{toast.message}</div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo and App Title */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight block">Atelier + Bureaux</span>
                <span className="text-[10px] text-blue-400 font-mono tracking-wider uppercase block">Suivi Logistique</span>
              </div>
            </div>

            {/* Profile Info and Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-400">Connecté en tant que</p>
                <p className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 justify-end">
                  <span className={`inline-block w-2 h-2 rounded-full ${user.role === 'bureau' ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
                  {user.userName}
                </p>
              </div>

              {/* Theme toggle button */}
              <button
                onClick={toggleTheme}
                id="header-theme-toggle-btn"
                className="flex items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-700 shadow-sm"
                title={theme === 'light' ? "Basculer vers le mode sombre Atelier (faible luminosité)" : "Basculer vers le mode clair Bureau"}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </button>

              <span className="h-8 w-[1px] bg-slate-700 hidden sm:block"></span>

              <button
                onClick={handleLogout}
                id="header-logout-btn"
                className="flex items-center gap-2 py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-700"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Ribbon - Environment info / Quick Sync Status */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 transition-colors duration-150">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Synchronised Indicators */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide font-mono text-[10px]">Temps Réel Synchronisé :</span>
            <span className="hidden sm:inline">Toutes les actions de l'Atelier ou du Bureau s'affichent instantanément sans recharger.</span>
            <span className="sm:hidden inline">Mises à jour directes actives.</span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={fetchDeliveries}
              id="header-sync-btn"
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Actualiser les données [R]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser [R]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Dynamic statistics */}
        <DashboardStats stats={stats} />

        {/* Dashboard Actions Bar: Search, Filters, and Add Button */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            
            {/* Search and interactive filters */}
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              {/* Search text input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  id="dashboard-search-input"
                  placeholder="Rechercher client, produit... [Appuyez sur S]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-xl transition-all outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Status Filter selector */}
              <div className="flex items-center gap-1.5 min-w-[150px]">
                <Filter className="text-slate-400 w-3.5 h-3.5 shrink-0" />
                <select
                  id="status-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 py-2 px-3 rounded-xl focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="all">📁 Tous les statuts</option>
                  <option value="À saisir">🔴 À saisir</option>
                  <option value="En cours de saisie">🟡 En cours de saisie</option>
                  <option value="Saisi">ℹ️ Saisi</option>
                  <option value="Cliché en préparation">🟠 Cliché en préparation</option>
                  <option value="En fabrication">🔵 En fabrication</option>
                  <option value="Prêt pour validation">🟣 Prêt pour validation</option>
                  <option value="Terminé / Versions envoyées">🟢 Terminé / Versions envoyées</option>
                </select>
              </div>

              {/* Imprimeur Filter selector */}
              <div className="flex items-center gap-1.5 min-w-[150px]">
                <Layers className="text-slate-400 w-3.5 h-3.5 shrink-0" />
                <select
                  id="office-filter-select"
                  value={imprimeurFilter}
                  onChange={(e) => setImprimeurFilter(e.target.value)}
                  className="w-full text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 py-2 px-3 rounded-xl focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="all">🏢 Tous les imprimeurs</option>
                  {uniqueImprimeurs.map((imp) => (
                    <option key={imp} value={imp}>{imp}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action buttons (only "Atelier" role can add new items) */}
            <div className="flex items-center gap-2">
              {user.role === 'atelier' ? (
                <button
                  type="button"
                  id="add-delivery-btn"
                  onClick={() => {
                    setEditingDelivery(null);
                    setIsFormOpen(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer shrink-0 animate-bounce"
                  title="Saisir une nouvelle livraison [N]"
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                  <span>Saisir Livraison [N] (Atelier)</span>
                </button>
              ) : (
                <div className="text-xs bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 px-3.5 py-2 rounded-xl text-center border border-slate-200 dark:border-slate-800 border-dashed shrink-0">
                  ⚠️ Imprimeurs : Accès restreint sur la création
                </div>
              )}
            </div>

          </div>

          {/* Quick Stats of Filter results */}
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 font-medium">
            <span>Resultats du filtre : <strong className="text-slate-700 dark:text-slate-300">{filteredDeliveries.length}</strong> livraison(s) sur {deliveries.length}</span>
            {(searchQuery || statusFilter !== 'all' || imprimeurFilter !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); setImprimeurFilter('all'); }} 
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>

        {/* Deliveries Table resembling Google Sheets but with great look & responsiveness */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {/* Header of Table Description */}
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Grille interactive des livraisons (style Tableur)</h2>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Double-cliquez ou changez le statut directement dans le menu</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading && deliveries.length === 0 ? (
              <div className="py-20 text-center text-slate-500 dark:text-slate-450">
                <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">Chargement des données en cours...</p>
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="py-20 text-center text-slate-500 dark:text-slate-450">
                <Layers className="w-12 h-12 text-slate-350 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Aucune livraison enregistrée pour le moment</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Modifiez les filtres de recherche ou cliquez pour en ajouter une.</p>
              </div>
            ) : (
              <table id="deliveries-data-table" className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/65 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 w-[180px]">Client / Destinataire</th>
                    <th className="py-3 px-4 w-[140px]">Imprimeur</th>
                    <th className="py-3 px-4 w-[120px]">Téléphone</th>
                    <th className="py-3 px-4">Produit Commande</th>
                    <th className="py-3 px-4 w-[80px] text-center">Quantité</th>
                    <th className="py-3 px-4 w-[110px]">Date</th>
                    <th className="py-3 px-4 w-[160px]">Statut</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 w-[130px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
                  {filteredDeliveries.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Client Name */}
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="line-clamp-2" title={item.clientName}>
                          {item.clientName}
                        </div>
                      </td>

                      {/* Imprimeur */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        <span className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                          {item.imprimeur}
                        </span>
                      </td>

                      {/* Phone Number */}
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {item.phone ? (
                          <a href={`tel:${item.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                            {item.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-sans italic">-</span>
                        )}
                      </td>

                      {/* Product */}
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        <div className="line-clamp-2" title={item.product}>
                          {item.product}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {item.quantity}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium font-mono">
                        {new Date(item.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric'
                        })}
                      </td>

                      {/* Status select drop down (Live Edit) */}
                      <td className="py-3 px-4">
                        <div className="relative inline-block w-full">
                          <select
                            value={item.status}
                            onChange={(e) => handleInlineStatusChange(item.id, e.target.value as DeliveryStatus)}
                            disabled={updatingId === item.id}
                            className={`w-full py-1.5 pl-3 pr-8 rounded-full border text-xs font-bold appearance-none outline-none cursor-pointer transition-all ${getStatusStyle(item.status)} ${
                              updatingId === item.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <option value="À saisir">🔴 À saisir</option>
                            <option value="En cours de saisie">🟡 En cours de saisie</option>
                            <option value="Saisi">ℹ️ Saisi</option>
                            <option value="Cliché en préparation">🟠 Cliché en préparation</option>
                            <option value="En fabrication">🔵 En fabrication</option>
                            <option value="Prêt pour validation">🟣 Prêt pour validation</option>
                            <option value="Terminé / Versions envoyées">🟢 Terminé / Versions envoyées</option>
                          </select>
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-600 dark:text-slate-400">
                            <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-450" />
                          </div>
                        </div>
                      </td>

                      {/* Notes with text preview */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-[180px]">
                        <p className="truncate italic" title={item.notes || 'Pas de notes'}>
                          {item.notes || '-'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp dispatch */}
                          <button
                            onClick={() => setWhatsAppDelivery(item)}
                            className="bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 p-2 rounded-xl transition-all cursor-pointer"
                            title="Partager un rapport d'étape via WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Historique */}
                          <button
                            onClick={() => setHistoryDelivery(item)}
                            className="bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 p-2 rounded-xl transition-all cursor-pointer"
                            title="Afficher l'historique des mises à jour"
                          >
                            <Clock className="w-4 h-4" />
                          </button>

                          {/* Edit delivery detail */}
                          <button
                            onClick={() => {
                              setEditingDelivery(item);
                              setIsFormOpen(true);
                            }}
                            className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-xl transition-all cursor-pointer"
                            title="Modifier la ligne"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete (available for both roles to ensure seamless operations) */}
                          {(user.role === 'bureau' || user.role === 'atelier') && (
                            <button
                              onClick={() => handleDeleteDelivery(item.id, item.clientName)}
                              className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100/80 dark:hover:bg-red-900/60 text-red-650 dark:text-red-400 p-2 rounded-xl transition-all cursor-pointer"
                              title="Supprimer la livraison"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick Legend at bottom of Sheets table */}
          <div className="bg-slate-50/50 dark:bg-slate-950/40 px-6 py-3 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <div className="flex gap-4">
              <span><strong className="text-slate-500 dark:text-slate-400">Mises à jour :</strong> l'Atelier change les statuts directement</span>
              <span>•</span>
              <span><strong className="text-slate-500 dark:text-slate-400">Bureau :</strong> responsable de la saisie/suppression</span>
            </div>
            <span>Tableau synchronisé en continu</span>
          </div>

        </div>

        {/* Mobile View Alternative: layout cards for small screen readability */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Vue Mobile simplifiée ({filteredDeliveries.length})</h3>
          </div>

          {filteredDeliveries.map((item) => (
            <div 
              key={item.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-3.5 border-l-4 border-l-slate-400"
              style={{
                borderLeftColor: 
                  item.status === 'À saisir' ? '#f43f5e' : 
                  item.status === 'En cours de saisie' ? '#d97706' : 
                  item.status === 'Saisi' ? '#06b6d4' : 
                  item.status === 'Cliché en préparation' ? '#eab308' : 
                  item.status === 'En fabrication' ? '#3b82f6' : 
                  item.status === 'Prêt pour validation' ? '#9333ea' : '#10b981'
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{item.clientName}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{item.product}</p>
                </div>
                <span className="text-xs font-mono py-1 px-2.5 bg-slate-100 dark:bg-slate-950 rounded-lg text-slate-700 dark:text-slate-350 uppercase font-semibold border dark:border-slate-800">
                  {item.imprimeur}
                </span>
              </div>

              <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Quantité :</span>
                  <strong className="text-slate-800 dark:text-slate-100">{item.quantity}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Date :</span>
                  <strong className="text-slate-800 dark:text-slate-100">{new Date(item.date).toLocaleDateString('fr-FR')}</strong>
                </div>
                {item.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Téléphone :</span>
                    <strong className="text-slate-800 dark:text-slate-100 font-mono">{item.phone}</strong>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">Statut :</span>
                {/* direct select dropdown and formatting inside mobile space */}
                <select
                  value={item.status}
                  onChange={(e) => handleInlineStatusChange(item.id, e.target.value as DeliveryStatus)}
                  className={`flex-1 py-1.5 px-3 border rounded-xl text-xs font-bold outline-none cursor-pointer ${getStatusStyle(item.status)}`}
                >
                  <option value="À saisir">À saisir 🔴</option>
                  <option value="En cours de saisie">En cours de saisie 🟡</option>
                  <option value="Saisi">Saisi ℹ️</option>
                  <option value="Cliché en préparation">Cliché en préparation 🟠</option>
                  <option value="En fabrication">En fabrication 🔵</option>
                  <option value="Prêt pour validation">Prêt pour validation 🟣</option>
                  <option value="Terminé / Versions envoyées">Terminé / Versions envoyées 🟢</option>
                </select>
              </div>

              {item.notes && (
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 italic border border-slate-100 dark:border-slate-800 leading-normal">
                  <strong>Note: </strong> {item.notes}
                </div>
              )}

              {/* Mobile Actions tray */}
              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  onClick={() => setWhatsAppDelivery(item)}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => setHistoryDelivery(item)}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-50 dark:bg-blue-950/25 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Historique</span>
                </button>

                <button
                  onClick={() => {
                    setEditingDelivery(item);
                    setIsFormOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>

                {(user.role === 'bureau' || user.role === 'atelier') && (
                  <button
                    onClick={() => handleDeleteDelivery(item.id, item.clientName)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-200 mt-20 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Suivi de Livraisons - Atelier et Bureaux. Tous droits réservés.</p>
          <p className="mt-1 font-mono text-[10px] text-slate-350">Application réactive optimisée pour l'agilité logistique.</p>
        </div>
      </footer>

      {/* Custom sliding Delivery Form Right Drawer */}
      {isFormOpen && (
        <DeliveryForm
          deliveryToEdit={editingDelivery}
          userRole={user.role}
          onClose={() => {
            setIsFormOpen(false);
            setEditingDelivery(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Sharing options inside overlay */}
      {whatsAppDelivery && (
        <WhatsAppTemplateModal
          delivery={whatsAppDelivery}
          onClose={() => setWhatsAppDelivery(null)}
        />
      )}

      {/* Modal d'historique de suivi */}
      {historyDelivery && (
        <div id="history-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 dark:border-slate-800 space-y-4 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Historique des modifications</h3>
              </div>
              <button 
                onClick={() => setHistoryDelivery(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer text-xs font-semibold bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Client / Produit</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{historyDelivery.clientName}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{historyDelivery.product}</p>
            </div>

            <div className="relative border-l border-slate-200 dark:border-slate-700 pl-4 ml-2 space-y-4 py-2 max-h-60 overflow-y-auto">
              {(historyDelivery.history || [
                {
                  timestamp: historyDelivery.createdAt || historyDelivery.updatedAt || new Date().toISOString(),
                  user: historyDelivery.updatedBy || "bureau"
                }
              ]).slice().reverse().map((entry, index) => (
                <div key={index} className="relative">
                  {/* Timeline dot */}
                  <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500 ring-4 ring-white dark:ring-slate-900" />
                  
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Mise à jour : <span className="capitalize text-blue-650 dark:text-blue-400">{entry.user === 'bureau' ? 'Secrétariat Bureau' : 'Opérateur Atelier'}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-450 font-mono">
                      {new Date(entry.timestamp).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setHistoryDelivery(null)}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal to avoid browser window.confirm blocker */}
      {deletingDelivery && (
        <div id="delete-confirm-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 dark:border-slate-800 space-y-4 text-slate-800 dark:text-slate-100">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Confirmer la suppression</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement la livraison pour <strong className="text-slate-700 dark:text-slate-300">{deletingDelivery.clientName}</strong> ? Cette action est irréversible.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingDelivery(null)}
                className="flex-1 py-2 px-4 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-350 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-semibold cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deletingDelivery.id;
                  setDeletingDelivery(null);
                  await executeDelete(id);
                }}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
