'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import t from '@/locales/en.json';

function getGreeting(hour: number): string {
  if (hour < 12) return t.greeting.goodMorning;
  if (hour < 17) return t.greeting.goodAfternoon;
  return t.greeting.goodEvening;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

interface LiveGreetingProps {
  name: string;
}

export default function LiveGreeting({ name }: LiveGreetingProps) {
  const [time, setTime] = useState(() => new Date());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const id = setInterval(() => {
      if (mounted.current) setTime(new Date());
    }, 1000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, []);

  if (!time) return null;

  const greeting = getGreeting(time.getHours());

  return (
    <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
      <Clock className="w-3.5 h-3.5" />
      {greeting}, {name} &middot; {formatTime(time)}
    </span>
  );
}
