import { BookOpen, CheckCircle2, HelpCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUnifiedTour } from '@/contexts/UnifiedTourContext';
import { tourDefinitions } from '@/components/tutorial/unified/tourDefinitions';

/**
 * Mapeamento de rotas para links de documentação contextual.
 * Cada rota principal tem seu próprio anchor na documentação.
 */
const HELP_LINKS: Record<string, string> = {
  // Dashboard e visão geral
  '/dashboard': '/documentacao#dashboard',
  
  // Módulo ESG - Ambiental
  '/inventario-gee': '/documentacao#inventario-gee',
  '/gestao-licencas': '/documentacao#licencas',
  '/monitoramento-ambiental': '/documentacao#monitoramento',
  '/residuos': '/documentacao#residuos',
  '/biodiversidade': '/documentacao#biodiversidade',
  
  // Módulo ESG - Social
  '/gestao-stakeholders': '/documentacao#stakeholders',
  '/seguranca-trabalho': '/documentacao#seguranca',
  '/treinamentos': '/documentacao#treinamentos',
  '/recursos-humanos': '/documentacao#rh',
  '/ouvidoria': '/documentacao#ouvidoria',
  
  // Módulo ESG - Governança
  '/gestao-riscos': '/documentacao#riscos',
  '/compliance': '/documentacao#compliance',
  '/auditorias': '/documentacao#auditorias',
  '/etica-integridade': '/documentacao#etica',
  
  // Qualidade
  '/nao-conformidades': '/documentacao#nao-conformidades',
  '/planos-de-acao': '/documentacao#planos-acao',
  '/indicadores-gri': '/documentacao#gri',
  '/documentos': '/documentacao#documentos',
  
  // Operações
  '/fornecedores': '/documentacao#fornecedores',
  '/projetos': '/documentacao#projetos',
  '/calendario': '/documentacao#calendario',
  
  // Configurações
  '/configuracao': '/documentacao#configuracao',
  '/usuarios': '/documentacao#usuarios',
};

/**
 * Componente de ajuda contextual que exibe um botão de help
 * direcionando para a documentação relevante baseada na rota atual.
 */
export function ContextualHelp() {
  const location = useLocation();
  const { startTour, isTourCompleted } = useUnifiedTour();
  const tours = Object.values(tourDefinitions);
  
  // Encontra o link de ajuda mais específico para a rota atual
  const getHelpLink = () => {
    // Primeiro tenta match exato
    if (HELP_LINKS[location.pathname]) {
      return HELP_LINKS[location.pathname];
    }
    
    // Depois tenta match parcial (para sub-rotas)
    const pathParts = location.pathname.split('/').filter(Boolean);
    for (let i = pathParts.length; i > 0; i--) {
      const partialPath = '/' + pathParts.slice(0, i).join('/');
      if (HELP_LINKS[partialPath]) {
        return HELP_LINKS[partialPath];
      }
    }
    
    // Fallback para documentação geral
    return '/documentacao';
  };

  const helpLink = getHelpLink();

  const handleClick = () => {
    window.open(helpLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu de ajuda"
                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Ajuda</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Acessar documentação</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuItem onClick={handleClick} className="cursor-pointer">
          <BookOpen className="mr-2 h-4 w-4" />
          Acessar documentação
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Tours Interativos</DropdownMenuLabel>
        {tours.map((tour) => {
          const completed = isTourCompleted(tour.id);

          return (
            <DropdownMenuItem
              key={tour.id}
              onClick={() => startTour(tour.id)}
              className="cursor-pointer"
            >
              {completed ? (
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4 text-primary" />
              )}
              <span className="truncate">{tour.title}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
