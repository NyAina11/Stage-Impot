
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Role } from '../types';
import AccueilView from './views/AccueilView';
import GestionView from './views/GestionView';
import CaisseView from './views/CaisseView';
import ChefDivisionView from './views/ChefDivisionView';
import Button from './ui/Button';
import LogOutIcon from './icons/LogOutIcon';
import UserCheckIcon from './icons/UserCheckIcon';
import BellIcon from './icons/BellIcon';
import NotificationCenter from './NotificationCenter';
import PersonnelManagement from './PersonnelManagement';
import HistoriquePersonnelView from './views/HistoriquePersonnelView';

const RoleViewMap: Record<Role, React.ComponentType> = {
  [Role.ACCUEIL]: AccueilView,
  [Role.GESTION]: GestionView,
  [Role.CAISSE]: CaisseView,
  [Role.CHEF_DIVISION]: ChefDivisionView,
};

const Layout: React.FC = () => {
  const { currentUser, logout, unreadMessageCount, markAllMessagesAsRead } = useAppStore();
  const [isNotificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [showPersonnelManagement, setShowPersonnelManagement] = useState(false);
  const [showPersonnelHistory, setShowPersonnelHistory] = useState(false);

  if (!currentUser) {
    return null; 
  }

  const ViewComponent = RoleViewMap[currentUser.role];

  const handleNotificationClick = () => {
    setNotificationCenterOpen(true);
    if (unreadMessageCount > 0) {
      markAllMessagesAsRead();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
              ASCF - Suivi Fiscal
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <UserCheckIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="font-medium">{currentUser.username}</span>
                <span className="text-gray-500 dark:text-gray-400">({currentUser.role})</span>
              </div>
              <div className="relative">
                <Button variant="ghost" onClick={handleNotificationClick} className="relative">
                  <BellIcon className="w-6 h-6" />
                  {unreadMessageCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500" />
                  )}
                </Button>
              </div>
              <Button variant="secondary" onClick={logout} className="flex items-center space-x-2">
                <LogOutIcon className="w-5 h-5" />
                <span>Déconnexion</span>
              </Button>
              {currentUser.role === Role.CHEF_DIVISION && (
                <>
                  <Button onClick={() => setShowPersonnelManagement(!showPersonnelManagement)}>
                    {showPersonnelManagement ? 'Voir le tableau de bord' : 'Gérer le personnel'}
                  </Button>
                  <Button onClick={() => setShowPersonnelHistory(!showPersonnelHistory)}>
                    {showPersonnelHistory ? 'Voir le tableau de bord' : 'Voir l\'historique'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showPersonnelManagement ? (
          <PersonnelManagement />
        ) : showPersonnelHistory ? (
          <HistoriquePersonnelView />
        ) : (
          ViewComponent && <ViewComponent />
        )}
      </main>
      {isNotificationCenterOpen && <NotificationCenter onClose={() => setNotificationCenterOpen(false)} />}
    </div>
  );
};

export default Layout;

