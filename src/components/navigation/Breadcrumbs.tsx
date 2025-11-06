/**
 * Global Breadcrumbs Component
 * Provides navigation context throughout the app
 */

import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTE_PATHS } from '@/constants/routePaths';

interface BreadcrumbItem {
  label: string;
  path: string;
}

// Map routes to readable names
const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventario-gee': 'Inventário GEE',
  '/dashboard-ghg': 'Dashboard GHG',
  '/licenciamento': 'Licenciamento',
  '/licenciamento/monitoramento': 'Monitoramento',
  '/licenciamento/processar': 'Processar Licença',
  '/licenciamento/novo': 'Nova Licença',
  '/residuos': 'Gestão de Resíduos',
  '/metas': 'Metas',
  '/gestao-esg': 'Gestão ESG',
  '/documentos': 'Documentos',
  '/coleta-dados': 'Coleta de Dados',
  '/relatorios-integrados': 'Relatórios',
  '/gestao-usuarios': 'Gestão de Usuários',
  '/configuracao': 'Configurações',
  '/quality-dashboard': 'Dashboard SGQ',
  '/nao-conformidades': 'Não Conformidades',
  '/acoes-corretivas': 'Ações Corretivas',
  '/gestao-riscos': 'Gestão de Riscos',
  '/auditoria': 'Auditorias',
  '/compliance': 'Compliance',
  '/gestao-funcionarios': 'Funcionários',
  '/gestao-treinamentos': 'Treinamentos',
  '/seguranca-trabalho': 'Segurança do Trabalho',
  '/analise-materialidade': 'Materialidade',
  '/gestao-stakeholders': 'Stakeholders',
  '/fornecedores': 'Fornecedores',
  '/indicadores-esg': 'Indicadores ESG',
};

function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: 'Início', path: ROUTE_PATHS.CORE.DASHBOARD }
  ];

  // Split path and build breadcrumbs
  const pathParts = pathname.split('/').filter(Boolean);
  let currentPath = '';

  pathParts.forEach((part, index) => {
    currentPath += `/${part}`;
    
    // Get label from map or format the part
    const label = ROUTE_LABELS[currentPath] || 
                  part.replace(/-/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase());

    // Skip if it's a UUID or numeric ID
    if (!/^[0-9a-f-]{36}$/i.test(part) && !/^\d+$/.test(part)) {
      items.push({
        label,
        path: currentPath
      });
    }
  });

  return items;
}

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const location = useLocation();
  const items = getBreadcrumbItems(location.pathname);

  // Don't show breadcrumbs on home/landing or auth pages
  if (location.pathname === '/' || location.pathname === '/auth' || location.pathname === '/onboarding') {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn(
        "flex items-center space-x-1 text-sm text-muted-foreground mb-4 animate-fade-in",
        className
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <div key={`${item.path}-${index}`} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-1 flex-shrink-0" />
            )}
            
            {isLast ? (
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="hover:text-foreground transition-colors flex items-center gap-1 group"
              >
                {isFirst && <Home className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                <span className="truncate max-w-[150px]">{item.label}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}