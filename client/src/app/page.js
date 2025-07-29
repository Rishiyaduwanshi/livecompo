'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import AuthForm from '../components/AuthForm';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const { isAuthenticated, setupAxiosInterceptor, checkAuth, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
    setupAxiosInterceptor();
  }, [setupAxiosInterceptor]);

  useEffect(() => {
    const initAuth = async () => {
      if (mounted && _hasHydrated && !authChecked) {
        await checkAuth();
        setAuthChecked(true);
      }
    };
    
    initAuth();
  }, [mounted, _hasHydrated, authChecked, checkAuth]);

  // Wait for component mount, store hydration, and auth check
  if (!mounted || !_hasHydrated || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LiveCompo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {isAuthenticated ? <Dashboard /> : <AuthForm />}
    </div>
  );
}
