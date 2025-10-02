
import React from 'react';
import { DossierStatus } from '../../types';

interface BadgeProps {
  status?: DossierStatus;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  children?: React.ReactNode;
}

const statusColors: Record<DossierStatus, string> = {
  [DossierStatus.EN_ATTENTE_DE_CALCUL]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [DossierStatus.EN_ATTENTE_DE_PAIEMENT]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [DossierStatus.PAYE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [DossierStatus.ANNULE]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const variantColors: Record<string, string> = {
  primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

const Badge: React.FC<BadgeProps> = ({ status, variant, children }) => {
  let colorClass = '';
  let content = children;
  
  if (status) {
    colorClass = statusColors[status];
    content = status;
  } else if (variant) {
    colorClass = variantColors[variant];
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
      {content}
    </span>
  );
};

export default Badge;
