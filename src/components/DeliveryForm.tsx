import React, { useState, useEffect } from 'react';
import { PlusCircle, X, Edit2, AlertCircle } from 'lucide-react';
import { Delivery, DeliveryStatus, UserRole } from '../types';

interface DeliveryFormProps {
  deliveryToEdit: Delivery | null;
  userRole: UserRole;
  onClose: () => void;
  onSubmit: (deliveryData: Partial<Delivery>) => Promise<void>;
}

export default function DeliveryForm({ deliveryToEdit, userRole, onClose, onSubmit }: DeliveryFormProps) {
  const isEditing = !!deliveryToEdit;
  
  const [clientName, setClientName] = useState('');
  const [imprimeur, setImprimeur] = useState('');
  const [phone, setPhone] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<DeliveryStatus>('Cliché en préparation');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize fields
  useEffect(() => {
    if (deliveryToEdit) {
      setClientName(deliveryToEdit.clientName);
      setImprimeur(deliveryToEdit.imprimeur);
      setPhone(deliveryToEdit.phone || '');
      setProduct(deliveryToEdit.product);
      setQuantity(deliveryToEdit.quantity);
      setDate(deliveryToEdit.date);
      setStatus(deliveryToEdit.status);
      setNotes(deliveryToEdit.notes);
    } else {
      // Set default date to today
      const todayISO = new Date().toISOString().split('T')[0];
      setClientName('');
      setImprimeur('');
      setPhone('');
      setProduct('');
      setQuantity(1);
      setDate(todayISO);
      setStatus('En cours de saisie');
      setNotes('');
    }
    setError(null);
  }, [deliveryToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !product.trim() || !date || !imprimeur.trim()) {
      setError("Les champs Client, Imprimeur, Produit et Date sont obligatoires.");
      return;
    }

    if (quantity <= 0) {
      setError("La quantité doit être supérieure à 0.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Partial<Delivery> = {
        clientName: clientName.trim(),
        imprimeur: imprimeur.trim(),
        phone: phone.trim(),
        product: product.trim(),
        quantity: Number(quantity),
        date,
        status: isEditing ? status : 'Saisi',
        notes: notes.trim(),
        updatedBy: userRole,
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError("Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Only "Bureau" can edit primary fields. "Atelier" can only change status.
  const isPrimaryDisabled = isEditing && userRole === 'atelier';

  return (
    <div id="delivery-form-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end z-50">
      <div className="bg-white h-screen w-full max-w-md shadow-2xl flex flex-col justify-between border-l border-slate-100 animate-slide-in">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Edit2 className="w-5 h-5 text-blue-500" />
            ) : (
              <PlusCircle className="w-5 h-5 text-emerald-500" />
            )}
            <h3 className="font-bold text-lg font-sans">
              {isEditing 
                ? (userRole === 'atelier' ? "Modifier le statut uniquement" : "Modifier la livraison") 
                : "Nouvelle livraison"
              }
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-800/80 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {isPrimaryDisabled && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                En tant que membre de l'<strong>Atelier</strong>, vous pouvez modifier uniquement le <strong>Statut</strong> et les <strong>Notes</strong>. Les champs primaires sont réservés au Bureau.
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Client Name */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="client-name">
              Nom du Client * :
            </label>
            <input
              type="text"
              id="client-name"
              disabled={isPrimaryDisabled}
              placeholder="Ex: Auto Prestige"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Imprimeur */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="imprimeur">
                Imprimeur * :
              </label>
              <input
                type="text"
                id="imprimeur"
                disabled={isPrimaryDisabled}
                placeholder="Ex: Imprimerie Alpha"
                value={imprimeur}
                onChange={(e) => setImprimeur(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-100"
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="date">
                Date * :
              </label>
              <input
                type="date"
                id="date"
                disabled={isPrimaryDisabled}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Phone number */}
            <div className="space-y-1 col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="phone-number">
                N° de Téléphone (WhatsApp) :
              </label>
              <input
                type="tel"
                id="phone-number"
                disabled={isPrimaryDisabled}
                placeholder="Ex : 33612345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-100"
              />
            </div>
          </div>

          {/* Product */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="product">
              Produit / Commande * :
            </label>
            <input
              type="text"
              id="product"
              disabled={isPrimaryDisabled}
              placeholder="Ex: Sacs Cadeaux"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-100"
              required
            />
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="quantity">
              Quantité * :
            </label>
            <input
              type="number"
              id="quantity"
              disabled={isPrimaryDisabled}
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm disabled:bg-slate-50 disabled:text-slate-500"
              required
            />
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="status">
              Statut * :
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as DeliveryStatus)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all outline-none text-sm font-medium text-slate-700 cursor-pointer"
            >
              <option value="À saisir">🔴 À saisir</option>
              <option value="En cours de saisie">🟡 En cours de saisie</option>
              <option value="Saisi">ℹ️ Saisi</option>
              <option value="Cliché en préparation">🟠 Cliché en préparation</option>
              <option value="En fabrication">🔵 En fabrication</option>
              <option value="Prêt pour validation">🟣 Prêt pour validation</option>
              <option value="Terminé / Versions envoyées">🟢 Terminé / Versions envoyées</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="notes">
              Notes :
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Ex: Livraison directe à l'accueil, urgence sur les couleurs..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm resize-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-100 p-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-sm rounded-xl transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="flex-[1.5] py-2.5 px-4 bg-slate-900 hover:bg-slate-850 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Valider"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
