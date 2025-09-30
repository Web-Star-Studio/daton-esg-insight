import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Shield, Cpu, CheckCircle } from 'lucide-react';

export function DocModulesSection() {
  return (
    <section id="modules" className="space-y-6">
      <h2 className="text-3xl font-bold">Módulos e Funcionalidades</h2>
      
      <div className="grid gap-6">
        {/* GEE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Gestão de Emissões GEE
            </CardTitle>
            <CardDescription>
              Monitoramento automático e cálculo preciso de gases de efeito estufa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Rastreamento automático de emissões',
                'Cálculos por Escopo 1, 2 e 3',
                'Biblioteca de fatores atualizados',
                'Relatórios em tempo real',
                'Alertas de meta',
                'Benchmarking setorial'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Compliance e Licenciamento
            </CardTitle>
            <CardDescription>
              Gestão inteligente de licenças e conformidade regulatória
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Gestão inteligente de licenças',
                'Alertas de vencimento automáticos',
                'Controle de condicionantes',
                'Dashboard de status',
                'Histórico completo',
                'Score de compliance'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* IA e Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Inteligência Artificial
            </CardTitle>
            <CardDescription>
              IA preditiva e analytics avançado para insights acionáveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'IA preditiva para cenários',
                'Recomendações automáticas',
                'Análise de riscos climáticos',
                'Detecção de padrões',
                'Processamento de documentos',
                'Dashboards inteligentes'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Outros módulos em formato resumido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gestão de Resíduos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Controle completo do ciclo de vida dos resíduos, destinação inteligente e conformidade PNRS.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Relatórios ESG</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Padrões internacionais GRI, SASB, TCFD, CDP com geração automática e templates personalizáveis.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Projetos de Carbono</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Portfólio completo, validação de créditos, ROI ambiental e certificações internacionais.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metas e KPIs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Science-Based Targets, tracking automático, benchmarking e alertas de performance.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
