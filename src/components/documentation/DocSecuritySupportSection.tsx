import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Award, Users, Globe, Target, TrendingUp } from 'lucide-react';

export function DocSecuritySupportSection() {
  return (
    <>
      {/* Segurança */}
      <section id="security" className="space-y-6">
        <h2 className="text-3xl font-bold">Segurança e Compliance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Segurança de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="space-y-1 text-sm">
                <li>• Criptografia end-to-end</li>
                <li>• Row Level Security (RLS)</li>
                <li>• Auditoria completa de acessos</li>
                <li>• Backup automático</li>
                <li>• Conformidade LGPD</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Certificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Em Processo</Badge>
                  <span className="text-sm">ISO 27001</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Em Processo</Badge>
                  <span className="text-sm">SOC 2 Type II</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Ativo</Badge>
                  <span className="text-sm">Conformidade LGPD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Ativo</Badge>
                  <span className="text-sm">Padrões ESG Internacionais</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Suporte */}
      <section id="support" className="space-y-6">
        <h2 className="text-3xl font-bold">Suporte e Implementação</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Processo de Implementação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-lg font-bold text-primary">1</span>
                </div>
                <h4 className="font-semibold">Conectar</h4>
                <p className="text-sm text-muted-foreground">Integração com sistemas existentes</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-lg font-bold text-primary">2</span>
                </div>
                <h4 className="font-semibold">Monitorar</h4>
                <p className="text-sm text-muted-foreground">IA processa dados automaticamente</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-lg font-bold text-primary">3</span>
                </div>
                <h4 className="font-semibold">Relatar</h4>
                <p className="text-sm text-muted-foreground">Dashboards e recomendações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suporte Completo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center space-y-2">
                <Users className="h-8 w-8 text-primary mx-auto" />
                <div className="text-sm font-semibold">Onboarding Personalizado</div>
              </div>
              <div className="text-center space-y-2">
                <Globe className="h-8 w-8 text-primary mx-auto" />
                <div className="text-sm font-semibold">Suporte 24/7</div>
              </div>
              <div className="text-center space-y-2">
                <Target className="h-8 w-8 text-primary mx-auto" />
                <div className="text-sm font-semibold">Consultoria Especializada</div>
              </div>
              <div className="text-center space-y-2">
                <TrendingUp className="h-8 w-8 text-primary mx-auto" />
                <div className="text-sm font-semibold">Atualizações Automáticas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
