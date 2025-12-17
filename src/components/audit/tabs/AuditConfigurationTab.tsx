import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, FileText, List, FolderTree } from "lucide-react";
import { ResponseTypeManager } from "@/components/audit/standards/ResponseTypeManager";
import { StandardsLibrary } from "@/components/audit/standards/StandardsLibrary";
import { StandardItemsTree } from "@/components/audit/standards/StandardItemsTree";
import { CategoriesManager } from "@/components/audit/templates/CategoriesManager";
import { TemplatesManager } from "@/components/audit/templates/TemplatesManager";
import { AuditStandard } from "@/services/audit/standards";

export function AuditConfigurationTab() {
  const [selectedStandard, setSelectedStandard] = useState<AuditStandard | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Configurações de Auditoria</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie tipos de resposta, normas, categorias e templates
          </p>
        </div>
      </div>

      <Tabs defaultValue="response-types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="response-types" className="gap-2">
            <List className="h-4 w-4" />
            Tipos de Resposta
          </TabsTrigger>
          <TabsTrigger value="standards" className="gap-2">
            <FileText className="h-4 w-4" />
            Normas
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="response-types">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Resposta</CardTitle>
              <CardDescription>
                Configure os tipos de resposta disponíveis para as auditorias (Conforme/NC, Escala 0-100, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponseTypeManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standards">
          {selectedStandard ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedStandard(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle>{selectedStandard.name}</CardTitle>
                    <CardDescription>
                      {selectedStandard.code} {selectedStandard.version && `• v${selectedStandard.version}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <StandardItemsTree standard={selectedStandard} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Biblioteca de Normas</CardTitle>
                <CardDescription>
                  Cadastre e gerencie as normas utilizadas nas auditorias (ISO 9001, ISO 14001, GRI, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StandardsLibrary onSelectStandard={setSelectedStandard} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categorias de Auditoria</CardTitle>
              <CardDescription>
                Organize suas auditorias em categorias para facilitar a gestão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoriesManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Auditoria</CardTitle>
              <CardDescription>
                Crie auditorias padrão reutilizáveis com normas e planejamentos pré-definidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplatesManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
