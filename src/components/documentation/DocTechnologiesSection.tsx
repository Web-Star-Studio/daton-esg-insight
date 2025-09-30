import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DocTechnologiesSection() {
  return (
    <section id="technologies" className="space-y-6">
      <h2 className="text-3xl font-bold">Tecnologias Utilizadas</h2>
      
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Frontend Moderno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">React 18.3.1</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Vite</Badge>
                <Badge variant="secondary">Tailwind CSS</Badge>
                <Badge variant="secondary">Shadcn/ui</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Interface moderna, responsiva e acessível com componentes reutilizáveis.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backend Robusto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Supabase</Badge>
                <Badge variant="secondary">PostgreSQL</Badge>
                <Badge variant="secondary">Edge Functions</Badge>
                <Badge variant="secondary">RLS</Badge>
                <Badge variant="secondary">Real-time</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Infraestrutura escalável com segurança granular e atualizações em tempo real.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inteligência Artificial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">OpenAI GPT-4</Badge>
                <Badge variant="secondary">Computer Vision</Badge>
                <Badge variant="secondary">OCR</Badge>
                <Badge variant="secondary">Machine Learning</Badge>
                <Badge variant="secondary">NLP</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                IA proprietária especializada em processamento de documentos e análise ESG.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integrações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">ERPs</Badge>
                <Badge variant="secondary">Power BI</Badge>
                <Badge variant="secondary">APIs REST</Badge>
                <Badge variant="secondary">Webhooks</Badge>
                <Badge variant="secondary">Excel/CSV</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Conectividade total com sistemas existentes e ferramentas de negócio.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
