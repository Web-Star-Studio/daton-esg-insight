import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface DashboardGHGHeaderProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  isCached: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function DashboardGHGHeader({
  dateRange,
  onDateRangeChange,
  isCached,
  onRefresh,
  isRefreshing,
}: DashboardGHGHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4" data-tour="dashboard-ghg-header">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard de Emissões (GHG)</h1>
        <p className="text-muted-foreground mt-1">
          Análise detalhada das emissões de Gases de Efeito Estufa
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <div className={`h-2 w-2 rounded-full mr-1 ${isCached ? 'bg-success' : 'bg-warning'}`} />
            {isCached ? 'Dados em cache' : 'Dados atualizando'}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Período de Análise</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy")
                )
              ) : (
                <span>Selecione o período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
