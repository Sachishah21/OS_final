import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { hashMasterKey } from '../lib/crypto';

interface AuthContextType {
  userId: string | null;
  masterKey: string | null;
  isAuthenticated: boolean;
  login: (masterKey: string, userId: string) => void;
  logout: () => void;
  createAccount: (masterKey: string, email?: string, phoneNumber?: string) => Promise<string>;
  verifyMasterKey: (masterKey: string) => Promise<{ success: boolean; userId?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [masterKey, setMasterKey] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  const isAuthenticated = !!userId && !!masterKey;

  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      if (timeSinceLastActivity > 30000) {
        logout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity]);

  const login = (key: string, id: string) => {
    setMasterKey(key);
    setUserId(id);
    setLastActivity(Date.now());
  };

  const logout = () => {
    setMasterKey(null);
    setUserId(null);
  };

  const createAccount = async (masterKey: string, email?: string, phoneNumber?: string): Promise<string> => {
    const keyHash = await hashMasterKey(masterKey);

    const recoveryCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const { data, error } = await supabase.auth.signUp({
      email: email || `user_${Date.now()}@securevault.local`,
      password: masterKey,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Failed to create account');
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: email || null,
        phone_number: phoneNumber || null,
        master_key_hash: keyHash,
        recovery_code: recoveryCode,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return data.user.id;
  };

  const verifyMasterKey = async (key: string): Promise<{ success: boolean; userId?: string }> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `user@securevault.local`,
      password: key,
    });

    if (authError) {
      const keyHash = await hashMasterKey(key);
      const { data: users, error: queryError } = await supabase
        .from('users')
        .select('id, master_key_hash')
        .eq('master_key_hash', keyHash)
        .maybeSingle();

      if (queryError || !users) {
        return { success: false };
      }

      return { success: true, userId: users.id };
    }

    return { success: true, userId: authData.user?.id };
  };

  return (
    <AuthContext.Provider value={{ userId, masterKey, isAuthenticated, login, logout, createAccount, verifyMasterKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
