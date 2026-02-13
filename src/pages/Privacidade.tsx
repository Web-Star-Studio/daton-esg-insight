import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { HeimdallNavbar } from '@/components/landing/heimdall/HeimdallNavbar';
import { PublicFooter } from '@/components/landing/heimdall/PublicFooter';

export default function Privacidade() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <HeimdallNavbar />

      <div className="max-w-4xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 h-11"
          aria-label="Voltar para a página anterior"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Voltar
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Política de Privacidade</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Introdução</h2>
            <p className="text-muted-foreground">
              A Daton ("nós", "nosso" ou "empresa") está comprometida em proteger sua privacidade. 
              Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos 
              suas informações pessoais quando você usa nossa plataforma de gestão ESG.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Dados que Coletamos</h2>
            <p className="text-muted-foreground">Coletamos as seguintes categorias de dados:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Dados de identificação:</strong> nome, e-mail, CPF/CNPJ, telefone</li>
              <li><strong>Dados empresariais:</strong> razão social, porte, setor de atuação</li>
              <li><strong>Dados de uso:</strong> logs de acesso, interações com a plataforma</li>
              <li><strong>Dados ESG:</strong> indicadores ambientais, sociais e de governança</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Como Usamos seus Dados</h2>
            <p className="text-muted-foreground">Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fornecer e melhorar nossos serviços de gestão ESG</li>
              <li>Processar relatórios de sustentabilidade e compliance</li>
              <li>Enviar comunicações relevantes sobre a plataforma</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Garantir a segurança da plataforma</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground">
              Não vendemos suas informações pessoais. Podemos compartilhar dados com:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Prestadores de serviços que nos auxiliam na operação da plataforma</li>
              <li>Autoridades reguladoras, quando exigido por lei</li>
              <li>Terceiros, mediante seu consentimento expresso</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground">
              Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Confirmar a existência de tratamento de seus dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados</li>
              <li>Revogar consentimentos anteriormente fornecidos</li>
              <li>Solicitar a portabilidade dos dados</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Segurança dos Dados</h2>
            <p className="text-muted-foreground">
              Implementamos medidas técnicas e organizacionais apropriadas para proteger seus dados, 
              incluindo criptografia, controle de acesso e monitoramento contínuo de segurança.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Retenção de Dados</h2>
            <p className="text-muted-foreground">
              Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta 
              política, ou conforme exigido por obrigações legais, contábeis ou regulatórias.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Contato</h2>
            <p className="text-muted-foreground">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato 
              com nosso Encarregado de Proteção de Dados (DPO):
            </p>
            <p className="text-muted-foreground">
              <strong>E-mail:</strong> privacidade@daton.com.br
            </p>
          </section>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
