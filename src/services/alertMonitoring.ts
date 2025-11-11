import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AlertThreshold {
  type: 'water' | 'energy' | 'emissions' | 'waste';
  value: number;
  average: number;
  percentage: number;
  date: string;
}

export class AlertMonitoringService {
  private static THRESHOLD_PERCENTAGE = 20; // Alert if 20% above average

  static async checkWaterConsumption(companyId: string): Promise<AlertThreshold | null> {
    try {
      // Get last 6 months of data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from('water_consumption_data')
        .select('withdrawal_volume_m3, period_start_date')
        .eq('company_id', companyId)
        .gte('period_start_date', sixMonthsAgo.toISOString())
        .order('period_start_date', { ascending: false });

      if (error || !data || data.length < 2) return null;

      const latest = data[0];
      const historical = data.slice(1);
      
      const average = historical.reduce((sum, item) => sum + item.withdrawal_volume_m3, 0) / historical.length;
      const percentage = ((latest.withdrawal_volume_m3 - average) / average) * 100;

      if (percentage > this.THRESHOLD_PERCENTAGE) {
        return {
          type: 'water',
          value: latest.withdrawal_volume_m3,
          average,
          percentage,
          date: latest.period_start_date
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking water consumption:', error);
      return null;
    }
  }

  static async checkEnergyConsumption(companyId: string): Promise<AlertThreshold | null> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from('energy_consumption_data')
        .select('consumption_value, period_start_date')
        .eq('company_id', companyId)
        .gte('period_start_date', sixMonthsAgo.toISOString())
        .order('period_start_date', { ascending: false });

      if (error || !data || data.length < 2) return null;

      const latest = data[0];
      const historical = data.slice(1);
      
      const average = historical.reduce((sum, item) => sum + item.consumption_value, 0) / historical.length;
      const percentage = ((latest.consumption_value - average) / average) * 100;

      if (percentage > this.THRESHOLD_PERCENTAGE) {
        return {
          type: 'energy',
          value: latest.consumption_value,
          average,
          percentage,
          date: latest.period_start_date
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking energy consumption:', error);
      return null;
    }
  }

  static async checkEmissions(companyId: string): Promise<AlertThreshold | null> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Note: calculated_emissions doesn't have company_id, need to join with activity_data
      const { data, error } = await supabase
        .from('calculated_emissions')
        .select('total_co2e, calculation_date, activity_data!inner(emission_source:emission_sources!inner(company_id))')
        .gte('calculation_date', sixMonthsAgo.toISOString())
        .order('calculation_date', { ascending: false });

      if (error || !data || data.length < 2) return null;

      // Filter by company_id from the joined data
      const companyData = data.filter((item: any) => 
        item.activity_data?.emission_source?.company_id === companyId
      );

      if (companyData.length < 2) return null;

      const latest = companyData[0];
      const historical = companyData.slice(1);
      
      const average = historical.reduce((sum: number, item: any) => sum + (item.total_co2e || 0), 0) / historical.length;
      const latestValue = latest.total_co2e || 0;
      const percentage = ((latestValue - average) / average) * 100;

      if (percentage > this.THRESHOLD_PERCENTAGE) {
        return {
          type: 'emissions',
          value: latestValue,
          average,
          percentage,
          date: latest.calculation_date
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking emissions:', error);
      return null;
    }
  }

  static async checkAllAlerts(companyId: string): Promise<AlertThreshold[]> {
    const alerts: AlertThreshold[] = [];

    const [water, energy, emissions] = await Promise.all([
      this.checkWaterConsumption(companyId),
      this.checkEnergyConsumption(companyId),
      this.checkEmissions(companyId)
    ]);

    if (water) alerts.push(water);
    if (energy) alerts.push(energy);
    if (emissions) alerts.push(emissions);

    return alerts;
  }

  static formatAlertMessage(alert: AlertThreshold): string {
    const typeLabels = {
      water: 'Consumo de Água',
      energy: 'Consumo de Energia',
      emissions: 'Emissões de GEE',
      waste: 'Geração de Resíduos'
    };

    const recommendations = {
      water: 'Verifique vazamentos, revise processos de uso intensivo de água.',
      energy: 'Analise equipamentos de alto consumo, considere otimização energética.',
      emissions: 'Revise atividades de alta emissão, considere compensação de carbono.',
      waste: 'Revise processos de geração, implemente práticas de redução.'
    };

    return `⚠️ ${typeLabels[alert.type]} ${alert.percentage.toFixed(1)}% acima da média!\n\nValor atual: ${alert.value.toFixed(2)}\nMédia histórica: ${alert.average.toFixed(2)}\n\n💡 Recomendação: ${recommendations[alert.type]}`;
  }

  static showAlert(alert: AlertThreshold) {
    toast.error(this.formatAlertMessage(alert), {
      duration: 8000,
      action: {
        label: 'Ver Detalhes',
        onClick: () => {
          // Navigate to relevant monitoring page
          const routes = {
            water: '/agua',
            energy: '/energia',
            emissions: '/emissoes',
            waste: '/residuos'
          };
          window.location.href = routes[alert.type];
        }
      }
    });
  }
}
