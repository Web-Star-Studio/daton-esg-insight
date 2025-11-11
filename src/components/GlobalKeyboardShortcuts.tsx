import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Global keyboard shortcuts for the application
 * Ctrl/Cmd + K: Global search (placeholder)
 * Ctrl/Cmd + D: Go to Documents
 * Ctrl/Cmd + E: Go to Extractions/Approvals
 * Ctrl/Cmd + I: Open AI Assistant (placeholder)
 * Ctrl/Cmd + H: Show shortcuts help
 */
export function GlobalKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger on Ctrl/Cmd + Key combinations
      if (!(e.ctrlKey || e.metaKey)) return;
      
      switch(e.key.toLowerCase()) {
        case 'k': {
          e.preventDefault();
          toast.info('Busca global', { description: 'Em desenvolvimento' });
          break;
        }
        
        case 'd': {
          e.preventDefault();
          navigate('/documentos');
          toast.success('Navegando para Documentos');
          break;
        }
        
        case 'e': {
          e.preventDefault();
          navigate('/extracoes-documentos');
          toast.success('Navegando para Aprovações');
          break;
        }
        
        case 'i': {
          e.preventDefault();
          toast.info('Assistente IA', { 
            description: 'Use o botão flutuante no canto inferior direito' 
          });
          break;
        }
        
        case 'h': {
          e.preventDefault();
          showShortcutsHelp();
          break;
        }
        
        case 'm': {
          e.preventDefault();
          navigate('/monitoramento-agua');
          toast.success('Navegando para Monitoramento de Água');
          break;
        }
        
        case 'g': {
          e.preventDefault();
          navigate('/gri');
          toast.success('Navegando para GRI');
          break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  const showShortcutsHelp = () => {
    const shortcuts = [
      { key: 'Ctrl/Cmd + D', action: 'Documentos' },
      { key: 'Ctrl/Cmd + E', action: 'Aprovações de Extrações' },
      { key: 'Ctrl/Cmd + M', action: 'Monitoramento de Água' },
      { key: 'Ctrl/Cmd + G', action: 'GRI' },
      { key: 'Ctrl/Cmd + I', action: 'Assistente IA' },
      { key: 'Ctrl/Cmd + K', action: 'Busca global' },
      { key: 'Ctrl/Cmd + H', action: 'Mostrar atalhos' },
    ];

    const message = shortcuts
      .map(s => `${s.key}: ${s.action}`)
      .join('\n');

    toast.info('⌨️ Atalhos de Teclado', {
      description: message,
      duration: 8000,
    });
  };

  return null; // This component doesn't render anything
}
