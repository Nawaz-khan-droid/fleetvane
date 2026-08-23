'use client';

import React, { createContext, useContext, useReducer, useRef, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'CLEAR_ALL' };

interface NotificationContextValue {
  state: NotificationState;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

// ── Initial state ────────────────────────────────────────────
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

// ── Reducer ──────────────────────────────────────────────────
function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const updated = [action.payload, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }
    case 'MARK_READ': {
      const updated = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }
    case 'MARK_ALL_READ': {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      return {
        notifications: updated,
        unreadCount: 0,
      };
    }
    case 'CLEAR_ALL': {
      return {
        notifications: [],
        unreadCount: 0,
      };
    }
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────
const NotificationContext = createContext<NotificationContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const idCounter = useRef(0);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      idCounter.current += 1;
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          ...notification,
          id: `notif-${Date.now()}-${idCounter.current}`,
          timestamp: new Date(),
          read: false,
        },
      });
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_READ', payload: id });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  return (
    <NotificationContext.Provider
      value={{ state, addNotification, markAsRead, markAllAsRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────
export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
