import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

interface GuidedPromptsProps {
  stage: number;
  onSuggestion: (suggestion: string) => void;
}

const PROMPTS_BY_STAGE: Record<number, { question: string; suggestions: string[] }[]> = {
  1: [
    {
      question: 'Quais são os principais objetivos deste relatório?',
      suggestions: [
        'Demonstrar compromisso com sustentabilidade para investidores',
        'Cumprir requisitos regulatórios e de compliance',
        'Aumentar transparência com stakeholders',
      ],
    },
    {
      question: 'Quais unidades operacionais serão incluídas?',
      suggestions: [
        'Todas as unidades no Brasil',
        'Matriz e principais filiais',
        'Operações globais incluindo subsidiárias',
      ],
    },
  ],
  2: [
    {
      question: 'Você possui inventário GEE completo?',
      suggestions: [
        'Sim, atualizado este ano',
        'Sim, mas do ano anterior',
        'Não, preciso calcular',
      ],
    },
  ],
};

export function GuidedPrompts({ stage, onSuggestion }: GuidedPromptsProps) {
  const prompts = PROMPTS_BY_STAGE[stage] || [];

  if (prompts.length === 0) return null;

  return (
    <div className="space-y-4">
      {prompts.map((prompt, idx) => (
        <Card key={idx} className="border-l-4 border-l-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              {prompt.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {prompt.suggestions.map((suggestion, sidx) => (
                <Button
                  key={sidx}
                  variant="outline"
                  size="sm"
                  onClick={() => onSuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
