import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, Star, Target, Zap, Crown, Medal, Award, 
  Gift, Sparkles, TrendingUp, CheckCircle2, Flame
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  points: number;
  unlocked: boolean;
  category: 'progress' | 'speed' | 'completeness' | 'expertise';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface GamificationLevel {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  benefits: string[];
}

interface SmartGamificationSystemProps {
  currentStep: number;
  totalSteps: number;
  selectedModulesCount: number;
  timeSpent: number;
  userActions: string[];
  onAchievementUnlocked?: (achievement: Achievement) => void;
}

const GAMIFICATION_LEVELS: GamificationLevel[] = [
  {
    level: 1,
    title: 'Iniciante ESG',
    minPoints: 0,
    maxPoints: 100,
    color: 'from-gray-400 to-gray-500',
    benefits: ['Acesso básico ao sistema', 'Tutorial personalizado']
  },
  {
    level: 2,
    title: 'Explorador Sustentável',
    minPoints: 101,
    maxPoints: 250,
    color: 'from-green-400 to-green-500',
    benefits: ['Templates exclusivos', 'Relatórios básicos', 'Suporte prioritário']
  },
  {
    level: 3,
    title: 'Especialista ESG',
    minPoints: 251,
    maxPoints: 500,
    color: 'from-blue-400 to-blue-500',
    benefits: ['Dashboard avançado', 'Integrações premium', 'Mentoria mensal']
  },
  {
    level: 4,
    title: 'Mestre da Sustentabilidade',
    minPoints: 501,
    maxPoints: 1000,
    color: 'from-purple-400 to-purple-500',
    benefits: ['IA avançada', 'Relatórios personalizados', 'Consultoria trimestral']
  },
  {
    level: 5,
    title: 'Líder ESG Certificado',
    minPoints: 1001,
    maxPoints: Infinity,
    color: 'from-yellow-400 to-yellow-500',
    benefits: ['Acesso completo', 'Consultoria mensal', 'Networking exclusivo', 'Certificação ESG']
  }
];

const BASE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_steps',
    title: 'Primeiros Passos',
    description: 'Completou o primeiro passo do onboarding',
    icon: <Target className="h-4 w-4" />,
    points: 50,
    unlocked: false,
    category: 'progress',
    rarity: 'common'
  },
  {
    id: 'module_selector',
    title: 'Escolhas Inteligentes',
    description: 'Selecionou módulos baseados no perfil da empresa',
    icon: <Star className="h-4 w-4" />,
    points: 75,
    unlocked: false,
    category: 'completeness',
    rarity: 'common'
  },
  {
    id: 'speed_demon',
    title: 'Velocidade da Luz',
    description: 'Completou o onboarding em menos de 3 minutos',
    icon: <Zap className="h-4 w-4" />,
    points: 100,
    unlocked: false,
    category: 'speed',
    rarity: 'rare'  
  },
  {
    id: 'perfectionist',
    title: 'Perfeccionista',
    description: 'Configurou 100% dos módulos selecionados',
    icon: <Trophy className="h-4 w-4" />,
    points: 125,
    unlocked: false,
    category: 'completeness',
    rarity: 'rare'
  },
  {
    id: 'multi_tasker',
    title: 'Multitarefa Master',
    description: 'Selecionou 5+ módulos diferentes',
    icon: <Crown className="h-4 w-4" />,
    points: 150,
    unlocked: false,
    category: 'expertise',
    rarity: 'epic'
  },
  {
    id: 'esg_pioneer',
    title: 'Pioneiro ESG',
    description: 'Completou onboarding com foco em sustentabilidade',
    icon: <Medal className="h-4 w-4" />,
    points: 200,
    unlocked: false,
    category: 'expertise',
    rarity: 'legendary'
  }
];

export function SmartGamificationSystem({
  currentStep,
  totalSteps,
  selectedModulesCount,
  timeSpent,
  userActions,
  onAchievementUnlocked
}: SmartGamificationSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>(BASE_ACHIEVEMENTS);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<GamificationLevel>(GAMIFICATION_LEVELS[0]);
  const [showNewAchievement, setShowNewAchievement] = useState<Achievement | null>(null);
  const [streak, setStreak] = useState(1);

  // Calcular pontos baseado no progresso
  useEffect(() => {
    let points = 0;
    const progressPercentage = (currentStep / totalSteps) * 100;
    
    // Pontos base por progresso
    points += Math.floor(progressPercentage * 2);
    
    // Bonus por velocidade (menos tempo = mais pontos)
    if (timeSpent < 180) points += 50; // Menos de 3 min
    if (timeSpent < 120) points += 25; // Menos de 2 min
    
    // Bonus por seleção de módulos
    points += selectedModulesCount * 15;
    
    // Bonus por ações do usuário
    points += userActions.length * 5;
    
    setTotalPoints(points);
    
    // Determinar nível atual
    const level = GAMIFICATION_LEVELS.find(l => 
      points >= l.minPoints && points <= l.maxPoints
    ) || GAMIFICATION_LEVELS[0];
    setCurrentLevel(level);
  }, [currentStep, totalSteps, selectedModulesCount, timeSpent, userActions]);

  // Verificar conquistas desbloqueadas
  useEffect(() => {
    const updatedAchievements = achievements.map(achievement => {
      if (achievement.unlocked) return achievement;
      
      let shouldUnlock = false;
      
      switch (achievement.id) {
        case 'first_steps':
          shouldUnlock = currentStep > 0;
          break;
        case 'module_selector':
          shouldUnlock = selectedModulesCount > 0;
          break;
        case 'speed_demon':
          shouldUnlock = timeSpent < 180 && currentStep === totalSteps - 1;
          break;
        case 'perfectionist':
          shouldUnlock = currentStep === totalSteps - 1;
          break;
        case 'multi_tasker':
          shouldUnlock = selectedModulesCount >= 5;
          break;
        case 'esg_pioneer':
          shouldUnlock = selectedModulesCount >= 3 && userActions.includes('smart_recommendations');
          break;
      }
      
      if (shouldUnlock && !achievement.unlocked) {
        const unlockedAchievement = { ...achievement, unlocked: true };
        setShowNewAchievement(unlockedAchievement);
        onAchievementUnlocked?.(unlockedAchievement);
        
        // Hide notification after 3 seconds
        setTimeout(() => setShowNewAchievement(null), 3000);
        
        return unlockedAchievement;
      }
      
      return achievement;
    });
    
    setAchievements(updatedAchievements);
  }, [currentStep, totalSteps, selectedModulesCount, timeSpent, userActions, achievements, onAchievementUnlocked]);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50 text-gray-700';
      case 'rare': return 'border-blue-300 bg-blue-50 text-blue-700';
      case 'epic': return 'border-purple-300 bg-purple-50 text-purple-700';
      case 'legendary': return 'border-yellow-300 bg-yellow-50 text-yellow-700';
    }
  };

  const getRarityBadge = (rarity: Achievement['rarity']) => {
    const colors = {
      common: 'bg-gray-500',
      rare: 'bg-blue-500',
      epic: 'bg-purple-500',
      legendary: 'bg-yellow-500'
    };
    
    return (
      <Badge className={`text-xs px-2 ${colors[rarity]} text-white`}>
        {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
      </Badge>
    );
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const progressToNextLevel = currentLevel.level < GAMIFICATION_LEVELS.length 
    ? ((totalPoints - currentLevel.minPoints) / (currentLevel.maxPoints - currentLevel.minPoints)) * 100
    : 100;

  return (
    <div className="space-y-4">
      {/* New Achievement Notification */}
      {showNewAchievement && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg animate-in slide-in-from-top-2 duration-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-yellow-800">🎉 Nova Conquista!</h4>
                  {getRarityBadge(showNewAchievement.rarity)}
                </div>
                <p className="text-yellow-700 font-medium">{showNewAchievement.title}</p>
                <p className="text-yellow-600 text-sm">{showNewAchievement.description}</p>
              </div>
              <div className="text-right">
                <Badge className="bg-yellow-600 text-white">
                  +{showNewAchievement.points} pts
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level Progress */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full bg-gradient-to-r ${currentLevel.color} text-white shadow-md`}>
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Nível {currentLevel.level}</h3>
                <p className="text-sm text-muted-foreground">{currentLevel.title}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-bold text-primary">{totalPoints} pts</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-muted-foreground">Streak: {streak}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso para o próximo nível</span>
              <span className="font-medium text-foreground">
                {Math.round(progressToNextLevel)}%
              </span>
            </div>
            <Progress value={progressToNextLevel} className="h-2" />
            
            {currentLevel.level < GAMIFICATION_LEVELS.length && (
              <p className="text-xs text-muted-foreground">
                Próximo: {GAMIFICATION_LEVELS[currentLevel.level].title} 
                ({GAMIFICATION_LEVELS[currentLevel.level].minPoints - totalPoints} pts restantes)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Conquistas ({unlockedAchievements.length}/{achievements.length})
            </h3>
            <Badge variant="outline" className="px-3">
              {unlockedAchievements.reduce((sum, a) => sum + a.points, 0)} pts
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200
                  ${achievement.unlocked 
                    ? `${getRarityColor(achievement.rarity)} shadow-sm scale-105` 
                    : 'border-muted bg-muted/30 text-muted-foreground opacity-60'
                  }
                `}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-1.5 rounded-md ${achievement.unlocked ? 'bg-background shadow-sm' : 'bg-muted'}`}>
                      {achievement.icon}
                    </div>
                    {achievement.unlocked && getRarityBadge(achievement.rarity)}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">{achievement.title}</h4>
                    <p className="text-xs opacity-80 leading-relaxed">{achievement.description}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs px-2">
                      {achievement.points} pts
                    </Badge>
                    {achievement.unlocked && (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Level Benefits */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-purple-800 flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Benefícios do Nível Atual
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentLevel.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-purple-700">
                  <CheckCircle2 className="h-3 w-3 text-purple-600 flex-shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}