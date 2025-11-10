import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { getThemeById } from '@/constants/materialityThemesLibrary';
import { toast } from 'sonner';

interface ThemeScore {
  financial: number;
  impact: number;
  justification?: string;
  stakeholders?: string[];
}

interface MaterialityScoreFormProps {
  selectedThemes: string[];
  onScoresCompleted: (scores: Record<string, ThemeScore>) => void;
  initialScores?: Record<string, ThemeScore>;
}

const STAKEHOLDER_OPTIONS = [
  'Investidores',
  'Governo',
  'Clientes',
  'Colaboradores',
  'Comunidades locais',
  'Fornecedores',
  'ONGs',
  'Sindicatos',
  'Mídia',
  'Acionistas'
];

const SCORE_LABELS = [
  { value: 1, label: 'Muito Baixo' },
  { value: 2, label: 'Baixo' },
  { value: 3, label: 'Médio' },
  { value: 4, label: 'Alto' },
  { value: 5, label: 'Muito Alto' }
];

export function MaterialityScoreForm({ 
  selectedThemes, 
  onScoresCompleted,
  initialScores = {}
}: MaterialityScoreFormProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, ThemeScore>>(initialScores);

  const currentThemeId = selectedThemes[currentIndex];
  const currentTheme = getThemeById(currentThemeId);
  const currentScore = scores[currentThemeId] || {
    financial: 3,
    impact: 3,
    justification: '',
    stakeholders: []
  };

  const progress = (Object.keys(scores).length / selectedThemes.length) * 100;

  const updateCurrentScore = (updates: Partial<ThemeScore>) => {
    setScores({
      ...scores,
      [currentThemeId]: {
        ...currentScore,
        ...updates
      }
    });
  };

  const handleNext = () => {
    if (!currentScore.justification || currentScore.justification.trim().length < 20) {
      toast.error('Por favor, adicione uma justificativa com pelo menos 20 caracteres');
      return;
    }

    if (currentIndex < selectedThemes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleComplete = () => {
    const allScored = selectedThemes.every(id => scores[id]?.justification);
    if (!allScored) {
      toast.error('Por favor, avalie todos os temas antes de continuar');
      return;
    }
    onScoresCompleted(scores);
    toast.success('Avaliação concluída!');
  };

  const toggleStakeholder = (stakeholder: string) => {
    const current = currentScore.stakeholders || [];
    const updated = current.includes(stakeholder)
      ? current.filter(s => s !== stakeholder)
      : [...current, stakeholder];
    updateCurrentScore({ stakeholders: updated });
  };

  const getScoreLabel = (value: number) => {
    const label = SCORE_LABELS.find(l => l.value === value);
    return label ? label.label : '';
  };

  if (!currentTheme) {
    return <div>Tema não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Progresso da Avaliação
            </span>
            <span className="text-sm text-muted-foreground">
              {Object.keys(scores).length} de {selectedThemes.length} temas avaliados
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Theme Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{currentTheme.icon}</span>
                <span>{currentTheme.name}</span>
              </CardTitle>
              <CardDescription>{currentTheme.description}</CardDescription>
            </div>
            <Badge variant="outline">
              {currentIndex + 1} de {selectedThemes.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Materialidade Financeira (Outside-In) */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">
                Materialidade Financeira (Outside-In)
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Qual o impacto deste tema nos resultados financeiros e operacionais da sua empresa?
              </p>
            </div>
            <div className="space-y-3">
              <Slider
                value={[currentScore.financial]}
                onValueChange={(value) => updateCurrentScore({ financial: value[0] })}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Muito Baixo</span>
                <span className="font-semibold text-primary">
                  {currentScore.financial} - {getScoreLabel(currentScore.financial)}
                </span>
                <span>5 - Muito Alto</span>
              </div>
            </div>
          </div>

          {/* Materialidade de Impacto (Inside-Out) */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">
                Materialidade de Impacto (Inside-Out)
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Qual o impacto da sua empresa neste tema (meio ambiente, sociedade, economia)?
              </p>
            </div>
            <div className="space-y-3">
              <Slider
                value={[currentScore.impact]}
                onValueChange={(value) => updateCurrentScore({ impact: value[0] })}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Muito Baixo</span>
                <span className="font-semibold text-primary">
                  {currentScore.impact} - {getScoreLabel(currentScore.impact)}
                </span>
                <span>5 - Muito Alto</span>
              </div>
            </div>
          </div>

          {/* Justificativa */}
          <div className="space-y-3">
            <Label htmlFor="justification" className="text-base font-semibold">
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="justification"
              placeholder="Explique por que este tema é material para sua organização. Considere riscos, oportunidades, impactos e contexto do setor..."
              value={currentScore.justification || ''}
              onChange={(e) => updateCurrentScore({ justification: e.target.value })}
              className="min-h-[120px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {currentScore.justification?.length || 0}/500 caracteres (mínimo 20)
            </p>
          </div>

          {/* Stakeholders */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Stakeholders mais Afetados
            </Label>
            <p className="text-sm text-muted-foreground">
              Selecione os grupos de stakeholders mais impactados ou interessados neste tema
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {STAKEHOLDER_OPTIONS.map(stakeholder => (
                <div key={stakeholder} className="flex items-center space-x-2">
                  <Checkbox
                    id={stakeholder}
                    checked={currentScore.stakeholders?.includes(stakeholder)}
                    onCheckedChange={() => toggleStakeholder(stakeholder)}
                  />
                  <label
                    htmlFor={stakeholder}
                    className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {stakeholder}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast.success('Progresso salvo');
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar Progresso
              </Button>

              {currentIndex < selectedThemes.length - 1 ? (
                <Button onClick={handleNext}>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="bg-primary">
                  Concluir Avaliação
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Navegação Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedThemes.map((themeId, idx) => {
              const theme = getThemeById(themeId);
              const isScored = scores[themeId]?.justification;
              const isCurrent = idx === currentIndex;
              
              return theme ? (
                <Button
                  key={themeId}
                  variant={isCurrent ? 'default' : isScored ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentIndex(idx)}
                  className="relative"
                >
                  {theme.icon} {idx + 1}
                  {isScored && !isCurrent && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </Button>
              ) : null;
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
