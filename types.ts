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
  amount?: number;
}

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface AuditLog {
  user: string;
  role: Role;
  action: string;
  timestamp: string;
}

export interface DossierPaiement {
  id: string;
  taxpayerName: string;
  taxId: string;
  taxDetails: TaxDetail[];
  amountDue?: number;
  status: DossierStatus;
  creationDate: string;
  validationDate?: string;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  bankName?: string;
  cancellationReason?: string;
  createdBy: string;
  managedBy?: string;
  paidTo?: string;
  history: AuditLog[];
}