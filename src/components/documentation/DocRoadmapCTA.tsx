import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowRight } from 'lucide-react';

export function DocRoadmapCTA() {
  return (
    <>
      {/* Roadmap */}
      <section id="roadmap" className="space-y-6">
        <h2 className="text-3xl font-bold">Roadmap e Inovações</h2>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades em Desenvolvimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Blockchain para rastreabilidade',
                  'IoT para monitoramento em tempo real',
                  'Análise de ciclo de vida (LCA)',
                  'Relatórios de biodiversidade',
                  'ESG Score automático',
                  'Mobile app nativo'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Planos de Expansão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">2024</Badge>
                  <span className="text-sm">Expansão para mercado internacional</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">2025</Badge>
                  <span className="text-sm">Novos módulos setoriais especializados</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">2025</Badge>
                  <span className="text-sm">Marketplace de soluções ESG</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
        <CardContent className="p-8 text-center space-y-4">
          <h3 className="text-2xl font-bold">Pronto para transformar sua gestão ESG?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Junte-se às empresas líderes que já utilizam a Daton para otimizar 
            sua performance ambiental e garantir compliance total.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/contato" className="flex items-center gap-2">
                Agendar Demo <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/simulador" className="flex items-center gap-2">
                Testar Simulador <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
