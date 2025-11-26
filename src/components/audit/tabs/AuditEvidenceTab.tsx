import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image, Download } from "lucide-react";

interface AuditEvidenceTabProps {
  auditId: string;
}

export function AuditEvidenceTab({ auditId }: AuditEvidenceTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Evidências e Documentos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie documentos, fotos e registros da auditoria
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload de Evidência
        </Button>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Sistema de Evidências</h3>
          <p className="text-muted-foreground">
            Funcionalidade em desenvolvimento - Em breve você poderá fazer upload e gerenciar evidências
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
