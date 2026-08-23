'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Truck,
  Package,
  Users,
  Settings,
  Search,
  ArrowRight,
  Home,
  LogIn,
  UserPlus,
  Shield,
  FileText,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { navigate } = useRouter();
  const { state: authState } = useAuth();

  const buildCommands = useCallback((): CommandItem[] => {
    const commands: CommandItem[] = [];

    // Navigation commands (always available)
    commands.push(
      { id: 'home', label: 'Go to Home', description: 'Return to landing page', icon: Home, action: () => navigate('/'), category: 'Navigation' },
      { id: 'login', label: 'Sign In', description: 'Log in to your account', icon: LogIn, action: () => navigate('/login'), category: 'Navigation' },
      { id: 'signup', label: 'Sign Up', description: 'Create a new account', icon: UserPlus, action: () => navigate('/signup'), category: 'Navigation' },
      { id: 'privacy', label: 'Privacy Policy', description: 'Data protection & privacy practices', icon: Shield, action: () => navigate('/privacy'), category: 'Legal' },
      { id: 'terms', label: 'Terms & Conditions', description: 'Service terms and usage rules', icon: FileText, action: () => navigate('/terms'), category: 'Legal' },
    );

    // Role-specific commands
    if (authState.user) {
      const role = authState.user.role;
      if (role === 'MANAGER' || role === 'ADMIN') {
        commands.push(
          { id: 'm-dashboard', label: 'Dashboard', description: 'Operations control desk', icon: LayoutDashboard, action: () => navigate('/manager/dashboard'), category: 'Manager' },
          { id: 'm-fleet', label: 'Fleet Tracker', description: 'Live vehicle tracking map', icon: Truck, action: () => navigate('/manager/fleet'), category: 'Manager' },
          { id: 'm-shipments', label: 'Shipments', description: 'Manage all shipments', icon: Package, action: () => navigate('/manager/shipments'), category: 'Manager' },
          { id: 'm-drivers', label: 'Drivers', description: 'Manage driver profiles', icon: Users, action: () => navigate('/manager/drivers'), category: 'Manager' },
          { id: 'm-settings', label: 'Settings', description: 'Account & security', icon: Settings, action: () => navigate('/manager/settings'), category: 'Manager' },
        );
      } else if (role === 'CLIENT') {
        commands.push(
          { id: 'c-dashboard', label: 'My Shipments', description: 'View and create shipments', icon: LayoutDashboard, action: () => navigate('/client/dashboard'), category: 'Client' },
          { id: 'c-track', label: 'Track Shipment', description: 'Live shipment tracking', icon: Truck, action: () => navigate('/client/track'), category: 'Client' },
        );
      } else if (role === 'DRIVER') {
        commands.push(
          { id: 'd-dashboard', label: 'My Dashboard', description: 'Active deliveries and route', icon: LayoutDashboard, action: () => navigate('/driver/dashboard'), category: 'Driver' },
          { id: 'd-route', label: 'My Route', description: 'Navigation and route details', icon: Truck, action: () => navigate('/driver/route'), category: 'Driver' },
          { id: 'd-reports', label: 'Reports', description: 'Submit incident reports', icon: Package, action: () => navigate('/driver/report'), category: 'Driver' },
        );
      }
    }

    return commands;
  }, [authState.user, navigate]);

  const commands = buildCommands();

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Group filtered commands by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center border-b px-4">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            autoFocus
            aria-label="Search application commands"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-12 bg-transparent outline-none text-sm placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 text-[11px] font-medium text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {Object.keys(grouped).length === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">No results found.</div>
          )}
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {category}
              </div>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      setOpen(false);
                      setQuery('');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-slate-400 truncate">{item.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-t px-4 py-2.5 text-[11px] text-slate-400 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
            Close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
