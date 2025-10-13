import React from 'react';

interface TourProgressProps {
  current: number;
  total: number;
}

export function TourProgress({ current, total }: TourProgressProps) {
  return (
    <div className="flex flex-col items-end gap-1.5 min-w-[70px]">
      <div className="text-xs font-medium text-foreground tabular-nums">
        {current}/{total}
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
