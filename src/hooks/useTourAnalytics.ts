import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TourAnalyticsEvent {
  tour_id: string;
  event_type: 'started' | 'completed' | 'dismissed' | 'step_viewed';
  step_id?: string;
  step_index?: number;
  duration_seconds?: number;
  user_id?: string;
  session_id?: string;
}

export function useTourAnalytics() {
  const sessionId = useCallback(() => {
    let id = sessionStorage.getItem('tour_session_id');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('tour_session_id', id);
    }
    return id;
  }, []);

  const trackEvent = useCallback(async (event: Omit<TourAnalyticsEvent, 'user_id' | 'session_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const analyticsEvent: TourAnalyticsEvent = {
        ...event,
        user_id: user?.id,
        session_id: sessionId(),
      };

      // Salvar no localStorage para análise offline
      const storedEvents = localStorage.getItem('tour_analytics_events');
      const events = storedEvents ? JSON.parse(storedEvents) : [];
      events.push({
        ...analyticsEvent,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('tour_analytics_events', JSON.stringify(events));

      // Log para desenvolvimento
      console.log('[Tour Analytics]', analyticsEvent);

      // TODO: Implementar envio para backend quando tabela de analytics estiver pronta
      // await supabase.from('tour_analytics').insert(analyticsEvent);
    } catch (error) {
      console.error('Error tracking tour analytics:', error);
    }
  }, [sessionId]);

  const trackTourStart = useCallback((tourId: string) => {
    trackEvent({
      tour_id: tourId,
      event_type: 'started',
    });
  }, [trackEvent]);

  const trackTourComplete = useCallback((tourId: string, durationSeconds: number) => {
    trackEvent({
      tour_id: tourId,
      event_type: 'completed',
      duration_seconds: durationSeconds,
    });
  }, [trackEvent]);

  const trackTourDismiss = useCallback((tourId: string, stepIndex: number, durationSeconds: number) => {
    trackEvent({
      tour_id: tourId,
      event_type: 'dismissed',
      step_index: stepIndex,
      duration_seconds: durationSeconds,
    });
  }, [trackEvent]);

  const trackStepView = useCallback((tourId: string, stepId: string, stepIndex: number) => {
    trackEvent({
      tour_id: tourId,
      event_type: 'step_viewed',
      step_id: stepId,
      step_index: stepIndex,
    });
  }, [trackEvent]);

  const getAnalyticsSummary = useCallback(() => {
    const storedEvents = localStorage.getItem('tour_analytics_events');
    if (!storedEvents) return null;

    const events = JSON.parse(storedEvents);
    
    const summary = {
      totalStarts: events.filter((e: any) => e.event_type === 'started').length,
      totalCompletions: events.filter((e: any) => e.event_type === 'completed').length,
      totalDismissals: events.filter((e: any) => e.event_type === 'dismissed').length,
      completionRate: 0,
      avgDuration: 0,
      popularTours: {} as Record<string, number>,
    };

    // Calcular taxa de conclusão
    if (summary.totalStarts > 0) {
      summary.completionRate = (summary.totalCompletions / summary.totalStarts) * 100;
    }

    // Calcular duração média
    const completedEvents = events.filter((e: any) => e.event_type === 'completed');
    if (completedEvents.length > 0) {
      const totalDuration = completedEvents.reduce((sum: number, e: any) => sum + (e.duration_seconds || 0), 0);
      summary.avgDuration = totalDuration / completedEvents.length;
    }

    // Tours mais populares
    events.forEach((e: any) => {
      if (e.event_type === 'started') {
        summary.popularTours[e.tour_id] = (summary.popularTours[e.tour_id] || 0) + 1;
      }
    });

    return summary;
  }, []);

  const clearAnalytics = useCallback(() => {
    localStorage.removeItem('tour_analytics_events');
    sessionStorage.removeItem('tour_session_id');
  }, []);

  return {
    trackTourStart,
    trackTourComplete,
    trackTourDismiss,
    trackStepView,
    getAnalyticsSummary,
    clearAnalytics,
  };
}
