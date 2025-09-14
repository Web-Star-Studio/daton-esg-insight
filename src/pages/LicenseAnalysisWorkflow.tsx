import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Upload, Brain, CheckCircle2 } from "lucide-react";
import { DocumentUploadCard } from "@/components/DocumentUploadCard";

const LicenseAnalysisWorkflow = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [fileId, setFileId] = useState<string | null>(null);

  const handleFileUploaded = (uploadedFileId: string) => {
    setFileId(uploadedFileId);
    // Automatically move to analysis step
    navigate(`/licenciamento/analise?file_id=${uploadedFileId}`);
  };

  const steps = [
    {
      number: 1,
      title: "Upload do Documento",
      description: "Envie o documento da licença para análise",
      icon: Upload,
      status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'upcoming'
    },
    {
      number: 2,
      title: "Análise com IA",
      description: "Nossa IA extrai automaticamente os dados do documento",
      icon: Brain,
      status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'upcoming'
    },
    {
      number: 3,
      title: "Reconciliação",
      description: "Revise e aprove os dados extraídos",
      icon: CheckCircle2,
      status: currentStep === 3 ? 'current' : 'upcoming'
    }
  ];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Análise Inteligente de Licenças</h1>
          <p className="text-muted-foreground">
            Use nossa IA para extrair automaticamente dados de documentos de licenciamento
          </p>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="flex items-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`
                        flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
                        ${step.status === 'completed' 
                          ? 'bg-green-100 border-green-500 text-green-700' 
                          : step.status === 'current'
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                        }
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-medium ${
                          step.status === 'current' ? 'text-blue-700' : 
                          step.status === 'completed' ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-muted-foreground max-w-[120px]">
                          {step.description}
                        </div>
                      </div>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={`
                        h-0.5 w-20 mx-4 transition-all
                        ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}
                      `} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <DocumentUploadCard onFileUploaded={handleFileUploaded} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Formatos Suportados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">PDF</Badge>
                      <span className="text-sm">Documentos com texto</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">CSV</Badge>
                      <span className="text-sm">Planilhas simples</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Excel</Badge>
                      <span className="text-sm">Planilhas Excel</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">TXT</Badge>
                      <span className="text-sm">Arquivos de texto</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Dicas para melhores resultados:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Use documentos com texto legível (não escaneados)</li>
                      <li>• Certifique-se de que o documento contém informações da licença</li>
                      <li>• Arquivos organizados geram melhores extrações</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default LicenseAnalysisWorkflow;