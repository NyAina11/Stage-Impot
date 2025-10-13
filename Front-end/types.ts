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
  bankName?: string;
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

export enum ResourceType {
  PAPIER = 'Papier',
  ENCRE_NOIR = 'Encre noir',
  ENCRE_COULEUR = 'Encre couleur',
  TONER = 'Toner',
  CARTOUCHE = 'Cartouche',
  STYLOS = 'Stylos',
  AGRAFEUSES = 'Agrafeuses',
  CLASSEURS = 'Classeurs',
  AUTRES = 'Autres'
}

export enum ResourceOrderStatus {
  EN_ATTENTE = 'En attente',
  LIVRE = 'Livré',
  RECU = 'Reçu'
}

export interface ResourceOrder {
  id: string;
  resourceType: ResourceType;
  quantity: number;
  unit: string; // 'rames', 'pièces', 'boîtes', etc.
  description?: string;
  requestedBy: string; // user ID
  requestedByRole: Role;
  targetDivision: Role; // division qui va recevoir
  createdAt: string;
  status: ResourceOrderStatus;
  deliveredBy?: string; // user ID qui a livré
  deliveredAt?: string;
  receivedBy?: string; // user ID qui a confirmé réception
  receivedAt?: string;
  notes?: string;
}

export interface Personnel {
  id: string;
  name: string;
  division: Role;
  affectation: string;
  history: PersonnelHistory[];
}

export interface PersonnelHistory {
  division: Role;
  affectation: string;
  startDate: string;
  endDate: string | null;
}
