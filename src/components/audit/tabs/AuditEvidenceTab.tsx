import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Download, Trash2, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditEvidenceTabProps {
  auditId: string;
}

export function AuditEvidenceTab({ auditId }: AuditEvidenceTabProps) {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: evidence } = useQuery({
    queryKey: ['audit-evidence', auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_evidence')
        .select('*, uploaded_by:profiles!audit_evidence_uploaded_by_user_id_fkey(full_name)')
        .eq('audit_id', auditId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (evidenceId: string) => {
      const evidence = await supabase
        .from('audit_evidence')
        .select('file_url')
        .eq('id', evidenceId)
        .single();

      if (evidence.data?.file_url) {
        const fileName = evidence.data.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('audit-evidence')
            .remove([`${auditId}/${fileName}`]);
        }
      }

      const { error } = await supabase
        .from('audit_evidence')
        .delete()
        .eq('id', evidenceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-evidence', auditId] });
      toast({
        title: "Evidência removida",
        description: "A evidência foi excluída com sucesso.",
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${auditId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('audit-evidence')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('audit-evidence')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('audit_evidence')
          .insert({
            audit_id: auditId,
            file_url: publicUrl,
            file_name: file.name,
            file_type: file.type,
            uploaded_by_user_id: user.id,
          });

        if (dbError) throw dbError;
      }

      queryClient.invalidateQueries({ queryKey: ['audit-evidence', auditId] });
      toast({
        title: "Upload concluído",
        description: `${files.length} evidência(s) adicionada(s) com sucesso.`,
      });
      e.target.value = '';
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Evidências e Documentos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie documentos, fotos e registros da auditoria
          </p>
        </div>
        <div>
          <input
            type="file"
            id="evidence-upload"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
          <Button onClick={() => document.getElementById('evidence-upload')?.click()} disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Enviando..." : "Upload de Evidência"}
          </Button>
        </div>
      </div>

      {evidence && evidence.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evidence.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(item.file_type || '')}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.uploaded_by?.full_name || 'Desconhecido'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(item.file_url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma evidência registrada</h3>
            <p className="text-muted-foreground">
              Faça upload de documentos, fotos e registros relacionados à auditoria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
