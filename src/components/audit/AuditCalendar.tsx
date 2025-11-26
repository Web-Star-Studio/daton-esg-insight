import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
}

interface AuditCalendarProps {
  audits: AuditEvent[];
  onDateSelect?: (date: Date) => void;
  onAuditClick?: (audit: AuditEvent) => void;
}

export function AuditCalendar({ audits = [], onDateSelect, onAuditClick }: AuditCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAuditsForDate = (date: Date) => {
    return audits.filter(audit => {
      try {
        const auditDate = parseISO(audit.date);
        return isSameDay(auditDate, date);
      } catch {
        return false;
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'planejada':
        return 'bg-blue-500';
      case 'em andamento':
        return 'bg-yellow-500';
      case 'concluída':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendário de Auditorias
              </CardTitle>
              <CardDescription>
                Visualize e gerencie auditorias agendadas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-lg font-semibold min-w-[200px] text-center">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                {day}
              </div>
            ))}
            
            {daysInMonth.map((day, idx) => {
              const dayAudits = getAuditsForDate(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  className={`
                    min-h-[100px] border rounded-lg p-2 cursor-pointer transition-colors
                    ${!isSameMonth(day, currentDate) ? 'bg-muted/50' : 'hover:bg-accent'}
                    ${isToday ? 'border-primary border-2' : ''}
                  `}
                  onClick={() => onDateSelect?.(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayAudits.slice(0, 2).map((audit) => (
                      <div
                        key={audit.id}
                        className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(audit.status)} text-white`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAuditClick?.(audit);
                        }}
                        title={audit.title}
                      >
                        {audit.title.substring(0, 15)}
                        {audit.title.length > 15 ? '...' : ''}
                      </div>
                    ))}
                    {dayAudits.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayAudits.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-sm">Planejada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500" />
              <span className="text-sm">Em Andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-sm">Concluída</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-primary" />
              <span className="text-sm">Hoje</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
