'use client';

import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import type { UserRole } from '@/types';

/**
 * ProtectedRoute — RBAC enforcement wrapper.
 * Reads role from AuthContext. If user is unauthenticated or
 * their role doesn't match `allowedRoles`, redirect to landing/login inside useEffect.
 */
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { state } = useAuth();
  const { navigate } = useRouter();

  const isAuthorized = !state.isLoading && !!state.user && allowedRoles.includes(state.user.role);

  useEffect(() => {
    if (!state.isLoading && (!state.user || !allowedRoles.includes(state.user.role))) {
      navigate('/login');
    }
  }, [state.isLoading, state.user, allowedRoles, navigate]);

  if (state.isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700" />
      </div>
    );
  }

  return <>{children}</>;
}
