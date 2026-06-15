import React, { useState, useEffect } from 'react';
import { Send, Copy, Check, X } from 'lucide-react';
import { Delivery } from '../types';

interface WhatsAppTemplateModalProps {
  delivery: Delivery | null;
  onClose: () => void;
}

export default function WhatsAppTemplateModal({ delivery, onClose }: WhatsAppTemplateModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (delivery) {
      // Create a default French notification template based on delivery details
      const statusTextMap: Record<string, string> = {
        'À saisir': 'À saisir 🔴',
        'En cours de saisie': 'En cours de saisie 🟡',
        'Saisi': 'Saisi ℹ️',
        'Cliché en préparation': 'Cliché en préparation 🟠',
        'En fabrication': 'En fabrication 🔵',
        'Prêt pour validation': 'Prêt pour validation 🟣',
        'Terminé / Versions envoyées': 'Terminé / Versions envoyées 🟢'
      };

      const dateStr = new Date(delivery.date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const template = `Bonjour,\n\nConcernant votre livraison pour le client *${delivery.clientName}* (Imprimeur : *${delivery.imprimeur}*) du *${dateStr}* :\n\n📦 Produit : *${delivery.product}*\n🔢 Quantité : *${delivery.quantity}*\n🚦 Statut actuel : *${statusTextMap[delivery.status] || delivery.status}*${delivery.notes ? `\n\n📝 Notes : _${delivery.notes}_` : ''}\n\nL'équipe de Suivi de Livraisons.`;
      
      setMessage(template);
      // Autofill with the phone number stored in the delivery record, if available.
      setPhoneNumber(delivery.phone || '');
    }
  }, [delivery]);

  if (!delivery) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Échec de la copie", err);
    }
  };

  const handleSend = () => {
    // Sanitize phone number (remove spaces, symbols)
    const sanitizedPhone = phoneNumber.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    
    // Construct WhatsApp URL
    // If phone number is specified, open chat with them, otherwise open contact chooser
    const url = sanitizedPhone 
      ? `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`
      : `https://api.whatsapp.com/send?text=${encodedMessage}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="whatsapp-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            <h3 className="font-semibold text-lg font-sans">Notification WhatsApp</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-emerald-700/50 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Destinataire (Client / Partenaire) :
            </label>
            <p className="text-sm font-medium text-slate-800">{delivery.clientName} (Imprimeur : {delivery.imprimeur})</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="phone-input">
              Numéro de téléphone :
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none text-sm font-mono">
                📞
              </span>
              <input
                type="tel"
                id="phone-input"
                placeholder="Ex: 33612345678 (sans le signe +)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Saisir avec l'indicatif sans le signe + (ex: <strong>33</strong> pour la France puis le numéro).
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider" htmlFor="msg-textarea">
              Message pré-rédigé (Modifiable) :
            </label>
            <textarea
              id="msg-textarea"
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm font-sans resize-none leading-relaxed text-slate-700 bg-slate-50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copié !</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-transparent absolute pointer-events-none" />
                <span>Copier le texte</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="flex-[1.5] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>Envoyer sur WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
}
