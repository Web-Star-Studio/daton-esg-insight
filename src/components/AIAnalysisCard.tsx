import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, AlertCircle, Sparkles, FileText, Eye, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { ExtractedLicenseFormData } from "@/services/licenses"

interface AIAnalysisCardProps {
  uploadedFile: File | null
  isAnalyzing: boolean
  analysisProgress: number
  analysisData: ExtractedLicenseFormData | null
  overallConfidence: number | null
  analysisError: string | null
  onAnalyze: () => void
  onApplyData: () => void
  onRemoveFile: () => void
}

export const AIAnalysisCard = ({
  uploadedFile,
  isAnalyzing,
  analysisProgress,
  analysisData,
  overallConfidence,
  analysisError,
  onAnalyze,
  onApplyData,
  onRemoveFile
}: AIAnalysisCardProps) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle2
    return AlertCircle
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (['pdf'].includes(extension || '')) return FileText
    if (['xlsx', 'xls', 'csv'].includes(extension || '')) return FileText
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) return Eye
    return Upload
  }

  if (!uploadedFile) return null

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Análise Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Info */}
        <div className="flex items-center justify-between bg-background/50 p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = getFileIcon(uploadedFile.name)
              return <Icon className="h-4 w-4 text-muted-foreground" />
            })()}
            <div className="flex flex-col">
              <span className="text-sm font-medium">{uploadedFile.name}</span>
              <span className="text-xs text-muted-foreground">
                {(uploadedFile.size / 1024 / 1024).toFixed(1)}MB
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemoveFile}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>

        {/* Analysis Button and Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              size="sm"
              className="flex items-center gap-2"
            >
              <Sparkles className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
              {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
            </Button>
            
            {overallConfidence !== null && (
              <Badge variant="outline" className={getConfidenceColor(overallConfidence)}>
                Confiança: {Math.round(overallConfidence * 100)}%
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={analysisProgress} className="w-full h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {analysisProgress < 30 ? 'Processando documento...' :
                 analysisProgress < 70 ? 'Extraindo informações...' :
                 analysisProgress < 90 ? 'Analisando dados...' : 'Finalizando...'}
              </p>
            </div>
          )}

          {/* Analysis Error */}
          {analysisError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <h4 className="text-sm font-medium text-red-800">Falha na Análise</h4>
              </div>
              <p className="text-sm text-red-700">{analysisError}</p>
              <div className="bg-red-100 p-3 rounded-lg">
                <p className="text-xs text-red-800 font-medium mb-2">💡 Dicas para melhorar o resultado:</p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• Verifique se o documento é um PDF de qualidade</li>
                  <li>• Certifique-se que é uma licença ambiental válida</li>
                  <li>• Evite documentos escaneados ou com baixa resolução</li>
                  <li>• Se necessário, preencha os campos manualmente</li>
                </ul>
              </div>
              <Button
                type="button"
                onClick={onAnalyze}
                size="sm"
                variant="outline"
                className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
              >
                <Sparkles className="h-4 w-4" />
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* Analysis Results */}
          {analysisData && !analysisError && (
            <div className="bg-background/70 p-4 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <h4 className="text-sm font-medium">Dados Extraídos</h4>
                </div>
                <Button
                  type="button"
                  onClick={onApplyData}
                  size="sm"
                  className="bg-primary/90 hover:bg-primary"
                >
                  Aplicar aos Campos
                </Button>
              </div>
              
              {/* Confidence Scores Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(analysisData.confidence_scores).map(([field, confidence]) => {
                  const Icon = getConfidenceIcon(confidence)
                  return (
                    <div key={field} className="flex items-center gap-1 p-2 bg-background/50 rounded">
                      <Icon className={`h-3 w-3 ${getConfidenceColor(confidence)}`} />
                      <span className="capitalize font-medium">{field}:</span>
                      <span className={getConfidenceColor(confidence)}>
                        {Math.round(confidence * 100)}%
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Preview of extracted data */}
              <div className="text-xs space-y-1 pt-2 border-t">
                <p className="font-medium text-muted-foreground">Prévia dos dados:</p>
                {analysisData.nome && (
                  <p><span className="font-medium">Nome:</span> {analysisData.nome}</p>
                )}
                {analysisData.tipo && (
                  <p><span className="font-medium">Tipo:</span> {analysisData.tipo}</p>
                )}
                {analysisData.orgaoEmissor && (
                  <p><span className="font-medium">Órgão:</span> {analysisData.orgaoEmissor}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}