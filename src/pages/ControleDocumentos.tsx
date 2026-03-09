import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemDocumentsTab } from "@/components/document-control/SystemDocumentsTab";
import { MasterListTab } from "@/components/document-control/MasterListTab";
import { ApprovalQueueTab } from "@/components/document-control/ApprovalQueueTab";
import { ImplementationProtocolTab } from "@/components/document-control/ImplementationProtocolTab";
import { ObsolescenceRetentionTab } from "@/components/document-control/ObsolescenceRetentionTab";
import { ExternalDocumentsTab } from "@/components/document-control/ExternalDocumentsTab";
import { FileText, List, CheckSquare, BookOpen, Archive, ExternalLink } from "lucide-react";

const ControleDocumentos = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Controle de Documentos SGQ</h1>
        <p className="text-muted-foreground">
          Gestão de documentos e registros do Sistema de Gestão da Qualidade
        </p>
      </div>

      <Tabs defaultValue="sistema" className="space-y-6">
        <TabsList className="grid w-full max-w-[800px] grid-cols-6">
          <TabsTrigger value="sistema" className="gap-1 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5 hidden sm:block" />
            Docs Sistema
          </TabsTrigger>
          <TabsTrigger value="lista-mestra" className="gap-1 text-xs sm:text-sm">
            <List className="h-3.5 w-3.5 hidden sm:block" />
            Lista Mestra
          </TabsTrigger>
          <TabsTrigger value="aprovacao" className="gap-1 text-xs sm:text-sm">
            <CheckSquare className="h-3.5 w-3.5 hidden sm:block" />
            Aprovação
          </TabsTrigger>
          <TabsTrigger value="implementacao" className="gap-1 text-xs sm:text-sm">
            <BookOpen className="h-3.5 w-3.5 hidden sm:block" />
            Implementação
          </TabsTrigger>
          <TabsTrigger value="obsolescencia" className="gap-1 text-xs sm:text-sm">
            <Archive className="h-3.5 w-3.5 hidden sm:block" />
            Obsol. & Ret.
          </TabsTrigger>
          <TabsTrigger value="externos" className="gap-1 text-xs sm:text-sm">
            <ExternalLink className="h-3.5 w-3.5 hidden sm:block" />
            Docs Externos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sistema" className="space-y-6">
          <SystemDocumentsTab />
        </TabsContent>

        <TabsContent value="lista-mestra" className="space-y-6">
          <MasterListTab />
        </TabsContent>

        <TabsContent value="aprovacao" className="space-y-6">
          <ApprovalQueueTab />
        </TabsContent>

        <TabsContent value="implementacao" className="space-y-6">
          <ImplementationProtocolTab />
        </TabsContent>

        <TabsContent value="obsolescencia" className="space-y-6">
          <ObsolescenceRetentionTab />
        </TabsContent>

        <TabsContent value="externos" className="space-y-6">
          <ExternalDocumentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ControleDocumentos;
