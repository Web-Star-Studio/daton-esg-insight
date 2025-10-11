# Production Utilities - Usage Examples

This document provides examples of how to use the production utilities in the Daton ESG Management System.

## Performance Monitor

### Basic Usage

```typescript
import { performanceMonitor } from '@/utils/performanceMonitor';

// Measure async operations
async function fetchData() {
  return await performanceMonitor.measureAsync(
    'fetch_emissions_data',
    async () => {
      const { data } = await supabase
        .from('calculated_emissions')
        .select('*')
        .limit(100);
      return data;
    },
    { source: 'emissions_page' }
  );
}

// Measure synchronous operations
function processData(data: any[]) {
  return performanceMonitor.measure(
    'process_emissions',
    () => {
      return data.map(item => ({
        ...item,
        formatted: formatEmissionData(item)
      }));
    },
    { dataSize: data.length }
  );
}

// Get performance statistics
const stats = performanceMonitor.getMetricStats('fetch_emissions_data');
console.log(`Average fetch time: ${stats?.average}ms`);
console.log(`P95: ${stats?.p95}ms`);
```

### Web Vitals Monitoring

Web Vitals are automatically observed when the app loads. Metrics include:
- **LCP** (Largest Contentful Paint) - Loading performance
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability

```typescript
// Check recent web vitals
const recentMetrics = performanceMonitor.getAllMetrics()
  .filter(m => m.name.startsWith('web_vital_'));

console.log('Web Vitals:', recentMetrics);
```

## Security Utilities

### Input Validation

```typescript
import { 
  isValidEmail, 
  isValidCNPJ, 
  isValidCPF,
  sanitizeString,
  sanitizeHtml,
  isValidFileType,
  isValidFileSize
} from '@/utils/securityUtils';

// Email validation
if (!isValidEmail(email)) {
  toast.error('Email inválido');
  return;
}

// CNPJ/CPF validation
if (!isValidCNPJ(company.cnpj)) {
  toast.error('CNPJ inválido');
  return;
}

if (!isValidCPF(employee.cpf)) {
  toast.error('CPF inválido');
  return;
}

// Sanitize user input
const cleanName = sanitizeString(userInput);
const cleanHtml = sanitizeHtml(richTextContent);

// File validation
const allowedTypes = ['pdf', 'docx', 'xlsx'];
if (!isValidFileType(file.name, allowedTypes)) {
  toast.error('Tipo de arquivo não permitido');
  return;
}

if (!isValidFileSize(file.size, 10)) { // 10MB limit
  toast.error('Arquivo muito grande (máximo 10MB)');
  return;
}
```

### Rate Limiting

```typescript
import { rateLimiter } from '@/utils/securityUtils';

// Limit API calls
async function sendNotification(userId: string) {
  const key = `notification_${userId}`;
  const maxAttempts = 5;
  const windowMs = 60000; // 1 minute
  
  if (rateLimiter.isRateLimited(key, maxAttempts, windowMs)) {
    toast.error('Muitas tentativas. Aguarde um momento.');
    return;
  }
  
  // Proceed with notification
  await sendEmail(userId);
}
```

### SQL Injection Detection

```typescript
import { containsSqlInjection } from '@/utils/securityUtils';

function handleSearch(query: string) {
  if (containsSqlInjection(query)) {
    logger.warn('SQL injection attempt detected', { query });
    toast.error('Consulta inválida');
    return;
  }
  
  // Safe to proceed
  performSearch(query);
}
```

## Logger

### Basic Logging

```typescript
import { logger } from '@/utils/logger';

// Different log levels
logger.debug('Debugging information', { userId, action: 'view' });
logger.info('User logged in', { userId });
logger.warn('API response slow', { endpoint: '/api/data', responseTime: 3500 });
logger.error('Failed to save data', error);
```

### Log Management

```typescript
// Get recent logs (useful for debugging)
const recentLogs = logger.getRecentLogs(50);

// Get only errors
const errors = logger.getLogsByLevel('error');

// Export logs for analysis
const logsJson = logger.exportLogs();
const blob = new Blob([logsJson], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// Download or send to support

// Clear logs
logger.clearLogs();
```

### Production Error Handling

```typescript
import { logger } from '@/utils/logger';
import errorHandler from '@/utils/errorHandler';

async function saveEmissionData(data: EmissionData) {
  try {
    const result = await supabase
      .from('calculated_emissions')
      .insert(data);
    
    if (result.error) throw result.error;
    
    logger.info('Emission data saved successfully', { 
      dataId: result.data.id 
    });
    
    return result.data;
  } catch (error) {
    logger.error('Failed to save emission data', error);
    errorHandler.showUserError(error, {
      component: 'EmissionsForm',
      function: 'saveEmissionData'
    });
    throw error;
  }
}
```

## Combined Usage Example

Here's a complete example combining all utilities:

```typescript
import { performanceMonitor } from '@/utils/performanceMonitor';
import { isValidEmail, sanitizeString } from '@/utils/securityUtils';
import { logger } from '@/utils/logger';
import errorHandler from '@/utils/errorHandler';

async function submitCompanyForm(formData: any) {
  return await performanceMonitor.measureAsync(
    'submit_company_form',
    async () => {
      try {
        // Validate inputs
        if (!isValidEmail(formData.email)) {
          throw new Error('Email inválido');
        }
        
        // Sanitize data
        const cleanData = {
          name: sanitizeString(formData.name),
          email: formData.email.trim().toLowerCase(),
          cnpj: formData.cnpj.replace(/[^\d]/g, '')
        };
        
        logger.info('Submitting company form', { 
          companyName: cleanData.name 
        });
        
        // Save to database
        const { data, error } = await supabase
          .from('companies')
          .insert(cleanData)
          .select()
          .single();
        
        if (error) throw error;
        
        logger.info('Company created successfully', { 
          companyId: data.id 
        });
        
        toast.success('Empresa cadastrada com sucesso!');
        return data;
        
      } catch (error) {
        logger.error('Failed to submit company form', error);
        errorHandler.showUserError(error, {
          component: 'CompanyForm',
          function: 'submitCompanyForm'
        });
        throw error;
      }
    },
    { formType: 'company_registration' }
  );
}
```

## Best Practices

1. **Performance Monitoring**
   - Use `measureAsync` for all database operations
   - Monitor critical user journeys
   - Check P95 metrics regularly
   - Set up alerts for slow operations (>1000ms)

2. **Security**
   - Always validate user inputs
   - Sanitize before displaying user content
   - Use rate limiting for sensitive operations
   - Log security-related events

3. **Logging**
   - Use appropriate log levels
   - Include context in log messages
   - Never log sensitive data (passwords, tokens)
   - Export logs regularly for analysis

4. **Error Handling**
   - Combine logger with errorHandler
   - Provide user-friendly messages
   - Log technical details for debugging
   - Track error frequency and patterns

## Configuration

All utilities respect the production configuration in `productionConfig.ts`:

- **Logging Level**: Controlled by `LOGGING.LEVEL`
- **Security Features**: Enable/disable via `SECURITY` flags
- **Performance Monitoring**: Controlled by `PERFORMANCE` flags

In production, only errors are logged to console by default, but all events are still tracked internally for monitoring and debugging purposes.
