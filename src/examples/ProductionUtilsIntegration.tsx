/**
 * Production Utilities Integration Examples
 * 
 * This file demonstrates how to integrate production monitoring,
 * logging, and security utilities into your components.
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { logger } from '@/utils/logger';
import { 
  sanitizeHtml, 
  isValidEmail, 
  rateLimiter,
  containsSqlInjection 
} from '@/utils/securityUtils';
import { toast } from 'sonner';

/**
 * Example 1: Performance Monitoring in Data Loading
 */
export function DataLoadingExample() {
  const loadData = async () => {
    try {
      logger.info('Starting data load operation');
      
      // Track performance with measureAsync
      const data = await performanceMonitor.measureAsync(
        'loadUserData',
        async () => {
          // Simulate API call
          const response = await fetch('/api/users');
          return await response.json();
        }
      );
      
      // Record success metric
      performanceMonitor.recordMetric('api_success', 1);
      logger.info('Data loaded successfully', { recordCount: data?.length || 0 });
      
      return data;
    } catch (error) {
      // Record error metric
      performanceMonitor.recordMetric('api_error', 1);
      logger.error('Failed to load data', error);
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Monitoring Example</CardTitle>
        <CardDescription>Track execution time and success rates</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={loadData}>Load Data with Monitoring</Button>
      </CardContent>
    </Card>
  );
}

/**
 * Example 2: Input Validation and Sanitization
 */
export function SecureFormExample() {
  const handleSubmit = async (formData: { email: string; comment: string; query: string }) => {
    logger.info('Form submission started');
    
    try {
      // Validate email
      if (!isValidEmail(formData.email)) {
        logger.warn('Invalid email format submitted', { email: formData.email });
        toast.error('Email inválido');
        return;
      }

      // Check for SQL injection attempts
      if (containsSqlInjection(formData.query)) {
        logger.error('SQL injection attempt detected', { query: formData.query });
        toast.error('Entrada inválida detectada');
        return;
      }

      // Sanitize HTML content
      const sanitizedComment = sanitizeHtml(formData.comment);
      
      logger.info('Form validated successfully');
      
      // Process the sanitized data
      const result = await submitToAPI({
        email: formData.email,
        comment: sanitizedComment,
        query: formData.query
      });
      
      logger.info('Form submitted successfully', { resultId: result });
      toast.success('Formulário enviado com sucesso');
      
    } catch (error) {
      logger.error('Form submission failed', error);
      toast.error('Erro ao enviar formulário');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Secure Form Example</CardTitle>
        <CardDescription>Input validation and sanitization</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This form demonstrates email validation, SQL injection detection, and HTML sanitization.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Example 3: Rate Limiting for API Calls
 */
export function RateLimitedAPIExample() {
  const makeAPICall = async (userId: string) => {
    const key = `api_call_${userId}`;
    
    // Check rate limit: 5 requests per 60 seconds
    if (rateLimiter.isRateLimited(key, 5, 60000)) {
      logger.warn('Rate limit exceeded', { userId });
      toast.error('Por favor, aguarde antes de tentar novamente');
      return;
    }

    logger.info('API call initiated', { userId });
    
    try {
      const response = await fetch(`/api/data/${userId}`);
      const data = await response.json();
      
      logger.info('API call successful', { userId, dataSize: data?.length || 0 });
      return data;
    } catch (error) {
      logger.error('API call failed', { userId, error });
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Limiting Example</CardTitle>
        <CardDescription>Prevent API abuse with rate limiting</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => makeAPICall('user-123')}>
          Make API Call (5 per minute)
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Example 4: Component Lifecycle Logging
 */
export function ComponentLifecycleExample() {
  useEffect(() => {
    logger.info('Component mounted', { component: 'ComponentLifecycleExample' });
    
    // Track performance
    performanceMonitor.recordMetric('component_mount', 1);
    
    return () => {
      logger.info('Component unmounted', { component: 'ComponentLifecycleExample' });
    };
  }, []);

  const handleAction = async () => {
    try {
      logger.info('User action started');
      
      // Measure async operation
      await performanceMonitor.measureAsync(
        'userAction',
        async () => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      );
      
      performanceMonitor.recordMetric('user_action_success', 1);
      logger.info('User action completed');
      toast.success('Ação concluída');
      
    } catch (error) {
      performanceMonitor.recordMetric('user_action_error', 1);
      logger.error('User action failed', error);
      toast.error('Erro na ação');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Lifecycle Example</CardTitle>
        <CardDescription>Track component lifecycle and user actions</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleAction}>Execute Monitored Action</Button>
      </CardContent>
    </Card>
  );
}

/**
 * Example 5: Web Vitals Monitoring
 */
export function WebVitalsExample() {
  useEffect(() => {
    // Observe Web Vitals (automatically tracked)
    performanceMonitor.observeWebVitals();
    
    logger.info('Web Vitals monitoring initialized');
  }, []);

  const getWebVitals = () => {
    const metrics = performanceMonitor.getAllMetrics();
    const webVitals = metrics.filter(m => 
      m.name.includes('web_vital')
    );
    
    logger.info('Web Vitals retrieved', { 
      count: webVitals.length,
      vitals: webVitals.map(v => ({ name: v.name, value: v.value }))
    });
    
    toast.info(`${webVitals.length} Web Vitals encontrados (verifique o console)`);
  };

  const getMetricStats = () => {
    const lcpStats = performanceMonitor.getMetricStats('web_vital_lcp');
    const fidStats = performanceMonitor.getMetricStats('web_vital_fid');
    const clsStats = performanceMonitor.getMetricStats('web_vital_cls');
    
    logger.info('Web Vitals Statistics', { 
      LCP: lcpStats,
      FID: fidStats,
      CLS: clsStats
    });
    
    toast.info('Estatísticas Web Vitals registradas no console');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Web Vitals Example</CardTitle>
        <CardDescription>Monitor Core Web Vitals performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button onClick={getWebVitals} className="w-full">
          Get Web Vitals
        </Button>
        <Button onClick={getMetricStats} variant="outline" className="w-full">
          Get Metric Statistics
        </Button>
      </CardContent>
    </Card>
  );
}

// Helper function for API submission
async function submitToAPI(data: any): Promise<string> {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random().toString(36).substr(2, 9));
    }, 500);
  });
}
