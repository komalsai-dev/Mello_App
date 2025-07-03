import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';

export interface BackendStatus {
  isConnected: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
}

export function useBackend() {
  const [status, setStatus] = useState<BackendStatus>({
    isConnected: false,
    isChecking: false,
    lastChecked: null,
    error: null,
  });

  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      await api.healthCheck();
      setStatus({
        isConnected: true,
        isChecking: false,
        lastChecked: new Date(),
        error: null,
      });
    } catch (error) {
      setStatus({
        isConnected: false,
        isChecking: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  };

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Auto-reconnect every 30 seconds if disconnected
  useEffect(() => {
    if (!status.isConnected && !status.isChecking) {
      const interval = setInterval(checkConnection, 30000);
      return () => clearInterval(interval);
    }
  }, [status.isConnected, status.isChecking]);

  return {
    ...status,
    checkConnection,
  };
} 