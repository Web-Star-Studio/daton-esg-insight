/**
 * Notification Badge Component
 * Shows notification count on sidebar items
 */

import { cn } from "@/lib/utils";

interface BadgeNotificationProps {
  count: number;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  className?: string;
  maxCount?: number;
}

const variantStyles = {
  default: 'bg-primary text-primary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  warning: 'bg-orange-500 text-white',
  success: 'bg-green-500 text-white',
};

export function BadgeNotification({ 
  count, 
  variant = 'default',
  className,
  maxCount = 99 
}: BadgeNotificationProps) {
  if (count <= 0) return null;
  
  const displayCount = count > maxCount ? `${maxCount}+` : count;
  
  return (
    <span 
      className={cn(
        "inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-bold rounded-full",
        "animate-fade-in shadow-sm ring-2 ring-background",
        variantStyles[variant],
        className
      )}
    >
      {displayCount}
    </span>
  );
}

interface StatusIndicatorProps {
  status: 'active' | 'pending' | 'expired' | 'warning';
  pulse?: boolean;
  className?: string;
}

const statusStyles = {
  active: 'bg-green-500',
  pending: 'bg-yellow-500',
  expired: 'bg-red-500',
  warning: 'bg-orange-500',
};

export function StatusIndicator({ status, pulse = false, className }: StatusIndicatorProps) {
  return (
    <span 
      className={cn(
        "inline-flex h-2 w-2 rounded-full",
        statusStyles[status],
        pulse && "animate-pulse",
        className
      )}
    />
  );
}