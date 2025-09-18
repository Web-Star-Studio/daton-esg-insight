import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Upload, Eye, Check, X, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface MTROCRModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataExtracted?: (data: any) => void
}

interface ExtractedData {
  mtr_number?: string
  collection_date?: string
  waste_description?: string
  waste_class?: string
  quantity?: number
  unit?: string
  transporter_name?: string
  transporter_cnpj?: string
  destination_name?: string
  destination_cnpj?: string
  final_treatment_type?: string
  confidence_score?: number
}

export const MTROCRModal = ({ open, onOpenChange, onDataExtracted }: MTROCRModalProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { toast } = useToast()

  // File upload dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file) {
        setUploadedFile(file)
        setExtractedData(null)
        
        // Create preview URL for images
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file)
          setPreviewUrl(url)
        } else {
          setPreviewUrl(null)
        }
      }
    }
  })

  // OCR Processing mutation
  const ocrMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', 'mtr')

      const { data, error } = await supabase.functions.invoke('mtr-ocr-processor', {
        body: formData
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      setExtractedData(data.extracted_data)
      toast({
        title: "OCR Concluído!",
        description: `Dados extraídos com ${Math.round(data.extracted_data.confidence_score || 0)}% de confiança.`,
      })
    },
    onError: (error) => {
      toast({
        title: "Erro no OCR",
        description: error.message || "Erro ao processar o documento.",
        variant: "destructive",
      })
    }
  })

  const handleProcessOCR = () => {
    if (!uploadedFile) return
    ocrMutation.mutate(uploadedFile)
  }

  const handleAcceptData = () => {
    if (extractedData && onDataExtracted) {
      onDataExtracted(extractedData)
      onOpenChange(false)
      // Reset state
      setUploadedFile(null)
      setExtractedData(null)
      setPreviewUrl(null)
    }
  }

  const handleReject = () => {
    setExtractedData(null)
    toast({
      title: "Dados Rejeitados",
      description: "Você pode fazer upload de um novo documento ou preencher manualmente.",
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Extração de Dados MTR - OCR
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          {!uploadedFile && (
            <Card>
              <CardHeader>
                <CardTitle>Upload do Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    {isDragActive ? "Solte o arquivo aqui" : "Faça upload do MTR"}
                  </p>
                  <p className="text-muted-foreground">
                    Suporte para PDF, PNG, JPG (máx. 10MB)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Preview & Processing */}
          {uploadedFile && !extractedData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Documento Carregado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{uploadedFile.name}</span>
                      <Badge variant="outline">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    
                    {previewUrl && (
                      <div className="border rounded-lg p-4">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-w-full h-auto max-h-64 mx-auto"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleProcessOCR}
                        disabled={ocrMutation.isPending}
                        className="flex-1"
                      >
                        {ocrMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Extrair Dados
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setUploadedFile(null)
                          setPreviewUrl(null)
                        }}
                      >
                        Trocar Arquivo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Como Funciona</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <p className="text-sm">Upload do documento MTR (PDF ou imagem)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <p className="text-sm">Processamento via IA para extração dos dados</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                    <p className="text-sm">Revisão e aprovação dos dados extraídos</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                    <p className="text-sm">Preenchimento automático do formulário</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Extracted Data Review */}
          {extractedData && (
            <div className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Dados extraídos com sucesso!</span>
                    <Badge className={getConfidenceColor(extractedData.confidence_score || 0)}>
                      {Math.round(extractedData.confidence_score || 0)}% confiança
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Dados Extraídos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(extractedData).map(([key, value]) => {
                      if (key === 'confidence_score') return null
                      
                      const labels: Record<string, string> = {
                        mtr_number: 'Nº MTR',
                        collection_date: 'Data Coleta',
                        waste_description: 'Descrição do Resíduo',
                        waste_class: 'Classe',
                        quantity: 'Quantidade',
                        unit: 'Unidade',
                        transporter_name: 'Transportador',
                        transporter_cnpj: 'CNPJ Transportador',
                        destination_name: 'Destinador',
                        destination_cnpj: 'CNPJ Destinador',
                        final_treatment_type: 'Tipo de Destinação'
                      }
                      
                      return (
                        <div key={key} className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">
                            {labels[key] || key}
                          </label>
                          <div className="p-2 bg-muted rounded border">
                            {value?.toString() || 'Não identificado'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleReject}>
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button onClick={handleAcceptData}>
                  <Check className="h-4 w-4 mr-2" />
                  Aceitar e Preencher
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}