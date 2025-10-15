// Intelligent attachment preview with content analysis
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileSpreadsheet, Image as ImageIcon, Eye, X, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AttachmentPreviewProps {
  file: File;
  onClose: () => void;
  onAnalyze?: (suggestions: string[]) => void;
}

interface AnalysisResult {
  type: 'csv' | 'excel' | 'pdf' | 'image' | 'unknown';
  preview?: string;
  rows?: number;
  columns?: string[];
  imageUrl?: string;
  suggestions: string[];
  confidence: number;
}

export function AttachmentPreview({ file, onClose, onAnalyze }: AttachmentPreviewProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    analyzeFile();
  }, [file]);

  const analyzeFile = async () => {
    setIsAnalyzing(true);
    
    try {
      const fileType = getFileType(file);
      let result: AnalysisResult = {
        type: fileType,
        suggestions: [],
        confidence: 0
      };

      switch (fileType) {
        case 'csv':
          result = await analyzeCSV(file);
          break;
        case 'excel':
          result = await analyzeExcel(file);
          break;
        case 'image':
          result = await analyzeImage(file);
          break;
        case 'pdf':
          result = await analyzePDF(file);
          break;
        default:
          result.suggestions = ['Análise automática disponível após envio'];
      }

      setAnalysis(result);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysis({
        type: 'unknown',
        suggestions: ['Erro ao analisar. Envie para análise completa pela IA.'],
        confidence: 0
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFileType = (file: File): AnalysisResult['type'] => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') return 'csv';
    if (ext === 'xlsx' || ext === 'xls') return 'excel';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return 'image';
    return 'unknown';
  };

  const analyzeCSV = async (file: File): Promise<AnalysisResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0]?.split(/[,;]/);
        
        const suggestions = generateCSVSuggestions(headers, lines.length);
        
        resolve({
          type: 'csv',
          preview: lines.slice(0, 5).join('\n'),
          rows: lines.length - 1,
          columns: headers,
          suggestions,
          confidence: 0.85
        });
      };
      reader.readAsText(file);
    });
  };

  const analyzeExcel = async (file: File): Promise<AnalysisResult> => {
    // Simplified analysis for Excel - real parsing would need xlsx library
    const suggestions = [
      'Importar dados para o sistema',
      'Extrair métricas ESG do arquivo',
      'Validar formato de dados',
      'Comparar com metas existentes'
    ];

    return {
      type: 'excel',
      suggestions,
      confidence: 0.7
    };
  };

  const analyzeImage = async (file: File): Promise<AnalysisResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        const suggestions = [
          'Extrair texto da imagem (OCR)',
          'Identificar medidores e valores',
          'Analisar documentos fotografados',
          'Detectar certificações ou selos'
        ];

        resolve({
          type: 'image',
          imageUrl,
          suggestions,
          confidence: 0.75
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const analyzePDF = async (file: File): Promise<AnalysisResult> => {
    const suggestions = [
      'Extrair texto e dados estruturados',
      'Identificar licenças e certificações',
      'Buscar métricas e indicadores',
      'Cadastrar informações no sistema'
    ];

    return {
      type: 'pdf',
      suggestions,
      confidence: 0.8
    };
  };

  const generateCSVSuggestions = (headers: string[], rowCount: number): string[] => {
    const suggestions: string[] = [];
    const headerStr = headers.join(' ').toLowerCase();

    // Smart suggestions based on content
    if (headerStr.includes('emiss') || headerStr.includes('ghg') || headerStr.includes('co2')) {
      suggestions.push('Importar dados de emissões GEE');
      suggestions.push('Calcular pegada de carbono');
    }
    
    if (headerStr.includes('resid') || headerStr.includes('lixo') || headerStr.includes('waste')) {
      suggestions.push('Registrar gestão de resíduos');
      suggestions.push('Analisar taxa de reciclagem');
    }

    if (headerStr.includes('agua') || headerStr.includes('water') || headerStr.includes('consumo')) {
      suggestions.push('Monitorar consumo de água');
      suggestions.push('Identificar oportunidades de economia');
    }

    if (headerStr.includes('energia') || headerStr.includes('energy') || headerStr.includes('kwh')) {
      suggestions.push('Registrar consumo energético');
      suggestions.push('Avaliar eficiência energética');
    }

    if (headerStr.includes('colaborador') || headerStr.includes('funcionario') || headerStr.includes('employee')) {
      suggestions.push('Atualizar cadastro de colaboradores');
      suggestions.push('Analisar diversidade da equipe');
    }

    // Generic fallback
    if (suggestions.length === 0) {
      suggestions.push(`Importar ${rowCount} registro(s) para o sistema`);
      suggestions.push('Analisar dados e gerar insights');
    }

    suggestions.push('Validar integridade dos dados');
    
    return suggestions;
  };

  const getFileIcon = () => {
    switch (analysis?.type) {
      case 'csv':
      case 'excel':
        return FileSpreadsheet;
      case 'pdf':
        return FileText;
      case 'image':
        return ImageIcon;
      default:
        return FileText;
    }
  };

  const Icon = getFileIcon();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl"
        >
          <Card className="overflow-hidden shadow-2xl border-2">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{file.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB • Preview Inteligente
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="max-h-[60vh] p-6">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-8 w-8 text-primary" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">Analisando conteúdo...</p>
                </div>
              ) : analysis ? (
                <div className="space-y-6">
                  {/* Image Preview */}
                  {analysis.imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg overflow-hidden border"
                    >
                      <img 
                        src={analysis.imageUrl} 
                        alt="Preview" 
                        className="w-full h-auto max-h-64 object-contain bg-muted"
                      />
                    </motion.div>
                  )}

                  {/* CSV/Excel Preview */}
                  {analysis.preview && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold">Preview dos Dados</h4>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <pre className="text-xs font-mono overflow-x-auto">
                          {analysis.preview}
                        </pre>
                      </div>
                      {analysis.rows && analysis.columns && (
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary">{analysis.rows} linhas</Badge>
                          <Badge variant="secondary">{analysis.columns.length} colunas</Badge>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* AI Suggestions */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Sugestões Inteligentes</h4>
                      {analysis.confidence > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(analysis.confidence * 100)}% confiança
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      {analysis.suggestions.map((suggestion, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + idx * 0.05 }}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                            "hover:bg-primary/5 hover:border-primary/30"
                          )}
                          onClick={() => onAnalyze?.([suggestion])}
                        >
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">{idx + 1}</span>
                          </div>
                          <p className="text-sm flex-1">{suggestion}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Info */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg"
                  >
                    <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Envie o arquivo para análise completa pela IA. As sugestões acima são baseadas em análise preliminar.
                    </p>
                  </motion.div>
                </div>
              ) : null}
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-muted/30">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  if (analysis?.suggestions) {
                    onAnalyze?.(analysis.suggestions);
                  }
                  onClose();
                }}
                className="bg-gradient-to-r from-primary to-primary/90"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Enviar para Análise
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
