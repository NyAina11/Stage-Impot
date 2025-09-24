
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Role } from '../types';
import AccueilView from './views/AccueilView';
import GestionView from './views/GestionView';
import CaisseView from './views/CaisseView';
import ChefDivisionView from './views/ChefDivisionView';
import Button from './ui/Button';
import LogOutIcon from './icons/LogOutIcon';
import UserCheckIcon from './icons/UserCheckIcon';

const RoleViewMap: Record<Role, React.ComponentType> = {
  [Role.ACCUEIL]: AccueilView,
  [Role.GESTION]: GestionView,
  [Role.CAISSE]: CaisseView,
  [Role.CHEF_DIVISION]: ChefDivisionView,
};

const Layout: React.FC = () => {
  const { currentUser, logout, p2pConnected, p2pRoomId, connectP2P, disconnectP2P, remoteAudio } = useAppStore();
  const [room, setRoom] = React.useState('');

  if (!currentUser) {
    return null; 
  }

  const ViewComponent = RoleViewMap[currentUser.role];

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
                <span className="font-medium">{currentUser.name}</span>
                <span className="text-gray-500 dark:text-gray-400">({currentUser.role})</span>
              </div>
              <div className="flex items-center space-x-2">
                {!p2pConnected ? (
                  <>
                    <input
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="Room ID"
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <Button variant="primary" onClick={() => room && connectP2P(room)}>Se connecter P2P</Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-green-600">P2P: {p2pRoomId}</span>
                    <Button variant="secondary" onClick={disconnectP2P}>Quitter</Button>
                  </>
                )}
              </div>
              <Button variant="secondary" onClick={logout} className="flex items-center space-x-2">
                <LogOutIcon className="w-5 h-5" />
                <span>Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {ViewComponent && <ViewComponent />}
        {/* Hidden audio elements for remote streams */}
        <div style={{ display: 'none' }}>
          {remoteAudio.map(({ userId, stream }) => (
            <audio key={userId} autoPlay ref={(el) => { if (el && stream) el.srcObject = stream; }} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Layout;
