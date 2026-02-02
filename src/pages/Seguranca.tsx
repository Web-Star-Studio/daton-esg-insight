import { ArrowLeft, Shield, Lock, Eye, Server, Key, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function Seguranca() {
  const navigate = useNavigate();

  const securityFeatures = [
    {
      icon: Lock,
      title: 'Criptografia de Dados',
      description: 'Todos os dados são criptografados em trânsito (TLS 1.3) e em repouso (AES-256).'
    },
    {
      icon: Shield,
      title: 'Controle de Acesso',
      description: 'Sistema de permissões baseado em papéis (RBAC) com autenticação multifator disponível.'
    },
    {
      icon: Eye,
      title: 'Monitoramento Contínuo',
      description: 'Detecção de ameaças em tempo real e logs de auditoria completos.'
    },
    {
      icon: Server,
      title: 'Infraestrutura Segura',
      description: 'Hospedagem em data centers certificados SOC 2 Type II e ISO 27001.'
    },
    {
      icon: Key,
      title: 'Gestão de Credenciais',
      description: 'Senhas armazenadas com hash bcrypt e políticas de complexidade obrigatórias.'
    },
    {
      icon: AlertTriangle,
      title: 'Resposta a Incidentes',
      description: 'Plano de resposta a incidentes 24/7 com notificação dentro de 72 horas.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
          aria-label="Voltar para a página anterior"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-4">Segurança e Cookies</h1>
        <p className="text-muted-foreground mb-8">
          A segurança dos seus dados é nossa prioridade. Conheça as medidas que implementamos.
        </p>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          {securityFeatures.map((feature, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Política de Cookies</h2>
            <p className="text-muted-foreground">
              Utilizamos cookies para melhorar sua experiência na plataforma. Os tipos de cookies que usamos incluem:
            </p>
            
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Cookies Essenciais</h3>
                <p className="text-sm text-muted-foreground">
                  Necessários para o funcionamento básico da plataforma, como autenticação e preferências de sessão. 
                  Não podem ser desabilitados.
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Cookies de Desempenho</h3>
                <p className="text-sm text-muted-foreground">
                  Coletam informações sobre como você usa a plataforma, ajudando-nos a melhorar a experiência. 
                  Dados são anonimizados.
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Cookies Funcionais</h3>
                <p className="text-sm text-muted-foreground">
                  Permitem que a plataforma lembre suas preferências, como idioma e configurações de visualização.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Certificações e Compliance</h2>
            <p className="text-muted-foreground">
              Nossa plataforma está em conformidade com:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>LGPD (Lei Geral de Proteção de Dados - Lei 13.709/2018)</li>
              <li>ISO 27001 - Sistema de Gestão de Segurança da Informação</li>
              <li>SOC 2 Type II - Controles de Segurança e Disponibilidade</li>
              <li>OWASP Top 10 - Melhores práticas de segurança web</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Relatar Vulnerabilidades</h2>
            <p className="text-muted-foreground">
              Se você descobrir uma vulnerabilidade de segurança, por favor nos informe de forma responsável:
            </p>
            <p className="text-muted-foreground">
              <strong>E-mail:</strong> seguranca@daton.com.br
            </p>
            <p className="text-muted-foreground text-sm">
              Agradecemos pesquisadores de segurança que nos ajudam a manter a plataforma segura.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
