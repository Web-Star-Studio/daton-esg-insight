import React, { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Upload, Download, FileSpreadsheet, Check, AlertCircle, Building2, User } from 'lucide-react';
import { mailingService, MailingList } from '@/services/mailingService';
import { useToast } from '@/hooks/use-toast';

interface ImportContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mailingList: MailingList | null;
}

interface ParsedContact {
  email: string;
  name?: string;         // CONTATO
  companyName?: string;  // NOME
  metadata?: Record<string, any>;
  valid: boolean;
}

export function ImportContactsModal({
  open,
  onOpenChange,
  mailingList
}: ImportContactsModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [csvContent, setCsvContent] = useState<string>('');
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const { data: templateData } = useQuery({
    queryKey: ['csv-template'],
    queryFn: () => mailingService.getTemplate(),
    enabled: open
  });

  const importMutation = useMutation({
    mutationFn: () => mailingService.importContacts(mailingList!.id, csvContent),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['mailing-lists'] });
      queryClient.invalidateQueries({ queryKey: ['mailing-list-details'] });
      toast({ 
        title: 'Contatos importados!', 
        description: `${result.imported} de ${result.total} contatos foram importados.` 
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao importar', description: error.message, variant: 'destructive' });
    }
  });

  const parseCSV = useCallback((content: string) => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      setParsedContacts([]);
      return;
    }

    // Detect delimiter automatically (semicolon or comma)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase());
    const emailIndex = headers.indexOf('email');
    const companyNameIndex = headers.indexOf('nome');
    const contactNameIndex = headers.indexOf('contato');

    if (emailIndex === -1) {
      toast({ title: 'Arquivo inválido', description: 'O arquivo deve conter uma coluna "email"', variant: 'destructive' });
      return;
    }

    const contacts: ParsedContact[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim());
      const email = values[emailIndex];
      const isValidEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      const metadata: Record<string, any> = {};
      headers.forEach((header, idx) => {
        if (idx !== emailIndex && idx !== companyNameIndex && idx !== contactNameIndex && values[idx]) {
          metadata[header] = values[idx];
        }
      });

      contacts.push({
        email: email || '',
        companyName: companyNameIndex !== -1 ? values[companyNameIndex] : undefined,
        name: contactNameIndex !== -1 ? values[contactNameIndex] : undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        valid: isValidEmail
      });
    }

    setParsedContacts(contacts);
  }, [toast]);

  // Convert Excel file to CSV string
  const convertExcelToCSV = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          // Convert to CSV using semicolon as delimiter
          const csv = XLSX.utils.sheet_to_csv(firstSheet, { FS: ';' });
          resolve(csv);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);

    try {
      let content: string;

      // Check if it's an Excel file
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        content = await convertExcelToCSV(file);
      } else {
        // Regular CSV
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });
      }

      setCsvContent(content);
      parseCSV(content);
    } catch (error) {
      toast({
        title: 'Erro ao processar arquivo',
        description: 'Não foi possível ler o arquivo.',
        variant: 'destructive'
      });
    }
  }, [parseCSV, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const downloadTemplate = () => {
    if (!templateData) return;
    const blob = new Blob([templateData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_contatos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setCsvContent('');
    setParsedContacts([]);
    setFileName('');
    onOpenChange(false);
  };

  const validContacts = parsedContacts.filter(c => c.valid);
  const invalidContacts = parsedContacts.filter(c => !c.valid);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Contatos
          </DialogTitle>
          {mailingList && (
            <p className="text-sm text-muted-foreground">
              Lista: <span className="font-medium">{mailingList.name}</span>
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">Formato do CSV:</p>
            <ul className="text-muted-foreground space-y-0.5">
              <li><strong>NOME</strong> - Nome da empresa</li>
              <li><strong>CONTATO</strong> - Nome de quem vai receber o email</li>
              <li><strong>EMAIL</strong> - Email do contato (obrigatório)</li>
            </ul>
          </div>

          {/* Download Template */}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar Template CSV
          </Button>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            `}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            {fileName ? (
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">Clique para trocar o arquivo</p>
              </div>
            ) : isDragActive ? (
              <p>Solte o arquivo aqui...</p>
            ) : (
              <div>
                <p className="font-medium">Arraste um arquivo CSV ou Excel</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Formatos: .csv, .xlsx, .xls
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          {parsedContacts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Preview dos Contatos</h4>
                <div className="flex gap-2">
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    {validContacts.length} válidos
                  </Badge>
                  {invalidContacts.length > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {invalidContacts.length} inválidos
                    </Badge>
                  )}
                </div>
              </div>

              <ScrollArea className="h-48 border rounded-md">
                <div className="p-2 space-y-1">
                  {parsedContacts.slice(0, 50).map((contact, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        contact.valid ? 'bg-muted/30' : 'bg-destructive/10'
                      }`}
                    >
                      {contact.valid ? (
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{contact.email || '(vazio)'}</span>
                        {contact.companyName && (
                          <span className="text-muted-foreground truncate flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {contact.companyName}
                          </span>
                        )}
                        {contact.name && (
                          <span className="text-muted-foreground truncate flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {contact.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {parsedContacts.length > 50 && (
                    <p className="text-center text-sm text-muted-foreground py-2">
                      ...e mais {parsedContacts.length - 50} contatos
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={validContacts.length === 0 || importMutation.isPending}
          >
            {importMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Importar {validContacts.length} Contatos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
