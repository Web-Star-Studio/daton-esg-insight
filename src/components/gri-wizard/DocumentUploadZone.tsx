import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { uploadDocument } from '@/services/documents';

interface DocumentUploadZoneProps {
  reportId?: string;
}

export function DocumentUploadZone({ reportId }: DocumentUploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<any[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!reportId) {
      toast.error('Report ID não encontrado');
      return;
    }

    const newFiles = acceptedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
      category: null,
    }));

    setUploadingFiles(prev => [...prev, ...newFiles]);

    for (const fileObj of newFiles) {
      try {
        // Upload com o serviço unificado
        const uploadedDoc = await uploadDocument(fileObj.file, {
          skipAutoProcessing: true,
          related_model: 'gri_report',
          related_id: reportId,
          tags: ['gri-report']
        });

        // Get user and profile info first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile?.company_id) {
          throw new Error('Erro ao identificar empresa');
        }

        // Read file content for AI processing
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;

          // Call AI to process document
          const { data, error: functionError } = await supabase.functions.invoke(
            'gri-report-ai-configurator',
            {
              body: {
                action: 'upload_document',
                report_id: reportId,
                file_content: content.substring(0, 50000),
                file_type: fileObj.file.name.split('.').pop(),
              },
            }
          );

          if (functionError) {
            // Tratamento de erros
            if (functionError.message?.includes('429')) {
              throw new Error('Limite de taxa atingido. Aguarde alguns instantes.');
            }
            if (functionError.message?.includes('402')) {
              throw new Error('Créditos de IA esgotados. Adicione créditos em Configurações.');
            }
            throw functionError;
          }

          // Save document metadata
          await supabase.from('gri_document_uploads').insert({
            report_id: reportId,
            company_id: profile.company_id,
            file_name: fileObj.file.name,
            file_path: uploadedDoc.file_path,
            file_type: fileObj.file.name.split('.').pop() || 'unknown',
            file_size_kb: Math.round(fileObj.file.size / 1024),
            category: data.analysis.category,
            extracted_text: data.extracted_text,
            extracted_metrics: data.analysis.extracted_metrics,
            suggested_indicators: data.analysis.suggested_indicators,
            confidence_score: data.analysis.confidence_score,
            processing_status: 'completed',
            uploaded_by_user_id: user.id,
            processed_at: new Date().toISOString(),
          });

          setUploadingFiles(prev =>
            prev.map(f =>
              f.name === fileObj.name
                ? { ...f, status: 'completed', progress: 100, category: data.analysis.category }
                : f
            )
          );

          toast.success(`${fileObj.file.name} processado com sucesso!`);
        };

        reader.readAsText(fileObj.file);
      } catch (error: any) {
        console.error('Upload error:', error);
        setUploadingFiles(prev =>
          prev.map(f =>
            f.name === fileObj.name ? { ...f, status: 'error', progress: 0 } : f
          )
        );
        toast.error(`Erro ao processar ${fileObj.file.name}: ${error.message}`);
      }
    }
  }, [reportId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Ambiental: 'bg-green-100 text-green-800',
      Social: 'bg-blue-100 text-blue-800',
      Econômico: 'bg-yellow-100 text-yellow-800',
      Governança: 'bg-purple-100 text-purple-800',
      Geral: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.Geral;
  };

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium text-foreground mb-2">
          {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
        </p>
        <p className="text-sm text-muted-foreground">
          Suporta: PDF, Excel (.xlsx, .xls), CSV, Word (.docx)
        </p>
      </Card>

      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-foreground">Arquivos Enviados</h4>
          {uploadingFiles.map((file, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.category && (
                    <Badge className={getCategoryColor(file.category)} variant="secondary">
                      {file.category}
                    </Badge>
                  )}
                  {file.status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  {file.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  {file.status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
                </div>
              </div>
              {file.status === 'uploading' && <Progress value={file.progress} className="h-1" />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
