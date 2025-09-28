import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  ThumbsUp, ThumbsDown, MessageSquare, Star, Send,
  Zap, Clock, Target, TrendingUp, AlertCircle, CheckCircle2,
  BarChart3, Brain, Lightbulb, Heart
} from 'lucide-react';

interface FeedbackData {
  stepRating: number;
  difficulty: 'easy' | 'moderate' | 'difficult';
  timeSpent: number;
  suggestions: string;
  helpfulness: number;
  likedFeatures: string[];
  improvements: string[];
}

interface RealTimeFeedbackSystemProps {
  currentStep: number;
  stepTitle: string;
  onFeedbackSubmitted?: (feedback: FeedbackData) => void;
  showCompact?: boolean;
}

const FEEDBACK_PROMPTS = [
  {
    step: 0,
    title: 'Como foi a apresentação inicial?',
    questions: [
      'As informações estavam claras?',
      'O tempo estimado foi adequado?',
      'Algo confuso ou desnecessário?'
    ]
  },
  {
    step: 1,
    title: 'Seleção de módulos foi intuitiva?',
    questions: [
      'Foi fácil entender cada módulo?',
      'As recomendações foram úteis?',
      'Faltou alguma informação importante?'
    ]
  },
  {
    step: 2,
    title: 'Como foi a configuração dos atalhos?',
    questions: [
      'O conceito de atalhos ficou claro?',
      'A configuração foi simples?',
      'Os exemplos ajudaram?'
    ]
  },
  {
    step: 3,
    title: 'Experiência geral do onboarding',
    questions: [
      'Você se sente preparado para usar a plataforma?',
      'O que mais gostou no processo?',
      'O que poderia ser melhorado?'
    ]
  }
];

const QUICK_REACTIONS = [
  { icon: '😍', label: 'Amei!', value: 5 },
  { icon: '😊', label: 'Gostei', value: 4 },
  { icon: '😐', label: 'OK', value: 3 },
  { icon: '😕', label: 'Confuso', value: 2 },
  { icon: '😤', label: 'Frustrante', value: 1 }
];

const COMMON_IMPROVEMENTS = [
  'Mais informações explicativas',
  'Processo mais rápido', 
  'Melhor design visual',
  'Mais exemplos práticos',
  'Tutorial em vídeo',
  'Suporte via chat',
  'Melhor organização',
  'Menos etapas'
];

export function RealTimeFeedbackSystem({
  currentStep,
  stepTitle,
  onFeedbackSubmitted,
  showCompact = false
}: RealTimeFeedbackSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<Partial<FeedbackData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const currentPrompt = FEEDBACK_PROMPTS.find(p => p.step === currentStep);

  // Auto-trigger feedback request after user spends time on step
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasSubmitted && !isOpen) {
        setIsOpen(true);
      }
    }, 30000); // Show after 30 seconds

    return () => clearTimeout(timer);
  }, [currentStep, hasSubmitted, isOpen]);

  const submitFeedback = async () => {
    setIsSubmitting(true);
    
    const completeData: FeedbackData = {
      stepRating: feedback.stepRating || 3,
      difficulty: feedback.difficulty || 'moderate',
      timeSpent: Date.now() - (parseInt(localStorage.getItem('step_start_time') || '0')),
      suggestions: feedback.suggestions || '',
      helpfulness: feedback.helpfulness || 3,
      likedFeatures: feedback.likedFeatures || [],
      improvements: feedback.improvements || []
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onFeedbackSubmitted?.(completeData);
    
    setIsSubmitting(false);
    setHasSubmitted(true);
    setShowThankYou(true);
    
    // Hide thank you message after 3 seconds
    setTimeout(() => {
      setShowThankYou(false);
      setIsOpen(false);
    }, 3000);
  };

  const handleQuickReaction = (value: number) => {
    setFeedback(prev => ({ ...prev, stepRating: value }));
  };

  const toggleImprovement = (improvement: string) => {
    setFeedback(prev => ({
      ...prev,
      improvements: prev.improvements?.includes(improvement)
        ? prev.improvements.filter(i => i !== improvement)
        : [...(prev.improvements || []), improvement]
    }));
  };

  // Compact floating feedback button
  if (showCompact && !isOpen) {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-12 w-12 shadow-lg bg-primary hover:bg-primary/90 pulse-animation"
          size="sm"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        {!hasSubmitted && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
    );
  }

  if (!isOpen) return null;

  // Thank you state
  if (showThankYou) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-xl z-50">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="p-3 bg-green-100 rounded-full w-fit mx-auto">
              <Heart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-800 mb-2">Obrigado!</h3>
              <p className="text-green-700 text-sm">
                Seu feedback nos ajuda a melhorar continuamente a experiência.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[600px] overflow-y-auto border-primary/20 bg-card/95 backdrop-blur-sm shadow-xl z-50">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-blue/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Feedback Rápido</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {currentPrompt?.title || `Como está sendo o ${stepTitle}?`}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Rating */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Como você avaliaria esta etapa?</h4>
          <div className="flex justify-between gap-2">
            {QUICK_REACTIONS.map((reaction) => (
              <Button
                key={reaction.value}
                variant={feedback.stepRating === reaction.value ? "default" : "outline"}
                className="flex-1 h-16 flex-col gap-1 text-xs"
                onClick={() => handleQuickReaction(reaction.value)}
              >
                <span className="text-xl">{reaction.icon}</span>
                {reaction.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Difficulty Rating */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Nível de dificuldade</h4>
          <div className="grid grid-cols-3 gap-2">
            {['easy', 'moderate', 'difficult'].map((level) => (
              <Button
                key={level}
                variant={feedback.difficulty === level ? "default" : "outline"}
                size="sm"
                onClick={() => setFeedback(prev => ({ ...prev, difficulty: level as any }))}
                className="capitalize"
              >
                {level === 'easy' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {level === 'moderate' && <Clock className="h-3 w-3 mr-1" />}
                {level === 'difficult' && <AlertCircle className="h-3 w-3 mr-1" />}
                {level === 'easy' ? 'Fácil' : level === 'moderate' ? 'Moderado' : 'Difícil'}
              </Button>
            ))}
          </div>
        </div>

        {/* Specific Questions */}
        {currentPrompt && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Questões específicas</h4>
            <div className="space-y-2">
              {currentPrompt.questions.map((question, index) => (
                <div key={index} className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <Lightbulb className="h-3 w-3 inline mr-2" />
                  {question}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvements */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">O que poderia melhorar?</h4>
          <div className="grid grid-cols-2 gap-2">
            {COMMON_IMPROVEMENTS.map((improvement) => (
              <Button
                key={improvement}
                variant={feedback.improvements?.includes(improvement) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleImprovement(improvement)}
                className="text-xs h-8 justify-start"
              >
                {improvement}
              </Button>
            ))}
          </div>
        </div>

        {/* Free Text Feedback */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Comentários adicionais</h4>
          <Textarea
            placeholder="Compartilhe suas impressões, sugestões ou dúvidas..."
            value={feedback.suggestions || ''}
            onChange={(e) => setFeedback(prev => ({ ...prev, suggestions: e.target.value }))}
            className="min-h-20 resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="space-y-3">
          <Button
            onClick={submitFeedback}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Feedback
              </>
            )}
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span>Feedback anônimo e seguro</span>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="bg-muted/30 p-3 rounded-lg border border-border/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Progresso do Onboarding</span>
            <span className="text-xs text-muted-foreground">{currentStep + 1}/4</span>
          </div>
          <Progress value={(currentStep + 1) / 4 * 100} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}