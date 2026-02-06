
import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import AppPage from './components/AppPage';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session
  useEffect(() => {
    const savedUser = localStorage.getItem('nwf_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (username: string, fullName: string) => {
    const newUser: User = {
      username,
      fullName,
      shares: 1250,
      shareValue: 1000, // Updated to 1000 AED
    };
    setUser(newUser);
    localStorage.setItem('nwf_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nwf_user');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {!user ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <AppPage user={user} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
