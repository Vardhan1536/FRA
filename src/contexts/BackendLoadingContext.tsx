import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface BackendLoadingContextType {
  isBackendLoading: boolean;
  setIsBackendLoading: (loading: boolean) => void;
  backendStatus: 'checking' | 'loading' | 'ready' | 'error';
  setBackendStatus: (status: 'checking' | 'loading' | 'ready' | 'error') => void;
  checkBackendHealth: () => Promise<void>;
  currentMessageIndex: number;
  loadingMessages: string[];
}

const BackendLoadingContext = createContext<BackendLoadingContextType>({} as BackendLoadingContextType);

export const useBackendLoading = () => {
  const context = useContext(BackendLoadingContext);
  if (!context) {
    throw new Error('useBackendLoading must be used within a BackendLoadingProvider');
  }
  return context;
};

export const BackendLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBackendLoading, setIsBackendLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'loading' | 'ready' | 'error'>('checking');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const loadingMessages = [
    "Please wait till the backend loads completely",
    "Startup is taking place",
    "API is being checked",
    "Beneficiary details are being fetched",
    "Alerts are being verified",
    "Chat bot for legal assistance is getting ready",
    "Atlas is getting ready to display",
    "Backend will be loaded shortly"
  ];

  // Rotate messages every 30 seconds
  useEffect(() => {
    if (!isBackendLoading) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 60000); // 30 seconds

    return () => clearInterval(interval);
  }, [isBackendLoading, loadingMessages.length]);

  const checkBackendHealth = useCallback(async () => {
    try {
      setBackendStatus('checking');
      
      // Try to ping the backend health endpoint
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        setBackendStatus('ready');
        setIsBackendLoading(false);
      } else {
        throw new Error('Backend not ready');
      }
    } catch (error) {
      console.log('Backend not ready yet, continuing to check...');
      setBackendStatus('loading');
      
      // Retry after 3 seconds
      setTimeout(() => {
        checkBackendHealth();
      }, 3000);
    }
  }, []);

  // Start checking backend health when component mounts
  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  const value = {
    isBackendLoading,
    setIsBackendLoading,
    backendStatus,
    setBackendStatus,
    checkBackendHealth,
    currentMessageIndex,
    loadingMessages
  };

  return (
    <BackendLoadingContext.Provider value={value}>
      {children}
    </BackendLoadingContext.Provider>
  );
};
