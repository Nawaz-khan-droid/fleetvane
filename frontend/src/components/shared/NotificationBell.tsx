'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BellOff,
  CheckCheck,
  Trash2,
  Package,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotifications, type NotificationType } from '@/context/NotificationContext';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';

// ── Icon per notification type ──────────────────────────────
const typeIcon: Record<NotificationType, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const typeIconColor: Record<NotificationType, string> = {
  info: 'text-blue-500',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
};

const typeIconBg: Record<NotificationType, string> = {
  info: 'bg-blue-100 dark:bg-blue-950',
  success: 'bg-emerald-100 dark:bg-emerald-950',
  warning: 'bg-amber-100 dark:bg-amber-950',
  error: 'bg-red-100 dark:bg-red-950',
};

// ── Relative time formatter ─────────────────────────────────
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const then = date.getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1) return t.notifications.justNow;
  if (diffMin < 60) {
    return t.notifications.minutesAgo.replace('{count}', String(diffMin));
  }
  if (diffHr < 24) {
    return t.notifications.hoursAgo.replace('{count}', String(diffHr));
  }
  return date.toLocaleDateString();
}

// ── Component ───────────────────────────────────────────────
export default function NotificationBell() {
  const { state, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);

  const unreadCount = state.unreadCount;

  const handleItemClick = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAll = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAll();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            theme.darkMode.iconBtnHover
          }`}
          aria-label={t.notifications.title}
        >
          <div
            key={unreadCount}
            className={
              unreadCount > 0
                ? 'animate-[bell-ring_0.5s_ease-in-out]'
                : ''
            }
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>

          <style>{`
            @keyframes bell-ring {
              0% { transform: rotate(0); }
              15% { transform: rotate(15deg); }
              30% { transform: rotate(-15deg); }
              45% { transform: rotate(10deg); }
              60% { transform: rotate(-10deg); }
              75% { transform: rotate(5deg); }
              90% { transform: rotate(-5deg); }
              100% { transform: rotate(0); }
            }
          `}</style>

          {/* Red badge */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className={theme.notification.badge}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className={`${theme.notification.panel}`}
      >
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className={`font-semibold text-sm ${theme.typography.headingText}`}>
            {t.notifications.title}
          </h3>
          {state.notifications.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-500 hover:text-emerald-600"
                onClick={handleMarkAll}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                {t.notifications.markAllRead}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-500 hover:text-red-500"
                onClick={handleClearAll}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Notification list ────────────────────────── */}
        {state.notifications.length === 0 ? (
          <div className={theme.notification.empty}>
            <BellOff className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">{t.notifications.noNotifications}</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {state.notifications.map((notification) => {
              const Icon = typeIcon[notification.type];
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`${theme.notification.item} ${
                    !notification.read ? theme.notification.itemUnread : ''
                  }`}
                  onClick={() => handleItemClick(notification.id)}
                >
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                      typeIconBg[notification.type]
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${typeIconColor[notification.type]}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-medium ${
                          notification.read
                            ? 'text-slate-600 dark:text-slate-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {formatRelativeTime(notification.timestamp)}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {/* ── Footer ─────────────────────────────── */}
            <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {state.notifications.length} notification{state.notifications.length === 1 ? '' : 's'}
              </span>
              {state.unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  {t.notifications.markAllRead}
                </button>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
