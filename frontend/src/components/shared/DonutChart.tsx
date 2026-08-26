'use client';

import React from 'react';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export default function DonutChart({
  data,
  size = 160,
  centerLabel = 'Total',
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const displayValue = centerValue ?? String(total);

  // SVG circle parameters
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Pre-compute segments with cumulative offsets using reduce
  const computedSegments = data.reduce<Array<{ label: string; value: number; color: string; pct: number; dashLength: number; dashOffset: number }>>((acc, segment) => {
    const pct = total > 0 ? segment.value / total : 0;
    const prevCumulative = acc.reduce((s, seg) => s + seg.pct, 0);
    const dashLength = pct * circumference;
    const dashOffset = -prevCumulative * circumference;
    return [...acc, { ...segment, pct, dashLength, dashOffset }];
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {computedSegments.map((segment) => (
            <circle
              key={segment.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.dashLength} ${circumference - segment.dashLength}`}
              strokeDashoffset={segment.dashOffset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {displayValue}
          </span>
          <span className="text-[11px] text-slate-500">{centerLabel}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4">
        {data.map((segment) => (
          <div key={segment.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {segment.label}
            </span>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-300">
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
