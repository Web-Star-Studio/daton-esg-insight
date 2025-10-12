import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUnifiedTour } from '@/contexts/UnifiedTourContext';
import { HelpCircle, Play, CheckCircle2 } from 'lucide-react';
import { tourDefinitions } from './tourDefinitions';

export function TourTriggerButton() {
  const { startTour, isTourCompleted } = useUnifiedTour();

  const tours = Object.values(tourDefinitions);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Tours Interativos
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel>Escolha um Tour</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {tours.map((tour) => {
          const completed = isTourCompleted(tour.id);
          
          return (
            <DropdownMenuItem
              key={tour.id}
              onClick={() => startTour(tour.id)}
              className="flex items-start gap-3 cursor-pointer"
            >
              <div className="mt-0.5">
                {completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Play className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="font-medium text-sm">{tour.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {tour.description}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
