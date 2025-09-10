import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Download, AlertCircle } from 'lucide-react';
import { dataCollectionService } from '@/services/dataCollection';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DataImportZoneProps {
  onUploadComplete: () => void;
}

export function DataImportZone({ onUploadComplete }: DataImportZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) => 
      dataCollectionService.uploadFile(file, type),
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedFile(null);
      setImportType('');
      onUploadComplete();
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Erro no upload do arquivo');
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !importType) {
      toast.error('Selecione um arquivo e o tipo de importação');
      return;
    }

    uploadMutation.mutate({ file: selectedFile, type: importType });
  };

  const downloadTemplate = async (type: string) => {
    try {
      const { data, fileName } = await dataCollectionService.getTemplate(type);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Template baixado com sucesso!');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Erro ao baixar template');
    }
  };

  const importTypeOptions = [
    { value: 'activity_data', label: 'Dados de Atividade (GEE)' },
    { value: 'waste_logs', label: 'Registros de Resíduos' },
    { value: 'mixed', label: 'Dados Mistos' },
  ];

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importação em Massa
          </CardTitle>
          <CardDescription>
            Faça upload de arquivos XLSX ou CSV para importar dados em lote
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <FileText className="mx-auto h-12 w-12 text-primary" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Remover
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Arraste arquivos aqui</p>
                  <p className="text-muted-foreground">ou</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Selecionar Arquivos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Import Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Importação</label>
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de dados" />
              </SelectTrigger>
              <SelectContent>
                {importTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !importType || uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? 'Enviando...' : 'Iniciar Importação'}
          </Button>
        </CardContent>
      </Card>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Templates de Planilhas
          </CardTitle>
          <CardDescription>
            Baixe os modelos de planilhas para cada tipo de importação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {importTypeOptions.map((option) => (
              <Card key={option.value} className="p-4">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <Badge variant="outline" className="mt-1">
                      Template JSON
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => downloadTemplate(option.value)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Instruções de Uso</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Baixe o template apropriado para seu tipo de dados</li>
                  <li>• Preencha os dados seguindo exatamente a estrutura do modelo</li>
                  <li>• Salve como arquivo XLSX ou CSV antes de fazer o upload</li>
                  <li>• Certifique-se de que as datas estão no formato correto (YYYY-MM-DD)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}