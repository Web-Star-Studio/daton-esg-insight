import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface NavigationBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const NavigationBreadcrumbs: React.FC<NavigationBreadcrumbsProps> = ({ 
  items, 
  className = "" 
}) => {
  const navigate = useNavigate();

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              onClick={() => handleNavigation('/dashboard')}
              className="flex items-center gap-1 cursor-pointer hover:text-primary"
            >
              <Home className="h-4 w-4" />
              Início
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {item.href && index < items.length - 1 ? (
                  <BreadcrumbLink 
                    onClick={() => handleNavigation(item.href!)}
                    className="cursor-pointer hover:text-primary"
                  >
                    {item.label}
                  </BreadcrumbLink>
                ) : (
                  <span className="font-medium text-foreground">{item.label}</span>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <Button 
        variant="outline" 
        size="sm"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
    </div>
  );
};

// Hook para gerenciar breadcrumbs automaticamente
export const useBreadcrumbs = () => {
  const navigate = useNavigate();
  
  const getPageBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
    const pathMap: Record<string, BreadcrumbItem[]> = {
      '/dashboard': [{ label: 'Dashboard' }],
      '/gestao-esg': [{ label: 'Gestão ESG' }],
      '/emissoes': [{ label: 'Ambiental', href: '/gestao-esg' }, { label: 'Emissões de GEE' }],
      '/inventario-gee': [{ label: 'Ambiental', href: '/gestao-esg' }, { label: 'Emissões de GEE', href: '/emissoes' }, { label: 'Inventário GEE' }],
      '/dashboard-ghg': [{ label: 'Ambiental', href: '/gestao-esg' }, { label: 'Emissões de GEE', href: '/emissoes' }, { label: 'Dashboard GHG' }],
      '/projetos-carbono': [{ label: 'Ambiental', href: '/gestao-esg' }, { label: 'Emissões de GEE', href: '/emissoes' }, { label: 'Projetos de Carbono' }],
      '/residuos': [{ label: 'Ambiental', href: '/gestao-esg' }, { label: 'Gestão de Resíduos' }],
      '/licenciamento': [{ label: 'Ambiental', href: '/gestao-esg' }, { label: 'Licenciamento Ambiental' }],
      '/social-esg': [{ label: 'Social' }],
      '/gestao-funcionarios': [{ label: 'Social', href: '/social-esg' }, { label: 'Gestão de Funcionários' }],
      '/seguranca-trabalho': [{ label: 'Social', href: '/social-esg' }, { label: 'Segurança do Trabalho' }],
      '/gestao-treinamentos': [{ label: 'Social', href: '/social-esg' }, { label: 'Treinamentos' }],
      '/desenvolvimento-carreira': [{ label: 'Social', href: '/social-esg' }, { label: 'Desenvolvimento de Carreira' }],
      '/painel-governanca': [{ label: 'Governança' }],
      '/gestao-riscos': [{ label: 'Governança', href: '/painel-governanca' }, { label: 'Gestão de Riscos' }],
      '/compliance': [{ label: 'Governança', href: '/painel-governanca' }, { label: 'Compliance e Políticas' }],
      '/auditorias': [{ label: 'Governança', href: '/painel-governanca' }, { label: 'Auditorias' }],
      '/auditoria': [{ label: 'Governança', href: '/painel-governanca' }, { label: 'Auditorias' }],
      '/quality-dashboard': [{ label: 'SGQ' }],
      '/planejamento-estrategico': [{ label: 'SGQ', href: '/quality-dashboard' }, { label: 'Planejamento Estratégico' }],
      '/mapeamento-processos': [{ label: 'SGQ', href: '/quality-dashboard' }, { label: 'Mapeamento de Processos' }],
      '/nao-conformidades': [{ label: 'SGQ', href: '/quality-dashboard' }, { label: 'Não Conformidades' }],
      '/auditorias-internas': [{ label: 'SGQ', href: '/quality-dashboard' }, { label: 'Auditorias Internas' }],
      '/acoes-corretivas': [{ label: 'SGQ', href: '/quality-dashboard' }, { label: 'Ações Corretivas' }],
      '/controle-documentos': [{ label: 'SGQ', href: '/quality-dashboard' }, { label: 'Controle de Documentos' }],
      '/avaliacao-fornecedores': [{ label: 'SGQ', href: '/quality-dashboard' }, { label: 'Avaliação de Fornecedores' }],
      '/coleta-dados': [{ label: 'Central de Dados' }],
      '/documentos': [{ label: 'Central de Dados', href: '/coleta-dados' }, { label: 'Documentos' }],
      '/ativos': [{ label: 'Central de Dados', href: '/coleta-dados' }, { label: 'Ativos' }],
      '/reconciliacao-ia': [{ label: 'Central de Dados', href: '/coleta-dados' }, { label: 'Reconciliação IA' }],
      '/gerador-relatorios': [{ label: 'Relatórios' }],
      '/relatorios-integrados': [{ label: 'Relatórios', href: '/gerador-relatorios' }, { label: 'Relatórios Integrados' }],
      '/marketplace-esg': [{ label: 'Relatórios', href: '/gerador-relatorios' }, { label: 'Marketplace ESG' }],
      '/configuracao-organizacional': [{ label: 'Configurações' }],
      '/biblioteca-fatores': [{ label: 'Configurações', href: '/configuracao-organizacional' }, { label: 'Biblioteca de Fatores' }],
      '/formularios-customizados': [{ label: 'Configurações', href: '/configuracao-organizacional' }, { label: 'Formulários Customizados' }],
      '/gestao-usuarios': [{ label: 'Configurações', href: '/configuracao-organizacional' }, { label: 'Gestão de Usuários' }],
    };

    return pathMap[pathname] || [{ label: 'Página Atual' }];
  };

  return { getPageBreadcrumbs };
};