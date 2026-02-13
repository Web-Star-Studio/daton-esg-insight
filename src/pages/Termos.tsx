import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { HeimdallNavbar } from '@/components/landing/heimdall/HeimdallNavbar';
import { PublicFooter } from '@/components/landing/heimdall/PublicFooter';

export default function Termos() {
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

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Termos de Serviço</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao acessar ou usar a plataforma Daton, você concorda em cumprir e estar vinculado a estes 
              Termos de Serviço. Se você não concordar com qualquer parte destes termos, não deve usar 
              nossa plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground">
              A Daton fornece uma plataforma de gestão ESG (Environmental, Social and Governance) que 
              permite às empresas:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Monitorar e gerenciar indicadores de sustentabilidade</li>
              <li>Gerar relatórios de compliance ambiental e social</li>
              <li>Acompanhar licenciamentos e obrigações regulatórias</li>
              <li>Gerenciar inventários de emissões de GEE</li>
              <li>Integrar dados ESG em processos de tomada de decisão</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Conta de Usuário</h2>
            <p className="text-muted-foreground">
              Para utilizar nossos serviços, você deve criar uma conta. Você é responsável por:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Todas as atividades que ocorram sob sua conta</li>
              <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
              <li>Fornecer informações precisas e atualizadas</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Uso Aceitável</h2>
            <p className="text-muted-foreground">Você concorda em não:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violar quaisquer leis ou regulamentos aplicáveis</li>
              <li>Inserir dados falsos ou enganosos na plataforma</li>
              <li>Tentar acessar áreas não autorizadas do sistema</li>
              <li>Interferir no funcionamento adequado da plataforma</li>
              <li>Reproduzir ou redistribuir nosso conteúdo sem autorização</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              Todo o conteúdo da plataforma, incluindo software, textos, gráficos e logotipos, é de 
              propriedade da Daton ou de seus licenciadores e está protegido por leis de propriedade 
              intelectual.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Dados e Conteúdo do Usuário</h2>
            <p className="text-muted-foreground">
              Você mantém todos os direitos sobre os dados que insere na plataforma. Ao usar nossos 
              serviços, você nos concede uma licença limitada para processar esses dados conforme 
              necessário para fornecer os serviços contratados.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground">
              A Daton não será responsável por danos indiretos, incidentais, especiais ou consequenciais 
              resultantes do uso ou incapacidade de usar nossos serviços, na extensão máxima permitida 
              por lei.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Modificações dos Termos</h2>
            <p className="text-muted-foreground">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos sobre 
              alterações significativas através da plataforma ou por e-mail. O uso continuado após as 
              modificações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Lei Aplicável</h2>
            <p className="text-muted-foreground">
              Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa 
              será resolvida no foro da comarca de São Paulo/SP.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Contato</h2>
            <p className="text-muted-foreground">
              Para dúvidas sobre estes Termos de Serviço, entre em contato:
            </p>
            <p className="text-muted-foreground">
              <strong>E-mail:</strong> contato@daton.com.br
            </p>
          </section>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
