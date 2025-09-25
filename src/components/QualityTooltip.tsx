import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, HelpCircle } from 'lucide-react';

interface QualityTooltipProps {
  title: string;
  description: string;
  children: React.ReactNode;
  variant?: 'info' | 'help';
}

export const QualityTooltip: React.FC<QualityTooltipProps> = ({ 
  title, 
  description, 
  children, 
  variant = 'info' 
}) => {
  const Icon = variant === 'help' ? HelpCircle : Info;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="relative inline-flex items-center">
            {children}
            <Icon className="h-3 w-3 ml-1 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity cursor-help" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default QualityTooltip;