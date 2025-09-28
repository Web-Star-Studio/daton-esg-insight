import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingAnalyticsProps {
  currentStep: number;
  selectedModules: string[];
  companyProfile?: any;
  completionTime?: number;
}

export function OnboardingAnalytics({ 
  currentStep, 
  selectedModules, 
  companyProfile, 
  completionTime 
}: OnboardingAnalyticsProps) {
  const { user } = useAuth();

  useEffect(() => {
    // Track step progression
    trackEvent('onboarding_step_reached', {
      step: currentStep,
      step_name: getStepName(currentStep),
      user_id: user?.id,
      timestamp: new Date().toISOString()
    });
  }, [currentStep, user?.id]);

  useEffect(() => {
    // Track module selections
    if (selectedModules.length > 0) {
      trackEvent('modules_selected', {
        modules: selectedModules,
        module_count: selectedModules.length,
        user_id: user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [selectedModules, user?.id]);

  useEffect(() => {
    // Track company profile completion
    if (companyProfile) {
      trackEvent('company_profile_completed', {
        sector: companyProfile.sector,
        size: companyProfile.size,
        goals: companyProfile.goals,
        maturity_level: companyProfile.maturityLevel,
        user_id: user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [companyProfile, user?.id]);

  const trackEvent = (eventName: string, properties: any) => {
    // In a real implementation, this would send data to your analytics service
    console.log('📊 Onboarding Analytics:', eventName, properties);
    
    // Store in localStorage for offline tracking
    const events = JSON.parse(localStorage.getItem('onboarding_events') || '[]');
    events.push({
      event: eventName,
      properties,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('onboarding_events', JSON.stringify(events));
  };

  const getStepName = (step: number): string => {
    const stepNames = ['welcome', 'profile', 'module_selection', 'shortcuts', 'completion'];
    return stepNames[step] || 'unknown';
  };

  // This component doesn't render anything - it's just for analytics tracking
  return null;
}

// Utility function to get onboarding insights
export const getOnboardingInsights = () => {
  const events = JSON.parse(localStorage.getItem('onboarding_events') || '[]');
  
  return {
    totalEvents: events.length,
    completionRate: calculateCompletionRate(events),
    averageTime: calculateAverageTime(events),
    popularModules: getPopularModules(events),
    dropoffPoints: getDropoffPoints(events)
  };
};

const calculateCompletionRate = (events: any[]) => {
  const startEvents = events.filter(e => e.event === 'onboarding_step_reached' && e.properties.step === 0);
  const completionEvents = events.filter(e => e.event === 'onboarding_completed');
  
  if (startEvents.length === 0) return 0;
  return (completionEvents.length / startEvents.length) * 100;
};

const calculateAverageTime = (events: any[]) => {
  const completionEvents = events.filter(e => e.event === 'onboarding_completed');
  const times = completionEvents.map(e => e.properties.completion_time || 0);
  
  if (times.length === 0) return 0;
  return times.reduce((sum, time) => sum + time, 0) / times.length;
};

const getPopularModules = (events: any[]) => {
  const moduleEvents = events.filter(e => e.event === 'modules_selected');
  const moduleCount: Record<string, number> = {};
  
  moduleEvents.forEach(event => {
    event.properties.modules.forEach((module: string) => {
      moduleCount[module] = (moduleCount[module] || 0) + 1;
    });
  });
  
  return Object.entries(moduleCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
};

const getDropoffPoints = (events: any[]) => {
  const stepEvents = events.filter(e => e.event === 'onboarding_step_reached');
  const stepCount: Record<number, number> = {};
  
  stepEvents.forEach(event => {
    const step = event.properties.step;
    stepCount[step] = (stepCount[step] || 0) + 1;
  });
  
  return stepCount;
};