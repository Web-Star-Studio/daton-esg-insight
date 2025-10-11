/**
 * Health Check Utility
 * Performs system health checks for monitoring and debugging
 */

import { supabase } from '@/integrations/supabase/client';
import { PRODUCTION_CONFIG } from './productionConfig';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthStatus;
    auth: HealthStatus;
    storage: HealthStatus;
    configuration: HealthStatus;
  };
  version: string;
  environment: string;
}

export interface HealthStatus {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  responseTime?: number;
}

export class HealthChecker {
  async runHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    const checks = {
      database: await this.checkDatabase(),
      auth: await this.checkAuth(),
      storage: await this.checkStorage(),
      configuration: this.checkConfiguration(),
    };

    const allPassed = Object.values(checks).every(check => check.status === 'pass');
    const anyFailed = Object.values(checks).some(check => check.status === 'fail');
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (allPassed) {
      status = 'healthy';
    } else if (anyFailed) {
      status = 'unhealthy';
    } else {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
      version: PRODUCTION_CONFIG.VERSION,
      environment: process.env.NODE_ENV || 'development',
    };
  }

  private async checkDatabase(): Promise<HealthStatus> {
    const startTime = Date.now();
    try {
      const { error } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single();

      const responseTime = Date.now() - startTime;

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        return {
          status: 'fail',
          message: 'Database connection failed',
          responseTime,
        };
      }

      return {
        status: 'pass',
        message: 'Database is accessible',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Database health check failed',
        responseTime: Date.now() - startTime,
      };
    }
  }

  private async checkAuth(): Promise<HealthStatus> {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.auth.getSession();
      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'warn',
          message: 'Auth check returned error',
          responseTime,
        };
      }

      return {
        status: 'pass',
        message: data.session ? 'User authenticated' : 'Auth system available',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Auth system unavailable',
        responseTime: Date.now() - startTime,
      };
    }
  }

  private async checkStorage(): Promise<HealthStatus> {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.storage.listBuckets();
      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'warn',
          message: 'Storage check returned error',
          responseTime,
        };
      }

      return {
        status: 'pass',
        message: `Storage accessible (${data?.length || 0} buckets)`,
        responseTime,
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Storage system unavailable',
        responseTime: Date.now() - startTime,
      };
    }
  }

  private checkConfiguration(): HealthStatus {
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
    ];

    const missing = requiredEnvVars.filter(key => {
      const value = import.meta.env[key];
      return !value || value === '';
    });

    if (missing.length > 0) {
      return {
        status: 'fail',
        message: `Missing environment variables: ${missing.join(', ')}`,
      };
    }

    return {
      status: 'pass',
      message: 'All required configuration present',
    };
  }

  /**
   * Generate a simple health check report
   */
  generateReport(result: HealthCheckResult): string {
    let report = `# System Health Check Report\n\n`;
    report += `**Overall Status**: ${result.status.toUpperCase()}\n`;
    report += `**Timestamp**: ${result.timestamp}\n`;
    report += `**Version**: ${result.version}\n`;
    report += `**Environment**: ${result.environment}\n\n`;

    report += `## Checks\n\n`;
    
    Object.entries(result.checks).forEach(([name, check]) => {
      const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
      report += `${icon} **${name}**: ${check.message}`;
      if (check.responseTime) {
        report += ` (${check.responseTime}ms)`;
      }
      report += `\n`;
    });

    return report;
  }
}

export const healthChecker = new HealthChecker();
