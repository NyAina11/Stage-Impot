
import { User, Role } from './types';

export const USERS: User[] = [
  { id: 'user1', name: 'Alice Dubois', role: Role.ACCUEIL },
  { id: 'user2', name: 'Bernard Martin', role: Role.GESTION },
  { id: 'user3', name: 'Catherine Petit', role: Role.CAISSE },
  { id: 'user4', name: 'David Leroy', role: Role.CHEF_DIVISION },
];

export const TAX_TYPES = [
  'TVA (Taxe sur la Valeur Ajoutée Intrérieure)',
  'IRSA (Impôt sur les Revenus Salariaux)',
  'IR (Impôt sur le Revenu)',
  'Acompte de l\'impot sur les revenus des résidents',
  'ISI (Impôt Synthétique Intermittent)',
  'Droits d\'accise Intérieure',
  'Droit sur les actes et mutations à titre onéreux',
  'Prelevement sur les bieres et boissons alcooliques',
  'Taxe spéciale pour la  jeunesse et sports'

];
