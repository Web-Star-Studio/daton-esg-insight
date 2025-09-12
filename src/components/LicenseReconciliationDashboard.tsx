import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, AlertCircle, Edit3, Check, X, Eye, EyeOff, Sparkles, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ExtractedLicenseFormData } from "@/services/licenses"
import { UseFormReturn } from "react-hook-form"

interface FieldReconciliation {
  field: string
  extractedValue: any
  currentValue: any
  confidence: number
  isApplied: boolean
  isEditing: boolean
  validation?: string
}

interface LicenseReconciliationDashboardProps {
  analysisData: ExtractedLicenseFormData | null
  overallConfidence: number | null
  form: UseFormReturn<any>
  onFieldApply: (field: string, value: any) => void
  onBulkApply: () => void
}

export const LicenseReconciliationDashboard = ({
  analysisData,
  overallConfidence,
  form,
  onFieldApply,
  onBulkApply
}: LicenseReconciliationDashboardProps) => {
  const [reconciliationData, setReconciliationData] = useState<FieldReconciliation[]>([])
  const [showPreview, setShowPreview] = useState(true)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!analysisData) return

    const fieldMappings = [
      { field: 'nome', label: 'Nome da Licença', extractedValue: analysisData.nome },
      { field: 'tipo', label: 'Tipo', extractedValue: analysisData.tipo },
      { field: 'orgaoEmissor', label: 'Órgão Emissor', extractedValue: analysisData.orgaoEmissor },
      { field: 'numeroProcesso', label: 'Número do Processo', extractedValue: analysisData.numeroProcesso },
      { field: 'status', label: 'Status', extractedValue: analysisData.status },
      { field: 'dataEmissao', label: 'Data de Emissão', extractedValue: analysisData.dataEmissao },
      { field: 'dataVencimento', label: 'Data de Vencimento', extractedValue: analysisData.dataVencimento },
      { field: 'condicionantes', label: 'Condicionantes', extractedValue: analysisData.condicionantes },
    ]

    const formValues = form.getValues()
    
    const reconciliation = fieldMappings.map(mapping => ({
      field: mapping.field,
      label: mapping.label,
      extractedValue: mapping.extractedValue,
      currentValue: formValues[mapping.field],
      confidence: analysisData.confidence_scores[mapping.field] || 0,
      isApplied: false,
      isEditing: false,
      validation: validateField(mapping.field, mapping.extractedValue)
    }))

    setReconciliationData(reconciliation)
  }, [analysisData, form])

  const validateField = (field: string, value: any): string | undefined => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'Campo obrigatório não preenchido'
    }

    if (field === 'dataEmissao' || field === 'dataVencimento') {
      const date = new Date(value)
      if (isNaN(date.getTime()) || date.getFullYear() < 1900) {
        return 'Data inválida'
      }
    }

    if (field === 'tipo') {
      const validTypes = ['LP', 'LI', 'LO', 'LAS', 'LOC', 'Outra']
      if (!validTypes.includes(value)) {
        return 'Tipo de licença não reconhecido'
      }
    }

    return undefined
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200'
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle2
    if (confidence >= 0.5) return AlertTriangle
    return AlertCircle
  }

  const handleFieldUpdate = (index: number, newValue: any) => {
    const updated = [...reconciliationData]
    updated[index].extractedValue = newValue
    updated[index].validation = validateField(updated[index].field, newValue)
    setReconciliationData(updated)
  }

  const toggleEdit = (index: number) => {
    const updated = [...reconciliationData]
    updated[index].isEditing = !updated[index].isEditing
    setReconciliationData(updated)
  }

  const applyField = (index: number) => {
    const field = reconciliationData[index]
    if (field.validation) {
      setValidationErrors(prev => ({ ...prev, [field.field]: field.validation! }))
      return
    }

    onFieldApply(field.field, field.extractedValue)
    
    const updated = [...reconciliationData]
    updated[index].isApplied = true
    updated[index].currentValue = field.extractedValue
    setReconciliationData(updated)
    
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field.field]
      return newErrors
    })
  }

  const getAutoApplyFields = () => {
    return reconciliationData.filter(field => 
      field.confidence >= 0.8 && 
      !field.validation && 
      field.extractedValue && 
      !field.isApplied
    )
  }

  const handleAutoApply = () => {
    const autoApplyFields = getAutoApplyFields()
    autoApplyFields.forEach(field => {
      const index = reconciliationData.findIndex(r => r.field === field.field)
      if (index !== -1) {
        applyField(index)
      }
    })
    
    if (autoApplyFields.length === 0) {
      onBulkApply()
    }
  }

  if (!analysisData) return null

  const autoApplyCount = getAutoApplyFields().length
  const highConfidenceCount = reconciliationData.filter(f => f.confidence >= 0.8).length
  const validFieldsCount = reconciliationData.filter(f => !f.validation).length

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Revisão e Reconciliação Inteligente
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Ocultar' : 'Mostrar'} Prévia
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="text-primary">
            Confiança Geral: {Math.round((overallConfidence || 0) * 100)}%
          </Badge>
          <Badge variant="outline" className="text-green-600">
            Alta Confiança: {highConfidenceCount}/{reconciliationData.length}
          </Badge>
          <Badge variant="outline" className="text-blue-600">
            Campos Válidos: {validFieldsCount}/{reconciliationData.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Auto-apply section */}
        {autoApplyCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">
                  {autoApplyCount} campos prontos para aplicação automática
                </span>
              </div>
              <Button
                type="button"
                onClick={handleAutoApply}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Aplicar Automaticamente
              </Button>
            </div>
          </div>
        )}

        {/* Fields reconciliation */}
        <div className="space-y-3">
          {reconciliationData.map((field, index) => {
            const ConfidenceIcon = getConfidenceIcon(field.confidence)
            const hasError = validationErrors[field.field] || field.validation
            
            return (
              <div
                key={field.field}
                className={cn(
                  "border rounded-lg p-4 transition-all",
                  field.isApplied ? "bg-green-50 border-green-200" : "bg-background",
                  hasError && "border-red-200 bg-red-50"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <ConfidenceIcon className={cn("h-4 w-4", getConfidenceColor(field.confidence).split(' ')[0])} />
                    <Label className="font-medium">{field.label}</Label>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getConfidenceColor(field.confidence))}
                    >
                      {Math.round(field.confidence * 100)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {field.isApplied ? (
                      <Badge variant="outline" className="text-green-600 bg-green-50">
                        <Check className="h-3 w-3 mr-1" />
                        Aplicado
                      </Badge>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEdit(index)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => applyField(index)}
                          disabled={!!hasError || !field.extractedValue}
                          className="bg-primary/90 hover:bg-primary"
                        >
                          Aplicar
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {hasError && (
                  <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {hasError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Extracted Value */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Valor Extraído</Label>
                    {field.isEditing ? (
                      field.field === 'condicionantes' ? (
                        <Textarea
                          value={field.extractedValue || ''}
                          onChange={(e) => handleFieldUpdate(index, e.target.value)}
                          rows={3}
                          className="mt-1"
                        />
                      ) : field.field === 'tipo' ? (
                        <Select 
                          value={field.extractedValue || ''}
                          onValueChange={(value) => handleFieldUpdate(index, value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LP">Licença Prévia (LP)</SelectItem>
                            <SelectItem value="LI">Licença de Instalação (LI)</SelectItem>
                            <SelectItem value="LO">Licença de Operação (LO)</SelectItem>
                            <SelectItem value="LAS">Licença Ambiental Simplificada (LAS)</SelectItem>
                            <SelectItem value="LOC">Licença de Operação Corretiva (LOC)</SelectItem>
                            <SelectItem value="Outra">Outra</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={field.extractedValue || ''}
                          onChange={(e) => handleFieldUpdate(index, e.target.value)}
                          className="mt-1"
                        />
                      )
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded border min-h-[38px] flex items-center">
                        {field.extractedValue || <span className="text-muted-foreground italic">Não extraído</span>}
                      </div>
                    )}
                  </div>

                  {/* Current Value */}
                  {showPreview && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Valor Atual no Formulário</Label>
                      <div className="mt-1 p-2 bg-muted/50 rounded border min-h-[38px] flex items-center">
                        {field.currentValue || <span className="text-muted-foreground italic">Vazio</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bulk actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {reconciliationData.filter(f => f.isApplied).length} de {reconciliationData.length} campos aplicados
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReconciliationData(prev => prev.map(field => ({ ...field, isApplied: false })))
                setValidationErrors({})
              }}
            >
              Limpar Aplicações
            </Button>
            <Button
              type="button"
              onClick={onBulkApply}
              className="bg-primary/90 hover:bg-primary"
            >
              Aplicar Todos os Campos Válidos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}