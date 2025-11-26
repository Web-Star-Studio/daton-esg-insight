import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

interface AuditReportTabProps {
  audit: any;
}

export function AuditReportTab({ audit }: AuditReportTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Relatório de Auditoria</h3>
          <p className="text-sm text-muted-foreground">
            Gere e exporte o relatório final da auditoria
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Geração de Relatórios</h3>
          <p className="text-muted-foreground">
            Funcionalidade em desenvolvimento - Em breve você poderá gerar relatórios formatados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
