import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'pt-BR': ptBR,
  },
});

interface TrainingEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    program: string;
    category: string;
    participants: number;
    instructor: string;
    location: string;
    type?: 'program' | 'training';
    programId?: string;
    status?: string;
  };
}

interface TrainingCalendarProps {
  events: TrainingEvent[];
  onEventClick?: (event: TrainingEvent) => void;
  onNewEventClick?: (slotInfo: any) => void;
}

export function TrainingCalendar({ events, onEventClick, onNewEventClick }: TrainingCalendarProps) {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

const eventStyleGetter = (event: TrainingEvent) => {
  const categoryColors: Record<string, string> = {
    'Segurança': 'hsl(0, 84%, 60%)',
    'Desenvolvimento': 'hsl(280, 67%, 52%)',
    'Técnico': 'hsl(199, 89%, 48%)',
    'Compliance': 'hsl(38, 92%, 50%)',
    'Liderança': 'hsl(151, 100%, 37%)',
    'Qualidade': 'hsl(199, 89%, 48%)',
    'NR': 'hsl(151, 100%, 37%)',
  };

  // Default para a cor primária do sistema (verde Daton)
  const backgroundColor = categoryColors[event.resource.category] || 'hsl(151, 100%, 37%)';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  const EventComponent = ({ event }: { event: TrainingEvent }) => (
    <div className="text-xs">
      <strong>{event.title}</strong>
      {event.resource.participants > 0 && (
        <div className="opacity-75">
          {event.resource.participants} participante{event.resource.participants !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );

  const messages = {
    allDay: 'Todo o dia',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Horário',
    event: 'Evento',
    noEventsInRange: 'Não há treinamentos programados neste período.',
    showMore: (total: number) => `+ Ver mais (${total})`,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Calendário de Treinamentos</h3>
          <p className="text-sm text-muted-foreground">
            Visualize e gerencie o cronograma de treinamentos
          </p>
        </div>
        <Button onClick={() => onNewEventClick?.({})}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Sessão
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              sessões programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => {
                const eventWeek = format(e.start, 'w');
                const currentWeek = format(new Date(), 'w');
                return eventWeek === currentWeek;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              sessões esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.reduce((sum, e) => sum + e.resource.participants, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              total de inscritos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set(events.map(e => e.resource.category))).slice(0, 3).map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={onEventClick}
              onSelectSlot={onNewEventClick}
              selectable
              views={['month', 'week', 'day', 'agenda']}
              view={view as any}
              onView={setView as any}
              date={date}
              onNavigate={setDate}
              eventPropGetter={eventStyleGetter}
              components={{
                event: EventComponent,
              }}
              messages={messages}
              culture="pt-BR"
              formats={{
                monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy', { locale: ptBR }),
                dayHeaderFormat: (date: Date) => format(date, 'EEEE, dd/MM', { locale: ptBR }),
                dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                  `${format(start, 'dd/MM', { locale: ptBR })} - ${format(end, 'dd/MM', { locale: ptBR })}`,
              }}
              popup
              popupOffset={30}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming events sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Próximos Treinamentos
          </CardTitle>
          <CardDescription>
            Sessões programadas para os próximos 7 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events
              .filter(event => event.start >= new Date() && event.start <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                     onClick={() => onEventClick?.(event)}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(event.start, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.resource.instructor} • {event.resource.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getCategoryColor(event.resource.category)}>
                      {event.resource.category}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.resource.participants} inscritos
                    </p>
                  </div>
                </div>
              ))}
            
            {events.filter(event => event.start >= new Date() && event.start <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum treinamento programado para os próximos 7 dias
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'Segurança': return 'bg-red-100 text-red-800';
    case 'Desenvolvimento': return 'bg-purple-100 text-purple-800';
    case 'Técnico': return 'bg-blue-100 text-blue-800';
    case 'Compliance': return 'bg-yellow-100 text-yellow-800';
    case 'Liderança': return 'bg-green-100 text-green-800';
    case 'Qualidade': return 'bg-cyan-100 text-cyan-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}