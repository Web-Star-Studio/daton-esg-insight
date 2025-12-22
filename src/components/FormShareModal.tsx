import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface FormShareModalProps {
  open: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
}

export function FormShareModal({ open, onClose, formId, formTitle }: FormShareModalProps) {
  const [copied, setCopied] = useState(false);
  const formUrl = `${window.location.origin}/form/${formId}`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };
  
  const handleDownloadQR = () => {
    const svg = document.getElementById('form-qr-code');
    if (!svg) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      const safeTitle = formTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
      link.download = `qrcode-${safeTitle}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success("QR Code baixado com sucesso!");
    };
    
    img.onerror = () => {
      toast.error("Erro ao gerar imagem do QR Code");
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Formulário</DialogTitle>
          <DialogDescription>
            Use o QR Code ou copie o link para compartilhar o formulário
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code */}
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <QRCodeSVG 
              id="form-qr-code"
              value={formUrl} 
              size={200}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          
          <p className="text-center text-sm font-medium text-foreground">
            {formTitle}
          </p>
          
          {/* Link com botão de copiar */}
          <div className="flex w-full gap-2">
            <Input 
              value={formUrl} 
              readOnly 
              className="flex-1 text-xs"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleCopyLink}
              title="Copiar link"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Botão para baixar QR Code */}
          <Button onClick={handleDownloadQR} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Baixar QR Code (PNG)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
