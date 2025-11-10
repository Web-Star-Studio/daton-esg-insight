import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, Users, Target } from 'lucide-react';

export function MaterialityIntroduction() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            O que é Materialidade segundo o GRI?
          </CardTitle>
          <CardDescription>
            Entenda o conceito de materialidade e sua importância para a estratégia ESG da sua organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Conceito */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-2xl">1️⃣</span>
              Conceito de Materialidade
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              A <strong>análise de materialidade</strong> é um processo estruturado para identificar e priorizar 
              os temas ESG (ambientais, sociais e de governança) mais relevantes para uma organização e suas partes 
              interessadas. Segundo o GRI (Global Reporting Initiative), temas materiais são aqueles que refletem 
              os impactos econômicos, ambientais e sociais significativos da organização, ou que influenciam 
              substantivamente as avaliações e decisões dos stakeholders.
            </p>
          </div>

          {/* Dupla Materialidade */}
          <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">2️⃣</span>
              Dupla Materialidade
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Inside-Out (Materialidade de Impacto)</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Impactos da empresa no mundo: como as operações e atividades da organização afetam 
                      o meio ambiente, sociedade e economia.
                    </p>
                  </div>
                </div>
                <div className="mt-3 ml-8">
                  <p className="text-xs text-muted-foreground">
                    <strong>Exemplo:</strong> Emissões de GEE da empresa afetando as mudanças climáticas
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-2">
                  <Target className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Outside-In (Materialidade Financeira)</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Impactos do mundo na empresa: como questões ESG podem afetar os resultados financeiros, 
                      operações e estratégia da organização.
                    </p>
                  </div>
                </div>
                <div className="mt-3 ml-8">
                  <p className="text-xs text-muted-foreground">
                    <strong>Exemplo:</strong> Mudanças climáticas afetando a cadeia de suprimentos da empresa
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Processo */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">3️⃣</span>
              Processo de Análise de Materialidade
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 border border-border rounded-lg p-4 bg-card">
                <div className="text-primary font-bold text-sm mb-2">PASSO 1</div>
                <h4 className="font-semibold mb-1">Identificação</h4>
                <p className="text-sm text-muted-foreground">
                  Listar temas ESG potencialmente relevantes baseados no setor, operações e stakeholders
                </p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl text-muted-foreground">→</span>
              </div>
              <div className="flex-1 border border-border rounded-lg p-4 bg-card">
                <div className="text-primary font-bold text-sm mb-2">PASSO 2</div>
                <h4 className="font-semibold mb-1">Priorização</h4>
                <p className="text-sm text-muted-foreground">
                  Avaliar cada tema quanto à sua materialidade financeira e de impacto
                </p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl text-muted-foreground">→</span>
              </div>
              <div className="flex-1 border border-border rounded-lg p-4 bg-card">
                <div className="text-primary font-bold text-sm mb-2">PASSO 3</div>
                <h4 className="font-semibold mb-1">Validação</h4>
                <p className="text-sm text-muted-foreground">
                  Revisar e validar os resultados com a alta liderança e stakeholders-chave
                </p>
              </div>
            </div>
          </div>

          {/* Importância */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">4️⃣</span>
              Por que é Importante?
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-card">
                <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Foco Estratégico</h4>
                  <p className="text-xs text-muted-foreground">
                    Concentra recursos e esforços nos temas ESG que realmente importam para o negócio
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-card">
                <Target className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Gestão de Riscos</h4>
                  <p className="text-xs text-muted-foreground">
                    Identifica e mitiga riscos ESG que podem afetar a operação e reputação
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-card">
                <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Alinhamento com Stakeholders</h4>
                  <p className="text-xs text-muted-foreground">
                    Demonstra que a empresa está atenta às expectativas de investidores, clientes e sociedade
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-card">
                <Lightbulb className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Reporte GRI Compliant</h4>
                  <p className="text-xs text-muted-foreground">
                    Base para um relatório de sustentabilidade completo e transparente segundo GRI Standards
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2">Pronto para começar?</h4>
            <p className="text-sm text-muted-foreground">
              Nas próximas etapas, você poderá selecionar temas ESG relevantes para sua organização, 
              avaliar sua materialidade e gerar uma matriz personalizada com apoio de inteligência artificial, 
              considerando o contexto regulatório e de mercado brasileiro.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
