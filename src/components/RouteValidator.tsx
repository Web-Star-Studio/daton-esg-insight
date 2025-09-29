import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { NavigationMonitor } from '@/components/NavigationMonitor';

// Lista de rotas válidas para validação
const VALID_ROUTES = [
  '/', '/auth', '/onboarding', '/dashboard', 
  '/inventario-gee', '/dashboard-ghg', '/licenciamento',
  '/residuos', '/metas', '/relatorios', '/biblioteca-fatores',
  '/projetos-carbono', '/ativos', '/desempenho', '/configuracao',
  '/ia-insights', '/marketplace', '/coleta-dados',
  '/formularios-customizados', '/documentos', '/auditoria',
  '/compliance', '/gestao-esg', '/gestao-stakeholders',
  '/analise-materialidade', '/configuracao-organizacional',
  '/social-esg', '/governanca-esg', '/relatorios-integrados',
  '/planejamento-estrategico', '/mapeamento-processos',
  '/gestao-riscos', '/nao-conformidades', '/plano-acao-5w2h',
  '/base-conhecimento', '/gestao-fornecedores',
  '/quality-dashboard', '/gerenciamento-projetos',
  '/sgq-dashboard', '/auditorias-internas', '/acoes-corretivas',
  '/controle-documentos', '/avaliacao-fornecedores',
  '/estrutura-organizacional', '/gestao-funcionarios',
  '/gestao-treinamentos', '/gestao-desempenho',
  '/beneficios-remuneracao', '/recrutamento',
  '/seguranca-trabalho', '/ponto-frequencia',
  '/desenvolvimento-carreira', '/ouvidoria-clientes',
  '/gestao-usuarios', '/intelligence-center'
];

interface RouteValidatorProps {
  children: React.ReactNode;
}

export function RouteValidator({ children }: RouteValidatorProps) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Verificar se a rota é válida (exata ou tem parâmetros)
    const isValidRoute = VALID_ROUTES.some(route => {
      return currentPath === route || 
             currentPath.startsWith(route + '/') ||
             route.includes(':'); // Para rotas dinâmicas
    });

    // Se a rota não for válida e não for a página 404, mostrar aviso
    if (!isValidRoute && !currentPath.startsWith('/form/')) {
      console.warn(`Rota potencialmente inválida detectada: ${currentPath}`);
      
      // Mostrar toast apenas para rotas que parecem ser erros de digitação
      if (currentPath.includes('/novo') || currentPath.includes('/nova')) {
        toast.warning('Página não encontrada', {
          description: `A rota ${currentPath} não existe. Redirecionando...`,
          duration: 3000,
        });
        
        // Tentar redirecionar para uma rota similar
        if (currentPath.includes('inventario-gee')) {
          navigate('/inventario-gee', { replace: true });
        } else if (currentPath.includes('auditoria')) {
          navigate('/auditoria', { replace: true });
        } else if (currentPath.includes('treinamento')) {
          navigate('/gestao-treinamentos', { replace: true });
        } else if (currentPath.includes('saude-seguranca')) {
          navigate('/seguranca-trabalho', { replace: true });
        } else if (currentPath.includes('configuracao-organizacao')) {
          navigate('/configuracao-organizacional', { replace: true });
        } else if (currentPath.includes('relatorio')) {
          navigate('/relatorios', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [location.pathname, navigate]);

  return (
    <>
      <NavigationMonitor />
      {children}
    </>
  );
}

export default RouteValidator;