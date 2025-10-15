// Granular progress tracking for file uploads with visual feedback
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStep {
  label: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress?: number;
}

interface AttachmentProgressBarProps {
  fileName: string;
  steps: ProgressStep[];
  overallProgress: number;
}

export function AttachmentProgressBar({ 
  fileName, 
  steps, 
  overallProgress 
}: AttachmentProgressBarProps) {
  return (
    <div className="space-y-3 p-4 bg-card border rounded-xl">
      {/* File name and overall progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold truncate flex-1">{fileName}</p>
          <span className="text-xs font-mono text-muted-foreground ml-2">
            {Math.round(overallProgress)}%
          </span>
        </div>
        
        {/* Overall progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/80"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Detailed steps */}
      <div className="space-y-2">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center gap-3"
          >
            {/* Status icon */}
            <div className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
              step.status === 'complete' && "bg-success/10",
              step.status === 'processing' && "bg-warning/10",
              step.status === 'error' && "bg-destructive/10",
              step.status === 'pending' && "bg-muted"
            )}>
              {step.status === 'complete' && (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
              {step.status === 'processing' && (
                <Loader2 className="h-4 w-4 text-warning animate-spin" />
              )}
              {step.status === 'error' && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              {step.status === 'pending' && (
                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              )}
            </div>

            {/* Step label and mini progress */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-xs",
                step.status === 'complete' && "text-muted-foreground line-through",
                step.status === 'processing' && "text-foreground font-medium",
                step.status === 'error' && "text-destructive",
                step.status === 'pending' && "text-muted-foreground"
              )}>
                {step.label}
              </p>
              
              {step.status === 'processing' && step.progress !== undefined && (
                <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                  <motion.div
                    className="h-full bg-warning"
                    initial={{ width: 0 }}
                    animate={{ width: `${step.progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
