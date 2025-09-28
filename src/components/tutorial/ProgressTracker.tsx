import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTutorial } from '@/contexts/TutorialContext';
import { 
  Trophy, 
  Target, 
  CheckCircle, 
  BookOpen, 
  Play, 
  Award,
  TrendingUp
} from 'lucide-react';

const MODULE_INFO = {
  'dashboard': { name: 'Dashboard', icon: TrendingUp, totalSteps: 5 },
  'emissions': { name: 'Emissões', icon: Target, totalSteps: 8 },
  'quality': { name: 'Qualidade', icon: CheckCircle, totalSteps: 6 },
  'performance': { name: 'Desempenho', icon: Trophy, totalSteps: 7 },
  'sustainability': { name: 'Sustentabilidade', icon: Award, totalSteps: 9 }
};

const ACHIEVEMENTS = [
  {
    id: 'first-login',
    title: 'Primeiro Acesso',
    description: 'Completou o onboarding inicial',
    icon: Play,
    unlocked: true
  },
  {
    id: 'data-explorer',
    title: 'Explorador de Dados',
    description: 'Inseriu dados em 3 módulos diferentes',
    icon: BookOpen,
    unlocked: false
  },
  {
    id: 'report-master',
    title: 'Mestre dos Relatórios',
    description: 'Gerou seu primeiro relatório',
    icon: Trophy,
    unlocked: false
  },
  {
    id: 'completionist',
    title: 'Completista',
    description: 'Completou todos os tutorials',
    icon: Award,
    unlocked: false
  }
];

interface ProgressTrackerProps {
  compact?: boolean;
}

export function ProgressTracker({ compact = false }: ProgressTrackerProps) {
  const { tutorialProgress, startTour, userProfile } = useTutorial();

  const totalProgress = tutorialProgress.reduce((acc, module) => {
    const moduleInfo = MODULE_INFO[module.moduleId as keyof typeof MODULE_INFO];
    if (moduleInfo) {
      return acc + (module.completedSteps.length / moduleInfo.totalSteps) * 100;
    }
    return acc;
  }, 0);

  const averageProgress = tutorialProgress.length > 0 ? totalProgress / tutorialProgress.length : 0;
  const completedModules = tutorialProgress.filter(m => m.isCompleted).length;

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Progresso do Tutorial</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {Math.round(averageProgress)}%
            </Badge>
          </div>
          <Progress value={averageProgress} className="h-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Progresso do Aprendizado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progresso Geral */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progresso Geral</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(averageProgress)}% completo
            </span>
          </div>
          <Progress value={averageProgress} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{completedModules} módulos completos</span>
            <span>{tutorialProgress.length} módulos iniciados</span>
          </div>
        </div>

        {/* Progresso por Módulo */}
        <div>
          <h4 className="font-medium mb-3 text-sm">Módulos</h4>
          <div className="space-y-3">
            {Object.entries(MODULE_INFO).map(([moduleId, info]) => {
              const moduleProgress = tutorialProgress.find(p => p.moduleId === moduleId);
              const completedSteps = moduleProgress?.completedSteps.length || 0;
              const progress = (completedSteps / info.totalSteps) * 100;
              const Icon = info.icon;

              return (
                <div key={moduleId} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{info.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {completedSteps} de {info.totalSteps} passos
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16">
                      <Progress value={progress} className="h-2" />
                    </div>
                    {progress === 100 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startTour(`${moduleId}-intro`)}
                        className="h-6 px-2 text-xs"
                      >
                        Continuar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conquistas */}
        <div>
          <h4 className="font-medium mb-3 text-sm">Conquistas</h4>
          <div className="grid grid-cols-2 gap-2">
            {ACHIEVEMENTS.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-lg border text-center ${
                    achievement.unlocked
                      ? 'bg-primary/10 border-primary/20'
                      : 'bg-muted/20 border-muted opacity-50'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    achievement.unlocked ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div className="font-medium text-xs mb-1">{achievement.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {achievement.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recomendações baseadas no perfil */}
        <div className="bg-gradient-to-r from-primary/10 to-primary-glow/10 p-4 rounded-lg border border-primary/20">
          <h4 className="font-medium text-sm mb-2">Próximos Passos Recomendados</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Baseado no seu perfil: <Badge variant="outline" className="text-xs">{userProfile}</Badge>
          </p>
          
          <div className="space-y-2">
            {averageProgress < 30 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => startTour('dashboard-intro')}
                className="w-full justify-start h-8 text-xs"
              >
                <Play className="w-3 h-3 mr-2" />
                Explore o Dashboard Principal
              </Button>
            )}
            
            {userProfile === 'esg' && averageProgress > 30 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => startTour('emissions-basics')}
                className="w-full justify-start h-8 text-xs"
              >
                <Target className="w-3 h-3 mr-2" />
                Configure Monitoramento de Emissões
              </Button>
            )}
            
            {userProfile === 'rh' && averageProgress > 30 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => startTour('performance-module')}
                className="w-full justify-start h-8 text-xs"
              >
                <Trophy className="w-3 h-3 mr-2" />
                Gerencie Desempenho da Equipe
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}