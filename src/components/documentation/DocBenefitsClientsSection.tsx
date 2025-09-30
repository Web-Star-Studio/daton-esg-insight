import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function DocBenefitsClientsSection() {
  return (
    <>
      {/* Benefícios */}
      <section id="benefits" className="space-y-6">
        <h2 className="text-3xl font-bold">Benefícios Comprovados</h2>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>ROI e Eficiência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">70%</div>
                  <div className="text-sm text-muted-foreground">Redução no tempo de relatórios ESG</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">300%</div>
                  <div className="text-sm text-muted-foreground">ROI médio em eficiência operacional</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Multas com alertas inteligentes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vantagens Competitivas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-1 text-sm">
                  <li>• Compliance automatizado</li>
                  <li>• Decisões baseadas em dados</li>
                  <li>• Redução de riscos regulatórios</li>
                  <li>• Melhoria da reputação corporativa</li>
                  <li>• Preparação contínua para auditoria</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Impacto em Sustentabilidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-1 text-sm">
                  <li>• Monitoramento preciso da pegada de carbono</li>
                  <li>• Otimização de recursos</li>
                  <li>• Implementação de economia circular</li>
                  <li>• Transparência com stakeholders</li>
                  <li>• Contribuição para ODS da ONU</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Casos de Uso e Clientes */}
      <section id="clients" className="space-y-6">
        <h2 className="text-3xl font-bold">Casos de Uso e Clientes</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Indústrias Atendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: 'Mercosul Energia', sector: 'Energia' },
                { name: 'ThyssenKrupp', sector: 'Metalurgia' },
                { name: 'Cooperlíquidos', sector: 'Agronegócio' },
                { name: 'Gabardo', sector: 'Consultoria' },
                { name: 'Amcham', sector: 'Organizações' },
                { name: 'Safeweb', sector: 'Tecnologia' },
              ].map((client, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="font-semibold text-sm">{client.name}</div>
                  <div className="text-xs text-muted-foreground">{client.sector}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Depoimentos de Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <blockquote className="border-l-4 border-primary pl-4 italic">
                "Reduzimos 75% do tempo em relatórios ESG, economizando R$ 2.3M anuais."
              </blockquote>
              <div className="text-sm text-muted-foreground">
                — Marina Santos, Gerente de Sustentabilidade, Mercosul Energia
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <blockquote className="border-l-4 border-primary pl-4 italic">
                "Zero multas no último ano graças aos alertas inteligentes da plataforma."
              </blockquote>
              <div className="text-sm text-muted-foreground">
                — Carlos Mendes, Diretor Ambiental, ThyssenKrupp
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
