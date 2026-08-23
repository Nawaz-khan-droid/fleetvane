'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import type { UserPayload, UserRole } from '@/types';

// ─── State Shape ─────────────────────────────────────────────
interface AuthState {
  user: UserPayload | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// ─── Actions ─────────────────────────────────────────────────
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: UserPayload; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: string | null };

// ─── Reducer: Pure state transitions ─────────────────────────
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return { user: null, token: null, isLoading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
}

// ─── Helper: normalize user payload ─────────────────────────
function normalizeUser(rawUser: any): UserPayload {
  if (!rawUser) return rawUser;
  const id = rawUser.userId || rawUser.id || '';
  return {
    ...rawUser,
    userId: id,
    id: id,
  };
}

// ─── Context ─────────────────────────────────────────────────
interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<UserPayload>;
  signup: (name: string, email: string, password: string, companyName: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  // On mount, try to refresh the token using the HttpOnly cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          const user = normalizeUser(data.user);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, token: data.token || data.accessToken },
          });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (err) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || 'Login failed');
      const user: UserPayload = normalizeUser(data.user);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: data.token || data.accessToken } });
      return user;
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
      throw err;
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, companyName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          companyName: companyName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || 'Signup failed');
      // Auto-login after signup
      const user: UserPayload = normalizeUser(data.user);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: data.token || data.accessToken } });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    dispatch({ type: 'LOGOUT' });
  }, []);

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) => {
      if (!state.user) return false;
      const arr = Array.isArray(roles) ? roles : [roles];
      return arr.includes(state.user.role as UserRole);
    },
    [state.user]
  );

  return (
    <AuthContext.Provider value={{ state, login, signup, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
