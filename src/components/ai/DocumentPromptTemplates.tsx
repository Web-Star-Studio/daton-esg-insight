import { Button } from '@/components/ui/button';
import { Cloud, FileCheck, Droplets, Zap, Leaf, Recycle, FileText } from 'lucide-react';

interface DocumentPromptTemplatesProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

const DOCUMENT_PROMPTS = [
  {
    label: '📊 Importar emissões GEE',
    prompt: 'Analise este arquivo e importe os dados de emissões de gases de efeito estufa (Escopo 1, 2 e 3). Identifique as fontes de emissão, quantidades e períodos.',
    icon: Cloud,
    category: 'Emissões'
  },
  {
    label: '📄 Extrair dados de licença',
    prompt: 'Extraia as informações desta licença ambiental: número da licença, órgão emissor, validade, condicionantes e restrições. Organize os dados para cadastro no sistema.',
    icon: FileCheck,
    category: 'Licenciamento'
  },
  {
    label: '💧 Processar consumo de água',
    prompt: 'Processe estes dados de consumo de água. Identifique volumes consumidos, fontes de captação, períodos de medição e crie os registros de monitoramento.',
    icon: Droplets,
    category: 'Recursos Hídricos'
  },
  {
    label: '⚡ Analisar consumo de energia',
    prompt: 'Analise este relatório de consumo de energia. Extraia dados de consumo (kWh), fontes energéticas, custos e períodos. Importe para o sistema de monitoramento.',
    icon: Zap,
    category: 'Energia'
  },
  {
    label: '♻️ Registrar resíduos',
    prompt: 'Processe estes dados de geração de resíduos. Identifique tipos de resíduos, quantidades, destinação final e períodos. Cadastre no sistema de gestão de resíduos.',
    icon: Recycle,
    category: 'Resíduos'
  },
  {
    label: '🌱 Importar indicadores ESG',
    prompt: 'Analise este relatório e extraia os indicadores ESG (ambientais, sociais e de governança). Organize os dados por categoria e período de referência.',
    icon: Leaf,
    category: 'ESG'
  },
  {
    label: '📋 Extração geral',
    prompt: 'Analise este documento e extraia todas as informações relevantes. Identifique o tipo de documento e sugira como organizar os dados no sistema.',
    icon: FileText,
    category: 'Geral'
  }
];

export function DocumentPromptTemplates({ onSelectPrompt, disabled }: DocumentPromptTemplatesProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          Templates para análise de documentos
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {DOCUMENT_PROMPTS.map((template) => (
          <Button
            key={template.label}
            variant="outline"
            size="sm"
            className="h-auto py-3 px-3 justify-start text-left hover:bg-accent hover:border-primary/50 transition-colors"
            onClick={() => onSelectPrompt(template.prompt)}
            disabled={disabled}
          >
            <div className="flex items-start gap-2 w-full">
              <template.icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight">
                  {template.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {template.category}
                </p>
              </div>
            </div>
          </Button>
        ))}
      </div>
      
      <p className="text-[11px] text-muted-foreground text-center mt-2">
        💡 Dica: Selecione um template e ajuste conforme necessário
      </p>
    </div>
  );
}
