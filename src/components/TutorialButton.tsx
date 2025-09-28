import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useTutorial } from '@/contexts/TutorialContext';
import { HelpCenter } from '@/components/tutorial/HelpCenter';
import { 
  GraduationCap, 
  Play, 
  BookOpen, 
  Target, 
  Trophy,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const AVAILABLE_TOURS = [
  {
    id: 'dashboard-intro',
    title: 'Tour pelo Dashboard',
    description: 'Conheça a interface principal',
    icon: Play
  },
  {
    id: 'performance-module',
    title: 'Gestão de Desempenho',
    description: 'Aprenda a gerenciar avaliações',
    icon: Trophy
  },
  {
    id: 'emissions-basics',
    title: 'Gestão de Emissões',
    description: 'Monitore gases de efeito estufa',
    icon: Target
  }
];

export function TutorialButton() {
  const { startTour, restartOnboarding, showHelpCenter } = useTutorial();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <GraduationCap className="w-4 h-4 mr-2" />
          Tutorial
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Tutoriais e Ajuda</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={restartOnboarding}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refazer Onboarding
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Tours Disponíveis</DropdownMenuLabel>
        {AVAILABLE_TOURS.map((tour) => {
          const Icon = tour.icon;
          return (
            <DropdownMenuItem 
              key={tour.id}
              onClick={() => startTour(tour.id)}
            >
              <Icon className="w-4 h-4 mr-2" />
              <div>
                <div className="font-medium">{tour.title}</div>
                <div className="text-xs text-muted-foreground">{tour.description}</div>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <HelpCenter 
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <BookOpen className="w-4 h-4 mr-2" />
              Centro de Ajuda
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}