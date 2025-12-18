import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
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
  const [importResults, setImportResults] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });
  const { toast } = useToast();

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

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      if (!row.valid) {
        errors++;
        continue;
      }

      try {
        // Here you would call your API to create the indicator
        // await createIndicator(row);
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
        success++;
      } catch {
        errors++;
      }

      setImportProgress(Math.round(((i + 1) / parsedData.length) * 100));
    }

    setImportResults({ success, errors });
    setStep("done");
  };

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setParsedData([]);
    setImportProgress(0);
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

            <ScrollArea className="h-[400px] border rounded-lg">
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
          <div className="py-8 space-y-4 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <p className="text-xl font-medium">Importação Concluída</p>
            <div className="flex justify-center gap-8">
              <div>
                <p className="text-3xl font-bold text-green-600">{importResults.success}</p>
                <p className="text-sm text-muted-foreground">Importados</p>
              </div>
              {importResults.errors > 0 && (
                <div>
                  <p className="text-3xl font-bold text-destructive">{importResults.errors}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              )}
            </div>
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
