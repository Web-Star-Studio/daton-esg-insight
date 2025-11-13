import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveApiKey, getApiKey, clearApiKey } from '@/utils/anthropicClient';
import { toast } from 'sonner';
import { Key, ExternalLink } from 'lucide-react';

interface AnthropicAPIKeySettingsProps {
  open: boolean;
  onClose: () => void;
}

export function AnthropicAPIKeySettings({ open, onClose }: AnthropicAPIKeySettingsProps) {
  const [apiKey, setApiKey] = useState(getApiKey() || '');
  const [showKey, setShowKey] = useState(false);
  
  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error('Por favor, insira uma API key');
      return;
    }
    
    if (!apiKey.startsWith('sk-ant-')) {
      toast.error('API key inválida. Deve começar com sk-ant-');
      return;
    }
    
    saveApiKey(apiKey);
    toast.success('API key salva com sucesso!');
    onClose();
  };
  
  const handleClear = () => {
    clearApiKey();
    setApiKey('');
    toast.success('API key removida');
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configurar API Key do Anthropic
          </DialogTitle>
          <DialogDescription>
            Configure sua chave de API do Claude (Anthropic) para usar o chat com IA
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              Para usar o chat com IA, você precisa de uma API key do Anthropic Claude.
            </p>
            <a 
              href="https://console.anthropic.com/settings/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Obter API key no Console Anthropic
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showKey ? 'Ocultar' : 'Mostrar'} chave
            </button>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              Salvar
            </Button>
            {getApiKey() && (
              <Button variant="outline" onClick={handleClear}>
                Limpar
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            ℹ️ Sua API key é armazenada localmente no navegador e nunca é enviada para servidores externos
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
