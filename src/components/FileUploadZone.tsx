import { useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FileUploadZoneProps {
  onFileUpload: (file: File) => void
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  uploadedFile: File | null
  children?: React.ReactNode
}

export const FileUploadZone = ({
  onFileUpload,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  uploadedFile,
  children
}: FileUploadZoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <Label>Anexar Documento da Licença</Label>
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
          isDragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border",
          uploadedFile ? "bg-muted/30" : "",
          "hover:border-primary/50 hover:bg-primary/5"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {!uploadedFile ? (
          <div className="space-y-3">
            <Upload className={cn(
              "h-10 w-10 mx-auto transition-all duration-200",
              isDragOver ? "text-primary scale-110" : "text-muted-foreground"
            )} />
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {isDragOver ? "Solte o arquivo aqui" : "Arraste um arquivo aqui"}
              </div>
              <div className="text-xs text-muted-foreground">ou</div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={triggerFileInput}
                className="hover:bg-primary/10"
              >
                Selecionar arquivo
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <div className="text-xs text-muted-foreground">
              PDF, Excel, CSV, JPG até 20MB
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}