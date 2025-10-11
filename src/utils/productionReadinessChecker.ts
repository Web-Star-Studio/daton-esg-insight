/**
 * Production Readiness Checker
 * Validates that the application is ready for production deployment
 */

import { PRODUCTION_CONFIG, isProduction } from './productionConfig';

interface ReadinessCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  critical: boolean;
}

export class ProductionReadinessChecker {
  private checks: ReadinessCheck[] = [];

  async runAllChecks(): Promise<{
    isReady: boolean;
    checks: ReadinessCheck[];
    criticalFailures: ReadinessCheck[];
    warnings: ReadinessCheck[];
  }> {
    this.checks = [];

    // Run all checks
    this.checkEnvironmentVariables();
    this.checkSecurityFeatures();
    this.checkPerformanceFeatures();
    this.checkMockDataDisabled();
    await this.checkDatabaseConnection();

    const criticalFailures = this.checks.filter(c => c.status === 'fail' && c.critical);
    const warnings = this.checks.filter(c => c.status === 'warn' || (c.status === 'fail' && !c.critical));
    const isReady = criticalFailures.length === 0;

    return {
      isReady,
      checks: this.checks,
      criticalFailures,
      warnings,
    };
  }

  private checkEnvironmentVariables() {
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
    ];

    const missing = requiredEnvVars.filter(key => {
      const value = import.meta.env[`VITE_${key}`];
      return !value || value === '';
    });

    if (missing.length === 0) {
      this.checks.push({
        name: 'Environment Variables',
        status: 'pass',
        message: 'All required environment variables are set',
        critical: true,
      });
    } else {
      this.checks.push({
        name: 'Environment Variables',
        status: 'fail',
        message: `Missing environment variables: ${missing.join(', ')}`,
        critical: true,
      });
    }
  }

  private checkSecurityFeatures() {
    const securityChecks = [
      PRODUCTION_CONFIG.SECURITY.ENABLE_INPUT_SANITIZATION,
      PRODUCTION_CONFIG.SECURITY.ENABLE_RATE_LIMITING,
    ];

    const allEnabled = securityChecks.every(check => check === true);

    this.checks.push({
      name: 'Security Features',
      status: allEnabled ? 'pass' : 'warn',
      message: allEnabled 
        ? 'All security features are enabled' 
        : 'Some security features are disabled',
      critical: false,
    });
  }

  private checkPerformanceFeatures() {
    const performanceChecks = [
      PRODUCTION_CONFIG.PERFORMANCE.ENABLE_CACHING,
      PRODUCTION_CONFIG.PERFORMANCE.ENABLE_LAZY_LOADING,
      PRODUCTION_CONFIG.PERFORMANCE.ENABLE_MEMORY_OPTIMIZATION,
    ];

    const allEnabled = performanceChecks.every(check => check === true);

    this.checks.push({
      name: 'Performance Features',
      status: allEnabled ? 'pass' : 'warn',
      message: allEnabled 
        ? 'All performance features are enabled' 
        : 'Some performance features are disabled',
      critical: false,
    });
  }

  private checkMockDataDisabled() {
    const mockDataDisabled = PRODUCTION_CONFIG.FEATURES.MOCK_DATA_DISABLED;

    this.checks.push({
      name: 'Mock Data',
      status: mockDataDisabled ? 'pass' : 'warn',
      message: mockDataDisabled 
        ? 'Mock data is disabled' 
        : 'Mock data is still enabled - should be disabled in production',
      critical: isProduction(),
    });
  }

  private async checkDatabaseConnection() {
    try {
      // Basic check - in a real implementation, you'd ping the database
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl && supabaseUrl.includes('supabase.co')) {
        this.checks.push({
          name: 'Database Connection',
          status: 'pass',
          message: 'Database configuration is valid',
          critical: true,
        });
      } else {
        this.checks.push({
          name: 'Database Connection',
          status: 'warn',
          message: 'Database URL may not be configured correctly',
          critical: false,
        });
      }
    } catch (error) {
      this.checks.push({
        name: 'Database Connection',
        status: 'fail',
        message: 'Failed to validate database connection',
        critical: true,
      });
    }
  }

  generateReport(): string {
    const { isReady, criticalFailures, warnings } = this.checks.reduce(
      (acc, check) => {
        if (check.status === 'fail' && check.critical) {
          acc.criticalFailures.push(check);
        } else if (check.status === 'warn' || (check.status === 'fail' && !check.critical)) {
          acc.warnings.push(check);
        }
        return acc;
      },
      { isReady: true, criticalFailures: [] as ReadinessCheck[], warnings: [] as ReadinessCheck[] }
    );

    const isReadyForProduction = criticalFailures.length === 0;

    let report = '# Production Readiness Report\n\n';
    report += `**Status**: ${isReadyForProduction ? '✅ READY' : '❌ NOT READY'}\n\n`;

    if (criticalFailures.length > 0) {
      report += '## Critical Issues\n';
      criticalFailures.forEach(check => {
        report += `- ❌ ${check.name}: ${check.message}\n`;
      });
      report += '\n';
    }

    if (warnings.length > 0) {
      report += '## Warnings\n';
      warnings.forEach(check => {
        report += `- ⚠️ ${check.name}: ${check.message}\n`;
      });
      report += '\n';
    }

    report += '## All Checks\n';
    this.checks.forEach(check => {
      const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
      report += `- ${icon} ${check.name}: ${check.message}\n`;
    });

    return report;
  }
}

export const productionReadinessChecker = new ProductionReadinessChecker();
