import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import type { AuthSession, AuthUser, EmailOtpPayload, LoginPayload } from '../types/auth';
import {
  AUTH_SESSION_EVENT,
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from '../utils/authStorage';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  loginWithPassword: (payload: LoginPayload, rememberMe?: boolean) => Promise<AuthUser>;
  loginWithOtp: (payload: EmailOtpPayload, rememberMe?: boolean) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setSessionState(getStoredSession());
    setIsHydrated(true);

    const handleSessionChanged = (event: Event) => {
      const customEvent = event as CustomEvent<AuthSession | null>;
      setSessionState(customEvent.detail ?? null);
    };

    window.addEventListener(AUTH_SESSION_EVENT, handleSessionChanged as EventListener);
    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, handleSessionChanged as EventListener);
    };
  }, []);

  const setSession = useCallback((nextSession: AuthSession) => {
    setStoredSession(nextSession);
  }, []);

  const clearSession = useCallback(() => {
    clearStoredSession();
  }, []);

  const loginWithPassword = useCallback(async (payload: LoginPayload, rememberMe = true) => {
    const data = await authService.loginWithPassword(payload);
    setSession({
      accessToken: data.accessToken,
      user: data.user,
      rememberMe,
    });
    return data.user;
  }, [setSession]);

  const loginWithOtp = useCallback(async (payload: EmailOtpPayload, rememberMe = true) => {
    const data = await authService.verifyLoginOtp(payload);
    setSession({
      accessToken: data.accessToken,
      user: data.user,
      rememberMe,
    });
    return data.user;
  }, [setSession]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    isAuthenticated: !!session?.accessToken,
    isHydrated,
    loginWithPassword,
    loginWithOtp,
    logout,
    setSession,
    clearSession,
  }), [session, isHydrated, loginWithPassword, loginWithOtp, logout, setSession, clearSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
