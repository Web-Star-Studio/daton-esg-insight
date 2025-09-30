import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, Zap } from 'lucide-react';

export function DocOverviewSection() {
  return (
    <section id="overview" className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Documentação Daton</h2>
        <p className="text-xl text-muted-foreground">
          A plataforma ESG mais avançada do Brasil para gestão completa de sustentabilidade empresarial
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>O que é o Daton?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Daton é a plataforma ESG (Environmental, Social & Governance) mais avançada do Brasil, 
            desenvolvida para automatizar e otimizar toda a gestão de sustentabilidade empresarial.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">70% menos tempo</div>
                <div className="text-sm text-muted-foreground">em relatórios ESG</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">99% de precisão</div>
                <div className="text-sm text-muted-foreground">em compliance</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
              <Zap className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">15 minutos</div>
                <div className="text-sm text-muted-foreground">setup completo</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
