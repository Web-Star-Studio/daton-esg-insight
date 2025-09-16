import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Database, 
  Upload, 
  FileSpreadsheet, 
  Truck, 
  Factory, 
  Leaf, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImportFactorsModal } from "@/components/ImportFactorsModal";

interface UnifiedFactorImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

interface ImportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'complete' | 'category' | 'custom';
  action: () => Promise<void>;
}

export function UnifiedFactorImportModal({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: UnifiedFactorImportModalProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState("");
  const [results, setResults] = useState<Record<string, { success: number; errors: number }>>({});
  const [showCustomImport, setShowCustomImport] = useState(false);
  const { toast } = useToast();

  const executeImport = async (operation: string, importFn: () => Promise<any>) => {
    setIsImporting(true);
    setCurrentOperation(operation);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 20, 90));
      }, 500);

      const result = await importFn();
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setResults(prev => ({
        ...prev,
        [operation]: result
      }));

      toast({
        title: "Importação Concluída",
        description: `${operation}: ${result.success} itens processados`,
      });

    } catch (error) {
      console.error(`Erro na importação ${operation}:`, error);
      toast({
        title: "Erro na Importação",
        description: `Falha ao executar: ${operation}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setProgress(0);
      setCurrentOperation("");
    }
  };

  const completeBaseUpdate = async () => {
    await executeImport("Base Completa GHG Protocol Brasil 2025.0.1", async () => {
      // Import all categories in sequence
      const operations = [
        () => import("@/services/unifiedFactorImport").then(m => m.UnifiedFactorImportService.importCompleteDatabase())
      ];

      let totalSuccess = 0;
      let totalErrors = 0;

      for (const operation of operations) {
        try {
          const result = await operation();
          totalSuccess += result.success;
          totalErrors += result.errors;
        } catch (error) {
          totalErrors++;
        }
      }

      return { success: totalSuccess, errors: totalErrors };
    });

    if (onImportComplete) {
      onImportComplete();
    }
  };

  const importOptions: ImportOption[] = [
    {
      id: 'complete',
      title: 'Base Completa GHG Protocol Brasil 2025.0.1',
      description: 'Importa todos os fatores oficiais atualizados (recomendado)',
      icon: Database,
      category: 'complete',
      action: completeBaseUpdate
    },
    {
      id: 'mobile',
      title: 'Combustão Móvel',
      description: 'Fatores para veículos, aviação, navegação',
      icon: Truck,
      category: 'category',
      action: () => executeImport("Combustão Móvel", () => 
        import("@/services/unifiedFactorImport").then(m => m.UnifiedFactorImportService.importMobileCombustionFactors())
      )
    },
    {
      id: 'stationary',
      title: 'Combustão Estacionária',
      description: 'Fatores para combustíveis estacionários',
      icon: Factory,
      category: 'category',
      action: () => executeImport("Combustão Estacionária", () => 
        import("@/services/unifiedFactorImport").then(m => m.UnifiedFactorImportService.importStationaryCombustionFactors())
      )
    },
    {
      id: 'industrial',
      title: 'Processos Industriais',
      description: 'Fatores para processos industriais específicos',
      icon: Factory,
      category: 'category',
      action: () => executeImport("Processos Industriais", () => 
        import("@/services/unifiedFactorImport").then(m => m.UnifiedFactorImportService.importIndustrialProcessFactors())
      )
    },
    {
      id: 'agriculture',
      title: 'Agricultura e AFOLU',
      description: 'Fatores para atividades agrícolas e florestais',
      icon: Leaf,
      category: 'category',
      action: () => executeImport("Agricultura", () => 
        import("@/services/unifiedFactorImport").then(m => m.UnifiedFactorImportService.importAgricultureFactors())
      )
    },
    {
      id: 'electricity',
      title: 'Energia Elétrica',
      description: 'Fatores de eletricidade do SIN brasileiro',
      icon: Zap,
      category: 'category',
      action: () => executeImport("Energia Elétrica", () => 
        import("@/services/unifiedFactorImport").then(m => m.UnifiedFactorImportService.importElectricityFactors())
      )
    }
  ];

  return (
    <>
      <Dialog open={open && !showCustomImport} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Central de Importação de Fatores
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Atualização Completa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Importa toda a base oficial do GHG Protocol Brasil 2025.0.1
                  </p>
                  <Button 
                    onClick={completeBaseUpdate} 
                    disabled={isImporting}
                    className="w-full"
                  >
                    {isImporting && currentOperation.includes("Base Completa") ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="mr-2 h-4 w-4" />
                    )}
                    Atualizar Base Completa
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Importação Customizada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Importe seus próprios fatores via CSV/Excel
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCustomImport(true)}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Arquivo
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Baixe o template para importação customizada
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const csvContent = `nome,categoria,unidade,co2_factor,ch4_factor,n2o_factor,fonte,ano_validade
Diesel S10,Combustão Móvel,Litro,2.671,0.0001,0.000045,Personalizado,2025`;
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'template_fatores.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Baixar Template
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Progress Indicator */}
            {isImporting && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="font-medium">Importando: {currentOperation}</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Category-Specific Imports */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Importações por Categoria</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {importOptions.filter(opt => opt.category === 'category').map((option) => (
                  <Card key={option.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <option.icon className="h-5 w-5 text-primary" />
                          <h4 className="font-medium">{option.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={option.action}
                            disabled={isImporting}
                          >
                            {isImporting && currentOperation === option.title ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <option.icon className="mr-2 h-3 w-3" />
                            )}
                            Importar
                          </Button>
                          {results[option.title] && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              {results[option.title].success} importados
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Results Summary */}
            {Object.keys(results).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumo das Importações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(results).map(([operation, result]) => (
                      <div key={operation} className="flex justify-between items-center">
                        <span className="text-sm">{operation}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {result.success} sucessos
                          </Badge>
                          {result.errors > 0 && (
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              {result.errors} erros
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              {Object.keys(results).length > 0 && (
                <Button onClick={() => {
                  if (onImportComplete) onImportComplete();
                  onOpenChange(false);
                }}>
                  Concluir
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Import Modal */}
      <ImportFactorsModal
        open={showCustomImport}
        onOpenChange={setShowCustomImport}
        onImportComplete={() => {
          setShowCustomImport(false);
          if (onImportComplete) onImportComplete();
        }}
      />
    </>
  );
}