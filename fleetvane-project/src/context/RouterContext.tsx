'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Router state ─────────────────────────────────────────────
interface RouterState {
  route: string;
  params: Record<string, string>;
  previousRoute: string;
}

interface RouterContextValue {
  route: string;
  params: Record<string, string>;
  previousRoute: string;
  navigate: (path: string, params?: Record<string, string>) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

// ─── Parse hash (SSR-safe) ──────────────────────────────────
function parseHashSafe(): RouterState {
  if (typeof window === 'undefined') return { route: '/', params: {}, previousRoute: '/' };
  const { route, params } = parseHash();
  return { route, params, previousRoute: '/' };
}

// ─── Parse hash into route + params (SSR-safe) ─────────────
function parseHash(): { route: string; params: Record<string, string> } {
  if (typeof window === 'undefined') return { route: '/', params: {} };
  let hash = window.location.hash.slice(1);
  if (hash.startsWith('#')) {
    hash = hash.replace(/^#+/, '');
  }

  let route = hash.split('?')[0];
  let qs = hash.split('?')[1];

  // If hash is empty or root, check if pathname provides the route (direct URL / F5 refresh)
  if (!route || route === '' || route === '/') {
    const pathname = window.location.pathname;
    if (pathname && pathname !== '/') {
      route = pathname;
      if (window.location.search) {
        qs = window.location.search.slice(1);
      }
    } else {
      route = '/';
    }
  }

  if (!route.startsWith('/')) {
    route = '/' + route;
  }

  const params: Record<string, string> = {};
  if (qs) {
    qs.split('&').forEach((pair) => {
      const [k, v] = pair.split('=');
      if (k && v !== undefined) params[k] = decodeURIComponent(v);
    });
  }

  // Also include query params from window.location.search if not already present
  if (typeof window !== 'undefined' && window.location.search) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.forEach((val, key) => {
      if (!params[key]) {
        params[key] = val;
      }
    });
  }

  return { route, params };
}

// ─── Provider ─────────────────────────────────────────────────
export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RouterState>(() => parseHashSafe());

  // Listen for hash and popstate changes (client-only subscription pattern)
  useEffect(() => {
    const handleRouteChange = () => {
      const p = parseHash();
      setState((prev) => ({
        route: p.route,
        params: p.params,
        previousRoute: prev.route,
      }));
    };
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const navigate = useCallback((path: string, params?: Record<string, string>) => {
    let cleanPath = path.trim();
    if (cleanPath.startsWith('#')) {
      cleanPath = cleanPath.replace(/^#+/, '');
    }
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    const qs = params && Object.keys(params).length > 0 ? '?' + new URLSearchParams(params).toString() : '';
    window.location.hash = cleanPath + qs;
    window.scrollTo(0, 0);
    setState((prev) => ({
      route: cleanPath,
      params: params || {},
      previousRoute: prev.route,
    }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      let target = prev.previousRoute;
      if (target.startsWith('#')) target = target.replace(/^#+/, '');
      if (!target.startsWith('/')) target = '/' + target;
      window.location.hash = target;
      return { route: target, params: {}, previousRoute: '/' };
    });
  }, []);

  return (
    <RouterContext.Provider value={{ ...state, navigate, goBack }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={state.route}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}