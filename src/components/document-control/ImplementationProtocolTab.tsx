import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BookOpen, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { confirmDocumentRead } from "@/services/documentCompliance";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";

interface ReadConfirmation {
  id: string;
  document_id: string;
  user_id: string;
  confirmed_at: string | null;
  document_name?: string;
  document_code?: string;
}

export const ImplementationProtocolTab = () => {
  const [pendingReads, setPendingReads] = useState<any[]>([]);
  const [documentStats, setDocumentStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get documents that have controlled copies (require read confirmation)
      const { data: controlledDocs } = await (supabase as any)
        .from("documents")
        .select("id, file_name, code, approval_status")
        .eq("controlled_copy", true)
        .eq("approval_status", "aprovado");

      if (!controlledDocs?.length) {
        setDocumentStats([]);
        setPendingReads([]);
        setLoading(false);
        return;
      }

      // Get read confirmations
      const docIds = controlledDocs.map((d: any) => d.id);
      const { data: confirmations } = await (supabase as any)
        .from("document_read_confirmations")
        .select("*")
        .in("document_id", docIds);

      // Build stats per document
      const stats = controlledDocs.map((doc: any) => {
        const docConfirmations = (confirmations || []).filter(
          (c: any) => c.document_id === doc.id
        );
        const confirmed = docConfirmations.filter((c: any) => c.confirmed_at !== null).length;
        const total = docConfirmations.length;
        return {
          ...doc,
          confirmed,
          total,
          percentage: total > 0 ? Math.round((confirmed / total) * 100) : 0,
        };
      });

      setDocumentStats(stats);

      // My pending reads
      const myPending = (confirmations || [])
        .filter((c: any) => c.user_id === userData.user!.id && !c.confirmed_at)
        .map((c: any) => {
          const doc = controlledDocs.find((d: any) => d.id === c.document_id);
          return {
            ...c,
            document_name: doc?.file_name || "Documento",
            document_code: doc?.code || "",
          };
        });

      setPendingReads(myPending);
    } catch (error) {
      console.error("Erro ao carregar protocolo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleConfirmRead = async (documentId: string) => {
    try {
      setConfirmingId(documentId);
      await confirmDocumentRead(documentId);
      toast({ title: "Leitura confirmada", description: "Sua confirmação foi registrada." });
      await loadData();
    } catch (error: unknown) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível confirmar.",
        variant: "destructive",
      });
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <EnhancedLoading size="lg" text="Carregando protocolo de implementação..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* My pending confirmations */}
      {pendingReads.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <BookOpen className="h-5 w-5" />
              Minhas Confirmações Pendentes
            </CardTitle>
            <CardDescription>
              Documentos que requerem sua confirmação de leitura e implementação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingReads.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <span className="font-mono text-sm text-muted-foreground">{item.document_code}</span>
                    <p className="font-medium">{item.document_name}</p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1"
                    disabled={confirmingId === item.document_id}
                    onClick={() => handleConfirmRead(item.document_id)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {confirmingId === item.document_id ? "Confirmando..." : "Confirmar Leitura"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document implementation dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dashboard de Implementação (RG-DOC.01)
          </CardTitle>
          <CardDescription>
            Acompanhamento de confirmações de leitura por documento controlado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documentStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum documento controlado aprovado para acompanhar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Confirmações</TableHead>
                    <TableHead className="w-[200px]">Progresso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentStats.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-mono font-medium">{doc.code || "—"}</TableCell>
                      <TableCell>{doc.file_name}</TableCell>
                      <TableCell>
                        <Badge variant={doc.percentage === 100 ? "default" : "secondary"}>
                          {doc.confirmed}/{doc.total}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={doc.percentage} className="flex-1" />
                          <span className="text-sm text-muted-foreground">{doc.percentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
