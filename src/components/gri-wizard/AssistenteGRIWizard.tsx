import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Lightbulb } from 'lucide-react';
import { Etapa1Planejamento } from './Etapa1Planejamento';
import { Etapa2ColetaDocumentos } from './Etapa2ColetaDocumentos';
import { Etapa3AnaliseDocumentos } from './Etapa3AnaliseDocumentos';
import { Etapa4RelatorioPreliminar } from './Etapa4RelatorioPreliminar';
import { Etapa5RelatorioFinal } from './Etapa5RelatorioFinal';
import { Etapa6AjustesAlinhamento } from './Etapa6AjustesAlinhamento';
import { Etapa7Diagramacao } from './Etapa7Diagramacao';
import { GRIConfigurationProgress } from './GRIConfigurationProgress';
import { toast } from 'sonner';

interface AssistenteGRIWizardProps {
  reportId?: string;
}

const ETAPAS = [
  { id: 1, title: 'Planejamento', description: 'Definição de escopo e objetivos' },
  { id: 2, title: 'Coleta de Documentos', description: 'Upload e organização de evidências' },
  { id: 3, title: 'Análise de Documentos', description: 'Processamento e validação pela IA' },
  { id: 4, title: 'Relatório Preliminar', description: 'Geração automática de conteúdo' },
  { id: 5, title: 'Relatório Final', description: 'Consolidação e índice GRI' },
  { id: 6, title: 'Ajustes e Alinhamento', description: 'Revisão colaborativa' },
  { id: 7, title: 'Diagramação', description: 'Identidade visual e exportação' },
];

export function AssistenteGRIWizard({ reportId }: AssistenteGRIWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [reportData, setReportData] = useState<any>({});

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
      toast.success(`Avançando para ${ETAPAS[currentStep].title}`);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    toast.success('Progresso salvo automaticamente');
  };

  const renderStep = () => {
    const stepProps = {
      reportId,
      reportData,
      onUpdate: setReportData,
      onNext: handleNext
    };

    switch (currentStep) {
      case 1:
        return <Etapa1Planejamento reportId={reportId} reportData={reportData} onUpdate={setReportData} onNext={handleNext} />;
      case 2:
        return <Etapa2ColetaDocumentos reportId={reportId} reportData={reportData} onUpdate={setReportData} onNext={handleNext} />;
      case 3:
        return <Etapa3AnaliseDocumentos reportId={reportId} />;
      case 4:
        return <Etapa4RelatorioPreliminar reportId={reportId} />;
      case 5:
        return <Etapa5RelatorioFinal reportId={reportId} />;
      case 6:
        return <Etapa6AjustesAlinhamento />;
      case 7:
        return <Etapa7Diagramacao />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assistente de Configuração GRI</h1>
            <p className="text-muted-foreground">Crie relatórios de sustentabilidade com IA</p>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <GRIConfigurationProgress currentStep={currentStep} steps={ETAPAS} />

      {/* Current Step Content */}
      <Card className="mt-8 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {ETAPAS[currentStep - 1].title}
          </h2>
          <p className="text-muted-foreground">
            {ETAPAS[currentStep - 1].description}
          </p>
        </div>

        {renderStep()}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        <Button variant="ghost" onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Progresso
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentStep === 7}
        >
          Próxima
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
