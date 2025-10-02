
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import Button from './ui/Button';
import { ResourceOrder } from '../types';

interface NotificationCenterProps {
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const { resourceOrders, confirmResourceOrderReceipt, resourceOrdersLoading, currentUser } = useAppStore();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={onClose}>
      <div
        className="absolute top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out translate-x-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Notifications Ressources</h2>
          <Button variant="ghost" onClick={onClose}>X</Button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-5rem)]">
          {resourceOrdersLoading && <p className="p-4 text-center">Chargement...</p>}
          {!resourceOrdersLoading && resourceOrders.length === 0 && (
            <p className="p-4 text-center text-gray-500 dark:text-gray-400">
              Aucune commande de ressources.
            </p>
          )}
          {!resourceOrdersLoading && resourceOrders
            .filter(order => currentUser?.role !== 'Accueil' && order.targetDivision === currentUser?.role)
            .map((order: ResourceOrder) => (
            <div key={order.id} className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ressource: {order.resourceType}
              </p>
              <p className="my-1">Quantité: {order.quantity} {order.unit}</p>
              {order.description && <p className="my-1 text-sm">{order.description}</p>}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(order.createdAt).toLocaleString('fr-FR')}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  order.status === 'En attente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  order.status === 'Livré' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {order.status}
                </span>
              </div>
              {order.status === 'Livré' && currentUser?.role !== 'Accueil' && (
                <div className="mt-2">
                  <Button size="sm" onClick={() => confirmResourceOrderReceipt(order.id)}>
                    Confirmer réception
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
