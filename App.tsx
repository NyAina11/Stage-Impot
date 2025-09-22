
import React from 'react';
import { AppProvider, useAppStore } from './store/useAppStore';
import LoginScreen from './components/LoginScreen';
import Layout from './components/Layout';

const AppContent: React.FC = () => {
    const { currentUser } = useAppStore();

    if (!currentUser) {
        return <LoginScreen />;
    }

    return <Layout />;
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
                <AppContent />
            </div>
        </AppProvider>
    );
};

export default App;
