import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';
import { login as apiLogin } from '../src/services/api';


const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { setUser, setToken } = useAppStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Handle login
      const response = await apiLogin(username, password);
      const { token, user } = response.data;
    
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);
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
            {error && <p className="text-red-500 text-sm">{error}</p>}
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
