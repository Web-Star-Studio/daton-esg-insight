import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit, Check } from 'lucide-react';
import { SDG_DATA } from '@/constants/sdgData';
import { useState } from 'react';
import { toast } from 'sonner';

interface SDGDetails {
  sdg_number: number;
  selected_targets: string[];
  impact_level: 'Alto' | 'Médio' | 'Baixo';
  actions_taken?: string;
  results_achieved?: string;
  future_commitments?: string;
}

interface GeneratedTextPreviewProps {
  selectedSDGs: number[];
  sdgDetails: Map<number, SDGDetails>;
}

export function GeneratedTextPreview({ 
  selectedSDGs, 
  sdgDetails
}: GeneratedTextPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [copied, setCopied] = useState(false);

  const generateText = (): string => {
    if (selectedSDGs.length === 0) {
      return 'Selecione pelo menos um ODS para gerar o texto do relatório.';
    }

    let text = `A organização adota os seguintes Objetivos de Desenvolvimento Sustentável (ODS) da Agenda 2030 como parte integrante de sua estratégia de gestão e sustentabilidade:\n\n`;

    selectedSDGs.forEach((sdgNumber, index) => {
      const sdg = SDG_DATA.find(s => s.number === sdgNumber);
      const details = sdgDetails.get(sdgNumber);

      if (!sdg) return;

      const impactLevel = details?.impact_level || 'Média';
      
      text += `**ODS ${sdg.number} - ${sdg.name}** (Contribuição ${impactLevel})\n`;
      text += `${sdg.description}\n\n`;

      if (details?.selected_targets && details.selected_targets.length > 0) {
        text += `*Metas adotadas:* ${details.selected_targets.join(', ')}\n\n`;
        
        details.selected_targets.forEach(targetCode => {
          const target = sdg.targets.find(t => t.code === targetCode);
          if (target) {
            text += `• **Meta ${targetCode}:** ${target.description}\n`;
          }
        });
        text += '\n';
      }

      if (details?.actions_taken) {
        text += `*Ações realizadas:* ${details.actions_taken}\n\n`;
      }

      if (details?.results_achieved) {
        text += `*Resultados alcançados:* ${details.results_achieved}\n\n`;
      }

      if (details?.future_commitments) {
        text += `*Compromissos futuros:* ${details.future_commitments}\n\n`;
      }

      if (index < selectedSDGs.length - 1) {
        text += '---\n\n';
      }
    });

    text += `\nEsta seleção de ODS está alinhada aos princípios do **Pacto Global da ONU**, demonstrando o compromisso da organização com práticas empresariais responsáveis nas áreas de direitos humanos, trabalho, meio ambiente e anticorrupção.\n\n`;
    
    text += `A organização reconhece a importância dos ODS como framework global para o desenvolvimento sustentável e continuará integrando esses objetivos em sua estratégia de negócios, processos operacionais e tomada de decisões, contribuindo ativamente para a Agenda 2030.`;

    return text;
  };

  const generatedText = isEditing ? editedText : generateText();

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    toast.success('Texto copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    if (!isEditing) {
      setEditedText(generateText());
    }
    setIsEditing(!isEditing);
  };

  if (selectedSDGs.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              📄 Preview do Texto para o Relatório
            </CardTitle>
            <CardDescription className="mt-1">
              Texto gerado automaticamente com base nos ODS selecionados
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              {isEditing ? 'Visualizar' : 'Editar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={20}
            className="font-mono text-sm"
          />
        ) : (
          <div className="prose prose-sm max-w-none p-6 bg-background rounded-lg border">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
              {generatedText}
            </pre>
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <Badge variant="outline">
            {selectedSDGs.length} ODS selecionados
          </Badge>
          <Badge variant="outline">
            {Array.from(sdgDetails.values()).reduce((sum, d) => sum + (d.selected_targets?.length || 0), 0)} metas
          </Badge>
          <Badge variant="outline">
            {generatedText.split(' ').length} palavras
          </Badge>
          <Badge variant="outline">
            {generatedText.length} caracteres
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
