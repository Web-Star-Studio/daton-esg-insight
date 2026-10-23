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
      description: 'O acesso ao painel usa HTTPS, e as conexões com o banco de dados usam SSL.'
    },
    {
      icon: Shield,
      title: 'Controle de Acesso',
      description: 'O acesso é validado por organização, papel, módulo e abrangência de filiais.'
    },
    {
      icon: Eye,
      title: 'Registros de Segurança',
      description: 'Eventos de acesso e segurança são registrados. Os históricos de negócio dependem do fluxo e do módulo.'
    },
    {
      icon: Server,
      title: 'Infraestrutura Segura',
      description: 'O sistema usa serviços de nuvem para a API, o banco de dados e o armazenamento de arquivos.'
    },
    {
      icon: Key,
      title: 'Gestão de Credenciais',
      description: 'Senhas são protegidas com hash bcrypt. Cada pessoa acessa o painel com suas próprias credenciais.'
    },
    {
      icon: AlertTriangle,
      title: 'Bloqueio de Acesso',
      description: 'A administração pode bloquear contas para impedir novos acessos e preservar os registros existentes.'
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

        <h1 className="text-3xl font-bold text-foreground mb-4">Segurança e Armazenamento</h1>
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
            <h2 className="text-xl font-semibold text-foreground">Armazenamento no Navegador</h2>
            <p className="text-muted-foreground">
              A landing page institucional e o painel são aplicações distintas. O navegador pode guardar dados necessários ao funcionamento de cada aplicação:
            </p>

            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Sessão no Painel</h3>
                <p className="text-sm text-muted-foreground">
                  O painel guarda o token de acesso no armazenamento local do navegador.
                  A sessão do sistema não é compartilhada automaticamente com esta landing page.
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Dados de Uso</h3>
                <p className="text-sm text-muted-foreground">
                  O painel registra acessos e operações autenticadas para acompanhar o uso e a segurança.
                  Isso não equivale a cookies de análise anônima nesta página.
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Preferências Locais</h3>
                <p className="text-sm text-muted-foreground">
                  As preferências disponíveis em cada aplicação podem ser mantidas no navegador. Limpar esses dados pode exigir novo acesso ou configuração.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Controles Aplicados</h2>
            <p className="text-muted-foreground">
              Os controles técnicos do sistema incluem:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Acesso aos dados limitado à organização e às permissões da pessoa</li>
              <li>Validação de papéis, módulos e abrangência de filiais no servidor</li>
              <li>Arquivos protegidos por regras de acesso</li>
              <li>Senhas protegidas e possibilidade de bloqueio de contas</li>
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
