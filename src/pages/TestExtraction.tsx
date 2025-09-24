
import { TestDocumentExtraction } from "@/components/TestDocumentExtraction";
import { DocumentUploadCard } from "@/components/DocumentUploadCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Brain, CheckCircle } from "lucide-react";

const TestExtraction = () => {
  const navigate = useNavigate();

  const handleFileUploaded = (fileId: string) => {
    console.log("File uploaded:", fileId);
    navigate(`/licenciamento/analise?file_id=${fileId}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/licenciamento')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Teste de Extração de Documentos</h1>
            <p className="text-muted-foreground">
              Teste o fluxo completo de análise de documentos com IA
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Test */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              1. Teste de Upload
            </h2>
            <DocumentUploadCard onFileUploaded={handleFileUploaded} />
          </div>

          {/* Manual Test */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              2. Teste Manual
            </h2>
            <TestDocumentExtraction />
          </div>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Como Testar o Fluxo Completo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">1</Badge>
                <div>
                  <p className="font-medium">Upload de Arquivo</p>
                  <p className="text-sm text-muted-foreground">
                    Use um PDF com texto ou CSV simples. O upload deve criar um registro na tabela `files`.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">2</Badge>
                <div>
                  <p className="font-medium">Análise com IA</p>
                  <p className="text-sm text-muted-foreground">
                    A função `extract` deve processar o arquivo, chamar OpenAI e criar registros em `extractions` e `extraction_items_staging`.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">3</Badge>
                <div>
                  <p className="font-medium">Reconciliação</p>
                  <p className="text-sm text-muted-foreground">
                    Revise os dados extraídos, edite se necessário, e aprove os itens para criar registros em `extraction_items_curated`.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Verificações Obrigatórias:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ JWT authentication funciona (sem JWT = 401)</li>
                <li>✓ extract-status reflete progresso correto</li>
                <li>✓ RLS impede acesso a dados de outros usuários</li>
                <li>✓ Botão "Próximo" só habilita com ≥1 item aprovado</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default TestExtraction;