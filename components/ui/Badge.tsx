
import React from 'react';
import { DossierStatus } from '../../types';

interface BadgeProps {
  status: DossierStatus;
}

const statusColors: Record<DossierStatus, string> = {
  [DossierStatus.EN_ATTENTE_DE_CALCUL]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [DossierStatus.EN_ATTENTE_DE_PAIEMENT]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [DossierStatus.PAYE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [DossierStatus.ANNULE]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const Badge: React.FC<BadgeProps> = ({ status }) => {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
      {status}
    </span>
  );
};

export default Badge;
