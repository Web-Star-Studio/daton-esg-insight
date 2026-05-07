import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, ClipboardList, Info, Lightbulb, Scale } from "lucide-react";
import { ComplianceProfilesManager } from "@/components/legislation/ComplianceProfilesManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const LegislationComplianceProfiles: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Questionário de Compliance | Legislações</title>
        <meta name="description" content="Configure o perfil de compliance de cada unidade para filtrar legislações relevantes" />
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/licenciamento/legislacoes')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              Questionário de Compliance
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure o perfil de cada unidade para identificar legislações aplicáveis
            </p>
          </div>
        </div>
        <Button 
          variant="outline"
          onClick={() => navigate('/licenciamento/legislacoes')}
        >
          <Scale className="h-4 w-4 mr-2" />
          Ver Legislações
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Como funciona o Questionário de Compliance?</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            O questionário cobre 21 temas de compliance organizados por área de risco regulatório,
            como por exemplo:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
            <li>Licenciamento ambiental, instalações e localização (fauna/flora)</li>
            <li>Produtos químicos, perigosos e produtos florestais</li>
            <li>Recursos hídricos, efluentes, emissões atmosféricas e resíduos</li>
            <li>Equipamentos, energia e transporte (rodoviário, aéreo, marítimo)</li>
            <li>Profissionais, PCD, saúde do trabalhador e Normas Regulamentadoras (NR)</li>
            <li>Mineração, pesagem e LGPD</li>
          </ul>
          <p className="mt-2 font-medium">
            As respostas geram tags de compliance da unidade, usadas para filtrar legislações
            aplicáveis e disparar notificações quando novas leis relevantes forem cadastradas.
          </p>
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <ComplianceProfilesManager 
        onFilterChange={setSelectedTags}
        selectedTags={selectedTags}
      />

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Como usar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="font-medium">Configure cada unidade</h4>
              <p className="text-sm text-muted-foreground">
                Clique em "Configurar Perfil" em cada unidade e responda o questionário sobre
                suas características, atividades e responsabilidades.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="font-medium">Tags são geradas automaticamente</h4>
              <p className="text-sm text-muted-foreground">
                Com base nas respostas, o sistema gera tags que identificam as áreas de
                responsabilidade legal da unidade.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="font-medium">Filtre legislações relevantes</h4>
              <p className="text-sm text-muted-foreground">
                Use as tags para filtrar a lista de legislações e ver apenas aquelas que
                são realmente aplicáveis às suas unidades.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegislationComplianceProfiles;
