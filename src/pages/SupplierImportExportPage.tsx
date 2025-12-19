import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, Download, FileSpreadsheet, CheckCircle, XCircle, 
  AlertTriangle, Loader2, FileDown, FileUp, FileText, Users
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

import * as exportService from '@/services/supplierExportService';
import type { ParsedSupplier, ValidationResult, ImportResult, ParsedDocument, DocumentValidationResult, DocumentImportResult } from '@/services/supplierExportService';

export default function SupplierImportExportPage() {
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.id;

  const [activeTab, setActiveTab] = useState<'suppliers' | 'documents'>('suppliers');
  
  // Supplier import states
  const [parsedData, setParsedData] = useState<ParsedSupplier[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'validate' | 'import' | 'result'>('upload');
  
  // Document import states
  const [parsedDocs, setParsedDocs] = useState<ParsedDocument[]>([]);
  const [docValidation, setDocValidation] = useState<DocumentValidationResult | null>(null);
  const [docImportResult, setDocImportResult] = useState<DocumentImportResult | null>(null);
  const [docStep, setDocStep] = useState<'upload' | 'validate' | 'import' | 'result'>('upload');

  // Supplier dropzone
  const onDropSuppliers = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsProcessing(true);
    
    try {
      const data = await exportService.parseSupplierImportFile(file);
      setParsedData(data);
      
      const validation = exportService.validateSupplierImportData(data);
      setValidationResult(validation);
      setStep('validate');
      
      if (validation.isValid) {
        toast.success(`${data.length} fornecedores prontos para importar`);
      } else {
        toast.warning(`${validation.errors.length} erros encontrados`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar arquivo');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const supplierDropzone = useDropzone({
    onDrop: onDropSuppliers,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  // Document dropzone
  const onDropDocuments = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsProcessing(true);
    
    try {
      const data = await exportService.parseDocumentImportFile(file);
      setParsedDocs(data);
      
      const validation = exportService.validateDocumentImportData(data);
      setDocValidation(validation);
      setDocStep('validate');
      
      if (validation.isValid) {
        toast.success(`${data.length} documentos prontos para importar`);
      } else {
        toast.warning(`${validation.errors.length} erros encontrados`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar arquivo');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const documentDropzone = useDropzone({
    onDrop: onDropDocuments,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleDownloadTemplate = () => {
    exportService.downloadSupplierImportTemplate();
    toast.success('Template baixado!');
  };

  const handleDownloadDocTemplate = () => {
    exportService.downloadDocumentImportTemplate();
    toast.success('Template de documentos baixado!');
  };

  const handleExportSuppliers = async () => {
    if (!companyId) return;
    
    try {
      await exportService.exportSuppliersList(companyId);
      toast.success('Lista de fornecedores exportada!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar');
    }
  };

  const handleImportSuppliers = async () => {
    if (!companyId || !validationResult?.validData.length) return;
    
    setIsProcessing(true);
    setStep('import');
    
    try {
      const result = await exportService.importSuppliers(companyId, validationResult.validData);
      setImportResult(result);
      setStep('result');
      
      if (result.failed === 0) {
        toast.success(`${result.success} fornecedores importados com sucesso!`);
      } else {
        toast.warning(`${result.success} importados, ${result.failed} falharam`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro na importação');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportDocuments = async () => {
    if (!companyId || !docValidation?.validData.length) return;
    
    setIsProcessing(true);
    setDocStep('import');
    
    try {
      const result = await exportService.importDocuments(companyId, docValidation.validData);
      setDocImportResult(result);
      setDocStep('result');
      
      if (result.failed === 0) {
        toast.success(`${result.success} documentos importados com sucesso!`);
      } else {
        toast.warning(`${result.success} importados, ${result.failed} falharam`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro na importação');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetSuppliers = () => {
    setParsedData([]);
    setValidationResult(null);
    setImportResult(null);
    setStep('upload');
  };

  const handleResetDocuments = () => {
    setParsedDocs([]);
    setDocValidation(null);
    setDocImportResult(null);
    setDocStep('upload');
  };

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Selecione uma empresa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7 text-primary" />
            Importar / Exportar
          </h1>
          <p className="text-muted-foreground">
            Gerencie fornecedores e documentos em massa via arquivos Excel
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'suppliers' | 'documents')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos Obrigatórios
          </TabsTrigger>
        </TabsList>

        {/* SUPPLIERS TAB */}
        <TabsContent value="suppliers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="h-5 w-5" />
                  Exportar Fornecedores
                </CardTitle>
                <CardDescription>
                  Baixe a lista completa de fornecedores cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleExportSuppliers} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Lista Completa
                </Button>
                <Button onClick={handleDownloadTemplate} variant="outline" className="w-full">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Baixar Template de Importação
                </Button>
              </CardContent>
            </Card>

            {/* Import Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="h-5 w-5" />
                  Importar Fornecedores
                </CardTitle>
                <CardDescription>
                  Cadastre múltiplos fornecedores via arquivo Excel
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step === 'upload' && (
                  <div
                    {...supplierDropzone.getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      ${supplierDropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                  >
                    <input {...supplierDropzone.getInputProps()} />
                    <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    {supplierDropzone.isDragActive ? (
                      <p className="text-primary font-medium">Solte o arquivo aqui...</p>
                    ) : (
                      <>
                        <p className="font-medium">Arraste um arquivo Excel ou clique para selecionar</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Formatos aceitos: .xlsx, .xls, .csv
                        </p>
                      </>
                    )}
                  </div>
                )}

                {isProcessing && step !== 'result' && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Processando...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Validation Results */}
          {step === 'validate' && validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  Resultado da Validação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Badge variant="default" className="text-base px-4 py-1">
                    {validationResult.validData.length} válidos
                  </Badge>
                  {validationResult.errors.length > 0 && (
                    <Badge variant="destructive" className="text-base px-4 py-1">
                      {validationResult.errors.length} erros
                    </Badge>
                  )}
                </div>

                {validationResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Erros encontrados:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validationResult.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>Linha {err.row}: {err.field} - {err.message}</li>
                        ))}
                        {validationResult.errors.length > 5 && (
                          <li>...e mais {validationResult.errors.length - 5} erros</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validationResult.validData.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CNPJ/CPF</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Razão Social</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationResult.validData.slice(0, 5).map((supplier, i) => (
                        <TableRow key={i}>
                          <TableCell>{supplier.document_number}</TableCell>
                          <TableCell>{supplier.person_type}</TableCell>
                          <TableCell>{supplier.corporate_name}</TableCell>
                          <TableCell>{supplier.contact_email || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleImportSuppliers} disabled={validationResult.validData.length === 0}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar {validationResult.validData.length} Fornecedores
                  </Button>
                  <Button onClick={handleResetSuppliers} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {step === 'result' && importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.failed === 0 ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  Resultado da Importação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Badge variant="default" className="text-base px-4 py-1">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {importResult.success} importados
                  </Badge>
                  {importResult.failed > 0 && (
                    <Badge variant="destructive" className="text-base px-4 py-1">
                      <XCircle className="h-4 w-4 mr-1" />
                      {importResult.failed} falharam
                    </Badge>
                  )}
                </div>

                {importResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Erros na importação:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>Linha {err.row}: {err.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleResetSuppliers}>
                  Nova Importação
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template Download */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="h-5 w-5" />
                  Template de Documentos
                </CardTitle>
                <CardDescription>
                  Baixe o template para importação de documentos obrigatórios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleDownloadDocTemplate} variant="outline" className="w-full">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Baixar Template de Documentos
                </Button>
                <p className="text-sm text-muted-foreground">
                  O template contém as colunas: Nome do Documento e Peso (1-10)
                </p>
              </CardContent>
            </Card>

            {/* Import Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="h-5 w-5" />
                  Importar Documentos
                </CardTitle>
                <CardDescription>
                  Cadastre múltiplos documentos obrigatórios via arquivo Excel
                </CardDescription>
              </CardHeader>
              <CardContent>
                {docStep === 'upload' && (
                  <div
                    {...documentDropzone.getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      ${documentDropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                  >
                    <input {...documentDropzone.getInputProps()} />
                    <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    {documentDropzone.isDragActive ? (
                      <p className="text-primary font-medium">Solte o arquivo aqui...</p>
                    ) : (
                      <>
                        <p className="font-medium">Arraste um arquivo Excel ou clique para selecionar</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Formatos aceitos: .xlsx, .xls, .csv
                        </p>
                      </>
                    )}
                  </div>
                )}

                {isProcessing && docStep !== 'result' && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Processando...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document Validation Results */}
          {docStep === 'validate' && docValidation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {docValidation.isValid ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  Resultado da Validação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Badge variant="default" className="text-base px-4 py-1">
                    {docValidation.validData.length} válidos
                  </Badge>
                  {docValidation.errors.length > 0 && (
                    <Badge variant="destructive" className="text-base px-4 py-1">
                      {docValidation.errors.length} erros
                    </Badge>
                  )}
                </div>

                {docValidation.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Erros encontrados:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {docValidation.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>Linha {err.row}: {err.field} - {err.message}</li>
                        ))}
                        {docValidation.errors.length > 5 && (
                          <li>...e mais {docValidation.errors.length - 5} erros</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {docValidation.validData.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Documento</TableHead>
                        <TableHead>Peso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docValidation.validData.slice(0, 10).map((doc, i) => (
                        <TableRow key={i}>
                          <TableCell>{doc.document_name}</TableCell>
                          <TableCell>{doc.weight}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleImportDocuments} disabled={docValidation.validData.length === 0}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar {docValidation.validData.length} Documentos
                  </Button>
                  <Button onClick={handleResetDocuments} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document Import Results */}
          {docStep === 'result' && docImportResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {docImportResult.failed === 0 ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  Resultado da Importação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Badge variant="default" className="text-base px-4 py-1">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {docImportResult.success} importados
                  </Badge>
                  {docImportResult.failed > 0 && (
                    <Badge variant="destructive" className="text-base px-4 py-1">
                      <XCircle className="h-4 w-4 mr-1" />
                      {docImportResult.failed} falharam
                    </Badge>
                  )}
                </div>

                {docImportResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Erros na importação:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {docImportResult.errors.map((err, i) => (
                          <li key={i}>Linha {err.row}: {err.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleResetDocuments}>
                  Nova Importação
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}