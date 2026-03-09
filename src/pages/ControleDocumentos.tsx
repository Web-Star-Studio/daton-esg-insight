import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegulatoryDocumentsTab } from "@/components/document-control/RegulatoryDocumentsTab";
import { SGQIsoDocumentsTab } from "@/components/document-control/SGQIsoDocumentsTab";
import { DocumentSettingsTab } from "@/components/document-control/DocumentSettingsTab";

const ControleDocumentos = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Controle de Documentos</h1>
        <p className="text-muted-foreground">
          Gestão separada entre documentos regulatórios e documentos SGQ/ISO.
        </p>
      </div>

      <Tabs defaultValue="regulatorio" className="space-y-6">
        <TabsList className="grid w-full max-w-[560px] grid-cols-3">
          <TabsTrigger value="regulatorio">Documentos Regulatórios</TabsTrigger>
          <TabsTrigger value="sgq-iso">SGQ/ISO</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="regulatorio" className="space-y-6">
          <RegulatoryDocumentsTab />
        </TabsContent>

        <TabsContent value="sgq-iso" className="space-y-6">
          <SGQIsoDocumentsTab />
        </TabsContent>

        <TabsContent value="configuracoes" className="space-y-6">
          <DocumentSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ControleDocumentos;
