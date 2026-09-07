import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { GovernmentUser } from '../types/government';
import { govAuthService } from '../services/govAuthService';
import { govService } from '../services/govService';

interface GovAuthContextType {
  govUser: GovernmentUser | null;
  loading: boolean;
  login: (token: string, user: GovernmentUser) => void;
  logout: () => void;
  refreshGovUser: () => Promise<void>;
  setGovUser: (user: GovernmentUser | null) => void;
}

const GovAuthContext = createContext<GovAuthContextType | undefined>(undefined);

export function GovAuthProvider({ children }: { children: ReactNode }) {
  const [govUser, setGovUser] = useState<GovernmentUser | null>(() => {
    // Synchronously initialise from localStorage so the very first render
    // already has the user if one exists.  This prevents the flash where
    // GovProtectedRoute sees govUser=null and redirects to login.
    try {
      const stored = localStorage.getItem('csai_gov_user');
      const token  = localStorage.getItem('csai_gov_token');
      if (token && stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Verify the token in the background; if it fails, clear state.
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('csai_gov_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const user = await govService.getMe();
        setGovUser(user);
        localStorage.setItem('csai_gov_user', JSON.stringify(user));
      } catch (error) {
        console.error('Failed to verify government auth token', error);
        localStorage.removeItem('csai_gov_token');
        localStorage.removeItem('csai_gov_user');
        setGovUser(null);
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = useCallback((token: string, user: GovernmentUser) => {
    localStorage.setItem('csai_gov_token', token);
    localStorage.setItem('csai_gov_user', JSON.stringify(user));
    setGovUser(user);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await govAuthService.logout();
    setGovUser(null);
  }, []);

  const refreshGovUser = useCallback(async () => {
    try {
      const user = await govService.getMe();
      setGovUser(user);
      localStorage.setItem('csai_gov_user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to refresh government user', error);
    }
  }, []);

  return (
    <GovAuthContext.Provider value={{ govUser, loading, login, logout, refreshGovUser, setGovUser }}>
      {children}
    </GovAuthContext.Provider>
  );
}

export function useGovAuth() {
  const context = useContext(GovAuthContext);
  if (context === undefined) {
    throw new Error('useGovAuth must be used within a GovAuthProvider');
  }
  return context;
}
