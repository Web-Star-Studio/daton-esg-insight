# Production Monitoring & Utilities Guide

This guide explains how to use the production monitoring system, logging utilities, and security features in the Daton ESG Management System.

## Overview

The production monitoring system provides:
- **Performance Monitoring**: Track function execution times, Web Vitals, and custom metrics
- **Logging System**: Structured logging with levels, in-memory storage, and export capabilities
- **Security Utilities**: Input validation, sanitization, rate limiting, and SQL injection detection
- **Health Monitoring**: Real-time system health checks and production readiness assessments

## Table of Contents

1. [Performance Monitoring](#performance-monitoring)
2. [Logging System](#logging-system)
3. [Security Utilities](#security-utilities)
4. [Production Monitoring Dashboard](#production-monitoring-dashboard)
5. [Best Practices](#best-practices)

---

## Performance Monitoring

### Basic Usage

```typescript
import { performanceMonitor } from '@/utils/performanceMonitor';

// Measure async function execution
const data = await performanceMonitor.measureAsync(
  'loadUserData',
  async () => {
    const response = await fetch('/api/users');
    return response.json();
  }
);

// Measure sync function execution
const result = performanceMonitor.measure(
  'calculateTotal',
  () => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }
);

// Record custom metrics
performanceMonitor.recordMetric('api_call_success', 1);
performanceMonitor.recordMetric('api_response_time', 250);
```

### Web Vitals Monitoring

Web Vitals are automatically monitored when the app loads:

```typescript
// Observe Web Vitals manually
performanceMonitor.observeWebVitals();

// Get statistics for a specific metric
const lcpStats = performanceMonitor.getMetricStats('web_vital_lcp');
// Returns: { count, average, min, max, p95 }
```

### Metric Statistics

```typescript
// Get all metrics
const allMetrics = performanceMonitor.getAllMetrics();

// Get statistics for a specific metric
const stats = performanceMonitor.getMetricStats('api_response_time');
console.log(`Average: ${stats.average}ms, P95: ${stats.p95}ms`);

// Clear metrics
performanceMonitor.clearMetrics();
```

---

## Logging System

### Log Levels

```typescript
import { logger } from '@/utils/logger';

// Info - General information
logger.info('User logged in', { userId: '123' });

// Warning - Potential issues
logger.warn('API response slow', { responseTime: 3000 });

// Error - Error conditions
logger.error('Failed to save data', new Error('Network timeout'));

// Debug - Detailed debugging info (only in development)
logger.debug('Request payload', { payload: data });
```

### Retrieving Logs

```typescript
// Get recent logs (last 100 by default)
const recentLogs = logger.getRecentLogs();

// Get specific number of logs
const last50Logs = logger.getRecentLogs(50);

// Get logs by level
const errorLogs = logger.getLogsByLevel('error');
const warningLogs = logger.getLogsByLevel('warn');

// Clear all logs
logger.clearLogs();

// Export logs as JSON string
const logsJson = logger.exportLogs();
```

### Structured Logging

```typescript
// Always include relevant context
logger.info('Order processed', {
  orderId: order.id,
  customerId: customer.id,
  total: order.total,
  duration: processingTime
});

// For errors, include error objects
try {
  await processOrder(order);
} catch (error) {
  logger.error('Order processing failed', error, {
    orderId: order.id,
    step: 'payment'
  });
}
```

---

## Security Utilities

### Input Validation

```typescript
import { 
  isValidEmail,
  isValidCNPJ,
  isValidCPF,
  isValidUrl,
  isValidFileType,
  isValidFileSize
} from '@/utils/securityUtils';

// Email validation
if (!isValidEmail(email)) {
  toast.error('Email inválido');
  return;
}

// CNPJ/CPF validation
if (!isValidCNPJ(cnpj)) {
  toast.error('CNPJ inválido');
  return;
}

// File validation
if (!isValidFileType(fileName, ['pdf', 'xlsx', 'csv'])) {
  toast.error('Tipo de arquivo não permitido');
  return;
}

if (!isValidFileSize(file.size, 10)) { // 10MB max
  toast.error('Arquivo muito grande');
  return;
}

// URL validation
if (!isValidUrl(website)) {
  toast.error('URL inválida');
  return;
}
```

### Input Sanitization

```typescript
import { 
  sanitizeHtml,
  sanitizeString,
  containsSqlInjection
} from '@/utils/securityUtils';

// Sanitize HTML content
const safeHtml = sanitizeHtml(userInput);
// Removes <script>, <iframe>, onclick, etc.

// Sanitize string input
const safeString = sanitizeString(userInput);
// Removes HTML tags and unsafe characters

// Check for SQL injection
if (containsSqlInjection(searchQuery)) {
  logger.error('SQL injection attempt detected', { query: searchQuery });
  toast.error('Entrada inválida');
  return;
}
```

### Rate Limiting

```typescript
import { rateLimiter } from '@/utils/securityUtils';

// Check if action is rate limited
const isLimited = rateLimiter.isRateLimited(
  `api_call_${userId}`,  // Unique key
  5,                      // Max 5 attempts
  60000                   // Per 60 seconds
);

if (isLimited) {
  toast.error('Muitas tentativas. Aguarde um momento.');
  return;
}

// Clear rate limit for a key
rateLimiter.clear(`api_call_${userId}`);
```

### Data Masking

```typescript
import { maskSensitiveData, generateSecureId } from '@/utils/securityUtils';

// Mask sensitive data for logging
const maskedCard = maskSensitiveData('1234567890123456', 4);
// Returns: "************3456"

logger.info('Payment processed', {
  cardNumber: maskedCard,
  amount: 100.00
});

// Generate secure random IDs
const secureId = generateSecureId(16);
// Returns: random 16-character string
```

---

## Production Monitoring Dashboard

### Accessing the Dashboard

Navigate to `/production-monitoring` to access the full monitoring dashboard with three tabs:

#### 1. System Status Tab
- Production readiness checks
- Feature flags status
- Health check results
- System configuration info

#### 2. Logs Tab
- Real-time log viewer
- Filter by log level (info, warn, error)
- Auto-refresh every 5 seconds
- Clear and export capabilities

#### 3. Performance Tab
- Web Vitals metrics (LCP, FID, CLS)
- Custom performance metrics
- Statistics (average, min, max, P95)
- Visual performance indicators

### Production Health Widget

The dashboard includes a health widget that shows:
- Overall system health score (0-100)
- Health status (Healthy, Warning, Critical)
- Detected issues
- Quick link to detailed monitoring

The widget is also displayed on the main dashboard for quick access.

---

## Best Practices

### Performance Monitoring

✅ **DO:**
- Measure critical operations (API calls, data processing)
- Record business metrics (user actions, conversions)
- Monitor Web Vitals for user experience
- Use descriptive metric names

❌ **DON'T:**
- Measure every tiny function (adds overhead)
- Record sensitive data in metrics
- Ignore performance warnings in development

```typescript
// ✅ Good
await performanceMonitor.measureAsync('checkout_process', async () => {
  return await processCheckout(cart);
});

// ❌ Bad
performanceMonitor.measure('add', () => a + b);
```

### Logging

✅ **DO:**
- Use appropriate log levels
- Include relevant context
- Log errors with stack traces
- Use structured logging

❌ **DON'T:**
- Log sensitive data (passwords, tokens)
- Log excessively in production
- Use console.log (use logger instead)

```typescript
// ✅ Good
logger.info('User action', { action: 'submit_form', userId: user.id });
logger.error('Save failed', error, { resource: 'order', id: orderId });

// ❌ Bad
console.log('something happened');
logger.info(password); // Never log sensitive data
```

### Security

✅ **DO:**
- Validate all user inputs
- Sanitize HTML content
- Use rate limiting for APIs
- Check for SQL injection patterns
- Mask sensitive data in logs

❌ **DON'T:**
- Trust user input
- Skip validation on client side
- Expose sensitive data in logs
- Allow unlimited API calls

```typescript
// ✅ Good
if (!isValidEmail(email)) {
  return toast.error('Email inválido');
}
const safeComment = sanitizeHtml(comment);
if (rateLimiter.isRateLimited(key, 5, 60000)) {
  return toast.error('Aguarde antes de tentar novamente');
}

// ❌ Bad
await api.post('/users', { email }); // No validation
div.innerHTML = userComment; // No sanitization
```

### Component Integration

```typescript
import { useEffect } from 'react';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { logger } from '@/utils/logger';

export function MyComponent() {
  useEffect(() => {
    logger.info('Component mounted', { component: 'MyComponent' });
    performanceMonitor.recordMetric('component_mount', 1);
    
    return () => {
      logger.info('Component unmounted', { component: 'MyComponent' });
    };
  }, []);

  const handleAction = async () => {
    try {
      const result = await performanceMonitor.measureAsync(
        'my_action',
        async () => {
          return await performAction();
        }
      );
      
      logger.info('Action completed', { result });
      toast.success('Sucesso!');
    } catch (error) {
      logger.error('Action failed', error);
      toast.error('Erro ao executar ação');
    }
  };

  return (
    <Button onClick={handleAction}>Execute Action</Button>
  );
}
```

---

## Configuration

Production monitoring can be configured in `src/utils/productionConfig.ts`:

```typescript
export const PRODUCTION_CONFIG = {
  // Logging Configuration
  LOGGING: {
    LEVEL: 'error', // 'debug' | 'info' | 'warn' | 'error'
    ENABLE_CONSOLE_LOGS: false,
    ENABLE_ERROR_REPORTING: true,
  },
  
  // Performance Configuration
  PERFORMANCE: {
    ENABLE_CACHING: true,
    ENABLE_MEMORY_OPTIMIZATION: true,
  },
  
  // Security Configuration
  SECURITY: {
    ENABLE_RATE_LIMITING: true,
    ENABLE_INPUT_SANITIZATION: true,
  }
};
```

---

## Integration Examples

See `src/examples/ProductionUtilsIntegration.tsx` for complete working examples of:
- Performance monitoring in data loading
- Input validation and sanitization
- Rate limiting for API calls
- Component lifecycle logging
- Web Vitals monitoring

---

## Support

For questions or issues with production monitoring:
1. Check this documentation
2. Review the examples in `src/examples/`
3. Check the Production Monitoring dashboard for system health
4. Review logs in the Logs tab for debugging

---

**Last Updated:** 2025-10-11
