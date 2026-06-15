/**
 * Types de données pour l'application de suivi de livraisons
 */

export type DeliveryStatus = 
  | 'À saisir' 
  | 'En cours de saisie' 
  | 'Saisi' 
  | 'Cliché en préparation' 
  | 'En fabrication' 
  | 'Prêt pour validation' 
  | 'Terminé / Versions envoyées';

export interface HistoryEntry {
  timestamp: string;
  user: string;
}

export interface Delivery {
  id: string;
  clientName: string;
  imprimeur: string;
  phone: string;
  product: string;
  quantity: number;
  date: string; // Format YYYY-MM-DD
  status: DeliveryStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: 'bureau' | 'atelier';
  history?: HistoryEntry[];
}

export type UserRole = 'bureau' | 'atelier';

export interface UserSession {
  role: UserRole;
  userName: string;
}

export interface Stats {
  total: number;
  aSaisir: number;       // 'À saisir'
  enCoursSaisie: number; // 'En cours de saisie'
  saisi: number;         // 'Saisi'
  cliche: number;        // 'Cliché en préparation'
  fabrication: number;  // 'En fabrication'
  valReady: number;     // 'Prêt pour validation'
  completed: number;    // 'Terminé / Versions envoyées'
}
