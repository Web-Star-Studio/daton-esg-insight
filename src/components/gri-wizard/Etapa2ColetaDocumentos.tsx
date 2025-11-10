import { DocumentUploadZone } from './DocumentUploadZone';
import { StrategyDataCollectionModule } from './StrategyDataCollectionModule';
import { GovernanceDataCollectionModule } from './GovernanceDataCollectionModule';
import EnvironmentalDataCollectionModule from './EnvironmentalDataCollectionModule';
import { SocialDataCollectionModule } from './SocialDataCollectionModule';
import { EconomicDataCollectionModule } from './EconomicDataCollectionModule';
import StakeholderEngagementDataModule from './StakeholderEngagementDataModule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, FileText, Leaf, Users, DollarSign, Shield, Target } from 'lucide-react';
import { toast } from 'sonner';

const CHECKLIST_CATEGORIAS = [
  {
    title: 'Documentos Ambientais',
    icon: Leaf,
    color: 'text-green-600',
    items: [
      'Inventário de Emissões GEE',
      'Relatório de Gestão de Resíduos',
      'Licenças Ambientais',
      'Monitoramento de Consumo de Água',
      'Relatório de Energia',
    ]
  },
  {
    title: 'Documentos Sociais',
    icon: Users,
    color: 'text-blue-600',
    items: [
      'Quadro de Funcionários',
      'Relatório de Segurança do Trabalho',
      'Programas de Treinamento',
      'Projetos Sociais',
      'Políticas de Diversidade',
    ]
  },
  {
    title: 'Documentos Econômicos',
    icon: DollarSign,
    color: 'text-yellow-600',
    items: [
      'Demonstrações Financeiras',
      'Impostos Pagos',
      'Investimentos em Inovação',
      'Fornecedores Locais',
    ]
  },
  {
    title: 'Documentos de Governança',
    icon: Shield,
    color: 'text-purple-600',
    items: [
      'Estatuto Social',
      'Código de Conduta',
      'Políticas Internas',
      'Matriz de Riscos',
      'Relatório de Auditoria',
    ]
  },
];

interface Etapa2Props {
  reportId?: string;
  reportData: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export function Etapa2ColetaDocumentos({ reportId, onNext }: Etapa2Props) {
  return (
      <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="general" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documentos Gerais
        </TabsTrigger>
        <TabsTrigger value="strategy" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Visão e Estratégia
        </TabsTrigger>
        <TabsTrigger value="governance" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Governança Corporativa
        </TabsTrigger>
        <TabsTrigger value="environmental" className="flex items-center gap-2">
          <Leaf className="h-4 w-4" />
          Gestão Ambiental
        </TabsTrigger>
        <TabsTrigger value="social" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Desempenho Social
        </TabsTrigger>
        <TabsTrigger value="economic" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Econômico
        </TabsTrigger>
        <TabsTrigger value="stakeholders" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Stakeholders
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Faça upload dos documentos que servirão de base para o relatório GRI. A IA irá analisá-los automaticamente
            e extrair informações relevantes para cada indicador.
          </p>
        </div>

        <DocumentUploadZone reportId={reportId} />

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Checklist de Documentos ESG
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CHECKLIST_CATEGORIAS.map((categoria) => (
              <Card key={categoria.title}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <categoria.icon className={`h-5 w-5 ${categoria.color}`} />
                    {categoria.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {categoria.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </TabsContent>

        <TabsContent value="strategy">
          <StrategyDataCollectionModule
            reportId={reportId || ''}
            onComplete={() => {
              toast.success('Dados de estratégia completos!');
              onNext();
            }}
          />
        </TabsContent>

        <TabsContent value="governance">
          <GovernanceDataCollectionModule
            reportId={reportId || ''}
            onComplete={() => {
              toast.success('Dados de governança completos!');
              onNext();
            }}
          />
        </TabsContent>

        <TabsContent value="environmental">
          <EnvironmentalDataCollectionModule
            reportId={reportId || ''}
            onComplete={() => {
              toast.success('Dados de gestão ambiental completos!');
              onNext();
            }}
          />
        </TabsContent>

        <TabsContent value="social">
          <SocialDataCollectionModule
            reportId={reportId || ''}
            onComplete={() => {
              toast.success('Dados sociais completos!');
              onNext();
            }}
          />
        </TabsContent>

      <TabsContent value="economic">
        <EconomicDataCollectionModule
          reportId={reportId || ''}
          onComplete={() => {
            toast.success('Dados econômicos completos!');
            onNext();
          }}
        />
      </TabsContent>

      <TabsContent value="stakeholders">
        <StakeholderEngagementDataModule
          reportId={reportId || ''}
          onComplete={() => {
            toast.success('Dados de stakeholder engagement completos!');
            onNext();
          }}
        />
      </TabsContent>
    </Tabs>
  );
}
