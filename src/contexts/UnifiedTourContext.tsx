import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TourDefinition, TourProgress, TourContextValue, TourPriority } from '@/types/tour';
import { tourDefinitions } from '@/components/tutorial/unified/tourDefinitions';
import { useTourAnalytics } from '@/hooks/useTourAnalytics';

const UnifiedTourContext = createContext<TourContextValue | undefined>(undefined);

const STORAGE_KEY = 'unified_tour_progress';

export function UnifiedTourProvider({ children }: { children: React.ReactNode }) {
  const [activeTour, setActiveTour] = useState<TourDefinition | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<TourProgress[]>([]);
  const [queue, setQueue] = useState<TourDefinition[]>([]);
  const [tourStartTime, setTourStartTime] = useState<number | null>(null);
  
  const analytics = useTourAnalytics();

  // Carregar progresso do localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch (error) {
        console.error('Error loading tour progress:', error);
      }
    }
  }, []);

  // Salvar progresso no localStorage
  const saveProgress = useCallback((newProgress: TourProgress[]) => {
    setProgress(newProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
  }, []);

  const startTour = useCallback((tourId: string) => {
    const tour = tourDefinitions[tourId];
    if (!tour) {
      console.error(`Tour ${tourId} not found`);
      return;
    }

    // Limpar fila e iniciar tour
    setQueue([]);
    setActiveTour(tour);
    setCurrentStepIndex(0);
    setIsPlaying(true);
    setIsPaused(false);
    setTourStartTime(Date.now());

    // Analytics: Track tour start
    analytics.trackTourStart(tourId);

    // Criar ou atualizar progresso
    const existingProgress = progress.find(p => p.tourId === tourId);
    if (!existingProgress) {
      const newProgress: TourProgress = {
        tourId,
        completedSteps: [],
        currentStep: 0,
        startedAt: new Date().toISOString(),
        isCompleted: false,
      };
      saveProgress([...progress, newProgress]);
    }
  }, [progress, saveProgress, analytics]);

  const nextStep = useCallback(() => {
    if (!activeTour) return;

    const currentStep = activeTour.steps[currentStepIndex];
    
    // Analytics: Track step view
    if (currentStep) {
      analytics.trackStepView(activeTour.id, currentStep.id, currentStepIndex);
    }

    const nextIndex = currentStepIndex + 1;
    
    if (nextIndex >= activeTour.steps.length) {
      completeTour();
      return;
    }

    // Pular steps que devem ser pulados
    let finalIndex = nextIndex;
    while (finalIndex < activeTour.steps.length) {
      const step = activeTour.steps[finalIndex];
      if (step.skipIf && step.skipIf()) {
        finalIndex++;
      } else {
        break;
      }
    }

    if (finalIndex >= activeTour.steps.length) {
      completeTour();
      return;
    }

    setCurrentStepIndex(finalIndex);

    // Atualizar progresso
    const updatedProgress = progress.map(p => 
      p.tourId === activeTour.id
        ? { ...p, completedSteps: [...new Set([...p.completedSteps, activeTour.steps[currentStepIndex].id])], currentStep: finalIndex }
        : p
    );
    saveProgress(updatedProgress);
  }, [activeTour, currentStepIndex, progress, saveProgress, analytics]);

  const prevStep = useCallback(() => {
    if (!activeTour || currentStepIndex === 0) return;

    let prevIndex = currentStepIndex - 1;
    
    // Pular steps que devem ser pulados (em reverso)
    while (prevIndex >= 0) {
      const step = activeTour.steps[prevIndex];
      if (step.skipIf && step.skipIf()) {
        prevIndex--;
      } else {
        break;
      }
    }

    if (prevIndex < 0) return;

    setCurrentStepIndex(prevIndex);

    // Atualizar progresso
    const updatedProgress = progress.map(p => 
      p.tourId === activeTour.id
        ? { ...p, currentStep: prevIndex }
        : p
    );
    saveProgress(updatedProgress);
  }, [activeTour, currentStepIndex, progress, saveProgress]);

  const pauseTour = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTour = useCallback(() => {
    setIsPaused(false);
  }, []);

  const completeTour = useCallback(() => {
    if (!activeTour) return;

    // Analytics: Track tour completion
    if (tourStartTime) {
      const durationSeconds = Math.floor((Date.now() - tourStartTime) / 1000);
      analytics.trackTourComplete(activeTour.id, durationSeconds);
    }

    // Marcar como completo
    const updatedProgress = progress.map(p => 
      p.tourId === activeTour.id
        ? { ...p, isCompleted: true, completedAt: new Date().toISOString() }
        : p
    );
    saveProgress(updatedProgress);

    // Limpar tour ativo
    setActiveTour(null);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setIsPaused(false);
    setTourStartTime(null);

    // Iniciar próximo tour da fila
    if (queue.length > 0) {
      const [nextTour, ...remainingQueue] = queue;
      setQueue(remainingQueue);
      setTimeout(() => startTour(nextTour.id), 500);
    }
  }, [activeTour, progress, queue, saveProgress, startTour, tourStartTime, analytics]);

  const dismissTour = useCallback(() => {
    if (!activeTour) return;

    // Analytics: Track tour dismissal
    if (tourStartTime) {
      const durationSeconds = Math.floor((Date.now() - tourStartTime) / 1000);
      analytics.trackTourDismiss(activeTour.id, currentStepIndex, durationSeconds);
    }

    // Marcar como dismissed
    const updatedProgress = progress.map(p => 
      p.tourId === activeTour.id
        ? { ...p, dismissed: true }
        : p
    );
    saveProgress(updatedProgress);

    setActiveTour(null);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setIsPaused(false);
    setTourStartTime(null);
  }, [activeTour, progress, saveProgress, currentStepIndex, tourStartTime, analytics]);

  const queueTour = useCallback((tourId: string, priority: TourPriority = 'automatic') => {
    const tour = tourDefinitions[tourId];
    if (!tour) return;

    // Se já está ativo, ignorar
    if (activeTour?.id === tourId) return;

    // Se já está na fila, ignorar
    if (queue.some(t => t.id === tourId)) return;

    // Se não há tour ativo, iniciar imediatamente
    if (!activeTour) {
      startTour(tourId);
      return;
    }

    // Adicionar à fila com prioridade
    if (priority === 'user-initiated') {
      setQueue([tour, ...queue]);
    } else {
      setQueue([...queue, tour]);
    }
  }, [activeTour, queue, startTour]);

  const skipStep = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (!activeTour || stepIndex < 0 || stepIndex >= activeTour.steps.length) return;
    setCurrentStepIndex(stepIndex);
  }, [activeTour]);

  const getTourProgress = useCallback((tourId: string) => {
    return progress.find(p => p.tourId === tourId);
  }, [progress]);

  const isTourCompleted = useCallback((tourId: string) => {
    const tourProgress = progress.find(p => p.tourId === tourId);
    return tourProgress?.isCompleted || false;
  }, [progress]);

  const value: TourContextValue = {
    activeTour,
    currentStepIndex,
    isPlaying,
    isPaused,
    progress,
    queue,
    startTour,
    nextStep,
    prevStep,
    pauseTour,
    resumeTour,
    completeTour,
    dismissTour,
    queueTour,
    skipStep,
    goToStep,
    getTourProgress,
    isTourCompleted,
  };

  return (
    <UnifiedTourContext.Provider value={value}>
      {children}
    </UnifiedTourContext.Provider>
  );
}

export function useUnifiedTour() {
  const context = useContext(UnifiedTourContext);
  if (!context) {
    throw new Error('useUnifiedTour must be used within UnifiedTourProvider');
  }
  return context;
}
