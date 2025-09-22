import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import { login as apiLogin, register as apiRegister } from '../src/services/api';
import { Role } from '../types'; // Corrected import path for Role enum

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<Role>(Role.ACCUEIL); // Default role for registration
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const { setUser, setToken } = useAppStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegistering) {
        // Handle registration
        await apiRegister(username, password, role);
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        setIsRegistering(false); // Switch back to login after successful registration
        setUsername('');
        setPassword('');
      } else {
        // Handle login
        const response = await apiLogin(username, password);
        const { token, user } = response.data;
      
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        setToken(token);
        setUser(user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <form onSubmit={handleAuth}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">ASCF</h1>
            <p className="text-gray-600 dark:text-gray-300">Application de Suivi des Contributions Fiscales</p>
          </div>
          <div className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom d'utilisateur
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre nom d'utilisateur"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                required
              />
            </div>
            {isRegistering && (
              <div>
                <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rôle
                </label>
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {Object.values(Role).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">
              {isRegistering ? 'S\'inscrire' : 'Se connecter'}
            </Button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-primary-600 hover:underline dark:text-primary-400"
          >
            {isRegistering ? 'Déjà un compte ? Connectez-vous' : 'Pas de compte ? Inscrivez-vous'}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default LoginScreen;
