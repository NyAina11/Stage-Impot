export enum Role {
  ACCUEIL = 'Accueil',
  GESTION = 'Gestion',
  CAISSE = 'Caisse',
  CHEF_DIVISION = 'Chef de Division',
}

export enum DossierStatus {
  EN_ATTENTE_DE_CALCUL = 'En attente de calcul',
  EN_ATTENTE_DE_PAIEMENT = 'En attente de paiement',
  PAYE = 'Payé',
  ANNULE = 'Annulé',
}

export enum PaymentMethod {
  CHEQUE = 'Chèque',
  ESPECE = 'Espèce',
  VIREMENT = 'Virement bancaire',
}

export interface TaxDetail {
  name: string;
  amount: number;
}

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface PaymentDetails {
  processedBy: string;
  processedAt: string;
  chequeNumber?: string;
  bankTransferRef?: string;
}

export interface AuditLog {
  user: string;
  role: Role;
  action: string;
  timestamp: string;
}

export interface Dossier {
  id: string;
  taxpayerName: string; 
  taxPeriod: string; 
  status: DossierStatus;
  taxDetails: TaxDetail[];
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  managedBy?: string; // Added managedBy
  assignedToCaisse?: string; 
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetails; 
  cancelledBy?: string;
  cancelledAt?: string;
  reason?: string; 
}
