import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIndicatorGroups } from "@/services/indicatorManagement";
import * as XLSX from "xlsx";

interface ImportExcelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedRow {
  code?: string;
  name?: string;
  target?: number;
  unit?: string;
  values: Record<string, number>;
  valid: boolean;
  errors: string[];
}

const EXPECTED_COLUMNS = {
  code: ["código", "codigo", "code", "cod"],
  name: ["nome", "indicador", "name", "descrição", "descricao"],
  target: ["meta", "target", "objetivo"],
  unit: ["unidade", "unit", "un"],
  months: {
    1: ["jan", "janeiro", "01"],
    2: ["fev", "fevereiro", "02"],
    3: ["mar", "março", "marco", "03"],
    4: ["abr", "abril", "04"],
    5: ["mai", "maio", "05"],
    6: ["jun", "junho", "06"],
    7: ["jul", "julho", "07"],
    8: ["ago", "agosto", "08"],
    9: ["set", "setembro", "09"],
    10: ["out", "outubro", "10"],
    11: ["nov", "novembro", "11"],
    12: ["dez", "dezembro", "12"],
  },
};

export function ImportExcelModal({ open, onOpenChange }: ImportExcelModalProps) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; errors: number; details: string[] }>({ success: 0, errors: 0, details: [] });
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: groups } = useIndicatorGroups();

  const findColumn = (headers: string[], options: string[]) => {
    const normalizedHeaders = headers.map(h => h?.toLowerCase().trim());
    for (const opt of options) {
      const idx = normalizedHeaders.indexOf(opt.toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const parseExcel = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (data.length < 2) {
      throw new Error("Arquivo vazio ou sem dados");
    }

    const headers = data[0] as string[];
    const codeIdx = findColumn(headers, EXPECTED_COLUMNS.code);
    const nameIdx = findColumn(headers, EXPECTED_COLUMNS.name);
    const targetIdx = findColumn(headers, EXPECTED_COLUMNS.target);
    const unitIdx = findColumn(headers, EXPECTED_COLUMNS.unit);
    
    const monthIndexes: Record<number, number> = {};
    for (const [month, options] of Object.entries(EXPECTED_COLUMNS.months)) {
      monthIndexes[Number(month)] = findColumn(headers, options);
    }

    const parsed: ParsedRow[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const errors: string[] = [];
      
      const name = nameIdx >= 0 ? String(row[nameIdx] || "") : "";
      if (!name) {
        errors.push("Nome obrigatório");
      }

      const values: Record<string, number> = {};
      for (const [month, idx] of Object.entries(monthIndexes)) {
        if (idx >= 0 && row[idx] !== undefined && row[idx] !== "") {
          const val = parseFloat(row[idx]);
          if (!isNaN(val)) {
            values[month] = val;
          }
        }
      }

      parsed.push({
        code: codeIdx >= 0 ? String(row[codeIdx] || "") : undefined,
        name,
        target: targetIdx >= 0 ? parseFloat(row[targetIdx]) : undefined,
        unit: unitIdx >= 0 ? String(row[unitIdx] || "") : undefined,
        values,
        valid: errors.length === 0,
        errors,
      });
    }

    return parsed.filter(p => p.name || Object.keys(p.values).length > 0);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);
    try {
      const data = await parseExcel(file);
      setParsedData(data);
      setStep("preview");
    } catch (error: any) {
      toast({
        title: "Erro ao ler arquivo",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    setStep("importing");
    let success = 0;
    let errors = 0;
    const details: string[] = [];
    const currentYear = new Date().getFullYear();

    // Get user and company
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      toast({ title: "Erro", description: "Empresa não encontrada", variant: "destructive" });
      return;
    }

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      if (!row.valid) {
        errors++;
        details.push(`Linha ${i + 2}: Dados inválidos - ${row.errors.join(', ')}`);
        continue;
      }

      try {
        // Create indicator
        const { data: indicator, error: indicatorError } = await supabase
          .from('quality_indicators')
          .insert({
            company_id: profile.company_id,
            name: row.name!,
            code: row.code,
            measurement_unit: row.unit || '%',
            category: 'Importado',
            measurement_type: 'manual',
            frequency: 'monthly',
            direction: 'higher_better',
            is_active: true,
            created_by_user_id: user.id,
            status: 'active',
            group_id: selectedGroupId || null
          })
          .select()
          .single();

        if (indicatorError) throw indicatorError;

        // Create target if provided
        if (row.target) {
          await supabase
            .from('indicator_targets')
            .insert({
              indicator_id: indicator.id,
              target_year: currentYear,
              target_value: row.target
            } as any);
        }

        // Create period data for each month value
        const monthValues = Object.entries(row.values);
        if (monthValues.length > 0) {
          const periodDataInserts = monthValues.map(([month, value]) => ({
            indicator_id: indicator.id,
            company_id: profile.company_id,
            period_year: currentYear,
            period_month: parseInt(month),
            measured_value: value,
            status: row.target 
              ? (value >= row.target ? 'on_target' : value >= row.target * 0.9 ? 'warning' : 'critical')
              : 'pending',
            collected_by_user_id: user.id,
            collected_at: new Date().toISOString()
          }));

          await supabase
            .from('indicator_period_data')
            .insert(periodDataInserts);
        }

        success++;
        details.push(`${row.name}: Importado com sucesso`);
      } catch (err: any) {
        errors++;
        details.push(`${row.name}: Erro - ${err.message}`);
      }

      setImportProgress(Math.round(((i + 1) / parsedData.length) * 100));
    }

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['indicators-with-data'] });
    queryClient.invalidateQueries({ queryKey: ['indicator-stats'] });

    setImportResults({ success, errors, details });
    setStep("done");
  };

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setParsedData([]);
    setImportProgress(0);
    setSelectedGroupId("");
    setImportResults({ success: 0, errors: 0, details: [] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Importar Indicadores do Excel</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">
              {isDragActive ? "Solte o arquivo aqui" : "Arraste um arquivo Excel ou clique para selecionar"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Formatos aceitos: .xlsx, .xls, .csv
            </p>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {parsedData.length} indicadores encontrados
                </p>
              </div>
            </div>

            {/* Group Selection */}
            <div className="space-y-2">
              <Label>Grupo de Destino (opcional)</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem grupo</SelectItem>
                  {groups?.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[350px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead>Valores</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {row.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </TableCell>
                      <TableCell>{row.code || "-"}</TableCell>
                      <TableCell>{row.name || "-"}</TableCell>
                      <TableCell>{row.target || "-"}</TableCell>
                      <TableCell>
                        {Object.keys(row.values).length} meses
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-center font-medium">Importando indicadores...</p>
            <Progress value={importProgress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">{importProgress}%</p>
          </div>
        )}

        {step === "done" && (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
              <p className="text-xl font-medium mt-4">Importação Concluída</p>
            </div>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{importResults.success}</p>
                <p className="text-sm text-muted-foreground">Importados</p>
              </div>
              {importResults.errors > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-destructive">{importResults.errors}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              )}
            </div>
            
            {importResults.details.length > 0 && (
              <ScrollArea className="h-[200px] border rounded-lg p-3">
                <div className="space-y-1 text-sm">
                  {importResults.details.map((detail, index) => (
                    <p key={index} className={detail.includes('Erro') ? 'text-destructive' : 'text-muted-foreground'}>
                      {detail}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Voltar
              </Button>
              <Button onClick={handleImport}>
                Importar {parsedData.filter(r => r.valid).length} indicadores
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
