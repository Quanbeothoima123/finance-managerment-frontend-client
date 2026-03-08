import type { AuthSession } from '../types/auth';

const AUTH_STORAGE_KEY = 'finance-app.auth.session';
export const AUTH_SESSION_EVENT = 'finance-app:auth-session-changed';

function canUseStorage() {
  return typeof window !== 'undefined';
}

function safeParse(value: string | null): AuthSession | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    return null;
  }
}

function notify(session: AuthSession | null) {
  if (!canUseStorage()) return;
  window.dispatchEvent(new CustomEvent<AuthSession | null>(AUTH_SESSION_EVENT, {
    detail: session,
  }));
}

export function getStoredSession(): AuthSession | null {
  if (!canUseStorage()) return null;

  const localSession = safeParse(window.localStorage.getItem(AUTH_STORAGE_KEY));
  if (localSession) return localSession;

  return safeParse(window.sessionStorage.getItem(AUTH_STORAGE_KEY));
}

export function setStoredSession(session: AuthSession) {
  if (!canUseStorage()) return;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);

  const target = session.rememberMe ? window.localStorage : window.sessionStorage;
  target.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  notify(session);
}

export function clearStoredSession() {
  if (!canUseStorage()) return;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  notify(null);
}
