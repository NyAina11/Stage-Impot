
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { USERS } from '../constants';
import Button from './ui/Button';
import Card from './ui/Card';

const LoginScreen: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>(USERS[0]?.id || '');
  const { login } = useAppStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
      login(selectedUserId);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <form onSubmit={handleLogin}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">ASCF</h1>
            <p className="text-gray-600 dark:text-gray-300">Application de Suivi des Contributions Fiscales</p>
          </div>
          <div className="space-y-6">
            <div>
              <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sélectionner un utilisateur
              </label>
              <select
                id="user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {USERS.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LoginScreen;
