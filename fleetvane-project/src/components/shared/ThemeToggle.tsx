'use client';

import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import t from '@/locales/en.json';
import { cn } from '@/lib/utils';

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, label: t.theme.light, icon: Sun },
    { value: 'dark' as const, label: t.theme.dark, icon: Moon },
    { value: 'system' as const, label: t.theme.system, icon: Monitor },
  ];

  const ActiveIcon = theme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg", className)}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme === 'dark' ? 'dark' : 'light'}
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center justify-center"
            >
              <ActiveIcon className="h-4 w-4" />
            </motion.span>
          </AnimatePresence>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Icon className="h-4 w-4" />
              <span>{opt.label}</span>
              {theme === opt.value && (
                <motion.div
                  layoutId="theme-check"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500"
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
