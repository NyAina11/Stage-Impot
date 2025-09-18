
import { User, Role } from './types';

export const USERS: User[] = [
  { id: 'user1', name: 'Alice Dubois', role: Role.ACCUEIL },
  { id: 'user2', name: 'Bernard Martin', role: Role.GESTION },
  { id: 'user3', name: 'Catherine Petit', role: Role.CAISSE },
  { id: 'user4', name: 'David Leroy', role: Role.CHEF_DIVISION },
];

export const TAX_TYPES = ['TVA (Taxe sur la Valeur Ajoutée)', 'IRSA (Impôt sur les Revenus Salariaux et Assimilés)', 'IS (Impôt sur les Sociétés)', 'IR (Impôt sur le Revenu)', 'Droits d\'accise'];
