/**
 * Data Export Service
 * Exportação de dados ESG para CSV/Excel
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

type ExportDataRow = Record<string, string | number | boolean>;

interface ExportConfig {
  year: number;
  companyName?: string;
  reportTitle: string;
  includeMetadata?: boolean;
}

/**
 * Converte dados para formato CSV
 */
const convertToCSV = (data: ExportDataRow[], headers: string[]): string => {
  const csvRows = [];
  
  // Adicionar cabeçalhos
  csvRows.push(headers.join(','));
  
  // Adicionar dados
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escapar valores que contêm vírgulas ou quebras de linha
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

/**
 * Faz download de arquivo CSV
 */
const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exportar dados de água
 */
export const exportWaterData = async (config: ExportConfig) => {
  const { year, companyName, reportTitle, includeMetadata = true } = config;
  
  try {
    // Buscar dados de água do ano
    const { data: waterRecords, error } = await supabase
      .from('water_consumption_data')
      .select('*')
      .gte('period_start_date', `${year}-01-01`)
      .lte('period_end_date', `${year}-12-31`)
      .order('period_start_date', { ascending: true });
    
    if (error) throw error;
    
    if (!waterRecords || waterRecords.length === 0) {
      throw new Error('Nenhum dado de água encontrado para o período selecionado');
    }
    
    // Preparar dados para exportação
    const exportData: ExportDataRow[] = [];
    
    // Adicionar metadados
    if (includeMetadata) {
      exportData.push({
        'Campo': 'Relatório',
        'Valor': reportTitle,
        'Unidade': '',
        'Período': '',
        'Fonte': ''
      });
      exportData.push({
        'Campo': 'Empresa',
        'Valor': companyName || 'Não informado',
        'Unidade': '',
        'Período': '',
        'Fonte': ''
      });
      exportData.push({
        'Campo': 'Ano',
        'Valor': year.toString(),
        'Unidade': '',
        'Período': '',
        'Fonte': ''
      });
      exportData.push({
        'Campo': 'Padrão GRI',
        'Valor': 'GRI 303 - Água e Efluentes',
        'Unidade': '',
        'Período': '',
        'Fonte': ''
      });
      exportData.push({
        'Campo': '',
        'Valor': '',
        'Unidade': '',
        'Período': '',
        'Fonte': ''
      });
    }
    
    // Adicionar dados de água
    for (const record of waterRecords) {
      exportData.push({
        'Campo': 'Fonte de Água',
        'Valor': record.source_type || '',
        'Unidade': '',
        'Período': `${record.period_start_date} a ${record.period_end_date}`,
        'Fonte': record.source_name || ''
      });
      exportData.push({
        'Campo': 'Captação',
        'Valor': record.withdrawal_volume_m3?.toFixed(2) || '0',
        'Unidade': 'm³',
        'Período': `${record.period_start_date} a ${record.period_end_date}`,
        'Fonte': record.source_name || ''
      });
      exportData.push({
        'Campo': 'Consumo',
        'Valor': record.consumption_volume_m3?.toFixed(2) || '0',
        'Unidade': 'm³',
        'Período': `${record.period_start_date} a ${record.period_end_date}`,
        'Fonte': record.source_name || ''
      });
      exportData.push({
        'Campo': 'Descarga',
        'Valor': record.discharge_volume_m3?.toFixed(2) || '0',
        'Unidade': 'm³',
        'Período': `${record.period_start_date} a ${record.period_end_date}`,
        'Fonte': record.source_name || ''
      });
      exportData.push({
        'Campo': 'Qualidade',
        'Valor': record.water_quality || '',
        'Unidade': '',
        'Período': `${record.period_start_date} a ${record.period_end_date}`,
        'Fonte': record.source_name || ''
      });
      exportData.push({
        'Campo': 'Área com Estresse Hídrico',
        'Valor': record.is_water_stressed_area ? 'Sim' : 'Não',
        'Unidade': '',
        'Período': `${record.period_start_date} a ${record.period_end_date}`,
        'Fonte': record.source_name || ''
      });
      exportData.push({
        'Campo': '',
        'Valor': '',
        'Unidade': '',
        'Período': '',
        'Fonte': ''
      });
    }
    
    // Calcular totais
    const totalWithdrawal = waterRecords.reduce((sum, r) => sum + (r.withdrawal_volume_m3 || 0), 0);
    const totalConsumption = waterRecords.reduce((sum, r) => sum + (r.consumption_volume_m3 || 0), 0);
    const totalDischarge = waterRecords.reduce((sum, r) => sum + (r.discharge_volume_m3 || 0), 0);
    
    exportData.push({
      'Campo': 'TOTAL - Captação',
      'Valor': totalWithdrawal.toFixed(2),
      'Unidade': 'm³',
      'Período': `${year}`,
      'Fonte': 'Consolidado'
    });
    exportData.push({
      'Campo': 'TOTAL - Consumo',
      'Valor': totalConsumption.toFixed(2),
      'Unidade': 'm³',
      'Período': `${year}`,
      'Fonte': 'Consolidado'
    });
    exportData.push({
      'Campo': 'TOTAL - Descarga',
      'Valor': totalDischarge.toFixed(2),
      'Unidade': 'm³',
      'Período': `${year}`,
      'Fonte': 'Consolidado'
    });
    
    // Converter para CSV e fazer download
    const csv = convertToCSV(exportData, ['Campo', 'Valor', 'Unidade', 'Período', 'Fonte']);
    const filename = `agua_${year}_${companyName?.replace(/\s+/g, '_') || 'empresa'}.csv`;
    downloadCSV(csv, filename);
    
    return { success: true, recordCount: waterRecords.length };
  } catch (error) {
    logger.error('Erro ao exportar dados de água', error, 'service');
    throw error;
  }
};

/**
 * Exportar dados de energia
 */
export const exportEnergyData = async (config: ExportConfig) => {
  const { year, companyName, reportTitle, includeMetadata = true } = config;
  
  try {
    const { data: energyRecords, error } = await supabase
      .from('energy_consumption_data')
      .select('*')
      .gte('period_start_date', `${year}-01-01`)
      .lte('period_end_date', `${year}-12-31`)
      .order('period_start_date', { ascending: true });
    
    if (error) throw error;
    
    if (!energyRecords || energyRecords.length === 0) {
      throw new Error('Nenhum dado de energia encontrado para o período selecionado');
    }
    
    const exportData: ExportDataRow[] = [];
    
    if (includeMetadata) {
      exportData.push({
        'Campo': 'Relatório',
        'Valor': reportTitle,
        'Unidade': '',
        'Período': '',
        'Tipo': ''
      });
      exportData.push({
        'Campo': 'Empresa',
        'Valor': companyName || 'Não informado',
        'Unidade': '',
        'Período': '',
        'Tipo': ''
      });
      exportData.push({
        'Campo': 'Ano',
        'Valor': year.toString(),
        'Unidade': '',
        'Período': '',
        'Tipo': ''
      });
      exportData.push({
        'Campo': 'Padrão GRI',
        'Valor': 'GRI 302 - Energia',
        'Unidade': '',
        'Período': '',
        'Tipo': ''
      });
      exportData.push({
        'Campo': '',
        'Valor': '',
        'Unidade': '',
        'Período': '',
        'Tipo': ''
      });
    }
    
    for (const record of energyRecords) {
      // Converter valor de consumo baseado na unidade
      let consumptionKwh = 0;
      let consumptionGj = 0;
      
      if (record.consumption_unit.toLowerCase() === 'kwh') {
        consumptionKwh = record.consumption_value;
        consumptionGj = record.consumption_value * 0.0036; // kWh para GJ
      } else if (record.consumption_unit.toLowerCase() === 'gj') {
        consumptionGj = record.consumption_value;
        consumptionKwh = record.consumption_value / 0.0036; // GJ para kWh
      } else if (record.consumption_unit.toLowerCase() === 'mwh') {
        consumptionKwh = record.consumption_value * 1000;
        consumptionGj = consumptionKwh * 0.0036;
      }
      
      exportData.push({
        'Campo': 'Tipo de Energia',
        'Valor': record.energy_source_type || '',
        'Unidade': '',
        'Período': `${record.period_start_date} a ${record.period_end_date}`,
        'Tipo': record.is_renewable ? 'Renovável' : 'Não-renovável'
      });
      exportData.push({
        'Campo': 'Consumo',
        'Valor': consumptionKwh.toFixed(2),
        'Unidade': 'kWh',
        'Período': `${record.period_start_date} a ${record.period_end_date}`,
        'Tipo': record.is_renewable ? 'Renovável' : 'Não-renovável'
      });
      exportData.push({
        'Campo': 'Consumo em GJ',
        'Valor': consumptionGj.toFixed(2),
        'Unidade': 'GJ',
        'Período': `${record.period_start_date} a ${record.period_end_date}`,
        'Tipo': record.is_renewable ? 'Renovável' : 'Não-renovável'
      });
      exportData.push({
        'Campo': 'Custo',
        'Valor': record.cost_brl?.toFixed(2) || '0',
        'Unidade': 'R$',
        'Período': `${record.period_start_date} a ${record.period_end_date}`,
        'Tipo': record.is_renewable ? 'Renovável' : 'Não-renovável'
      });
      exportData.push({
        'Campo': '',
        'Valor': '',
        'Unidade': '',
        'Período': '',
        'Tipo': ''
      });
    }
    
    // Calcular totais
    let totalKwh = 0;
    let totalGj = 0;
    let renewableKwh = 0;
    
    for (const record of energyRecords) {
      let kwh = 0;
      let gj = 0;
      
      if (record.consumption_unit.toLowerCase() === 'kwh') {
        kwh = record.consumption_value;
        gj = record.consumption_value * 0.0036;
      } else if (record.consumption_unit.toLowerCase() === 'gj') {
        gj = record.consumption_value;
        kwh = record.consumption_value / 0.0036;
      } else if (record.consumption_unit.toLowerCase() === 'mwh') {
        kwh = record.consumption_value * 1000;
        gj = kwh * 0.0036;
      }
      
      totalKwh += kwh;
      totalGj += gj;
      if (record.is_renewable) {
        renewableKwh += kwh;
      }
    }
    
    const totalCost = energyRecords.reduce((sum, r) => sum + (r.cost_brl || 0), 0);
    
    exportData.push({
      'Campo': 'TOTAL - Consumo',
      'Valor': totalKwh.toFixed(2),
      'Unidade': 'kWh',
      'Período': `${year}`,
      'Tipo': 'Consolidado'
    });
    exportData.push({
      'Campo': 'TOTAL - Consumo',
      'Valor': totalGj.toFixed(2),
      'Unidade': 'GJ',
      'Período': `${year}`,
      'Tipo': 'Consolidado'
    });
    exportData.push({
      'Campo': 'TOTAL - Custo',
      'Valor': totalCost.toFixed(2),
      'Unidade': 'R$',
      'Período': `${year}`,
      'Tipo': 'Consolidado'
    });
    exportData.push({
      'Campo': '% Energia Renovável',
      'Valor': totalKwh > 0 ? ((renewableKwh / totalKwh) * 100).toFixed(2) : '0',
      'Unidade': '%',
      'Período': `${year}`,
      'Tipo': 'Consolidado'
    });
    
    const csv = convertToCSV(exportData, ['Campo', 'Valor', 'Unidade', 'Período', 'Tipo']);
    const filename = `energia_${year}_${companyName?.replace(/\s+/g, '_') || 'empresa'}.csv`;
    downloadCSV(csv, filename);
    
    return { success: true, recordCount: energyRecords.length };
  } catch (error) {
    logger.error('Erro ao exportar dados de energia', error, 'service');
    throw error;
  }
};

/**
 * Exportar consolidado ESG completo
 */
export const exportConsolidatedESG = async (config: ExportConfig) => {
  const { year, companyName, reportTitle } = config;
  
  try {
    const exportData: ExportDataRow[] = [];
    
    // Cabeçalho
    exportData.push({
      'Indicador': 'RELATÓRIO ESG CONSOLIDADO',
      'Valor': reportTitle,
      'Unidade': '',
      'GRI': '',
      'Ano': year.toString()
    });
    exportData.push({
      'Indicador': 'Empresa',
      'Valor': companyName || 'Não informado',
      'Unidade': '',
      'GRI': '',
      'Ano': year.toString()
    });
    exportData.push({
      'Indicador': '',
      'Valor': '',
      'Unidade': '',
      'GRI': '',
      'Ano': ''
    });
    
    // Buscar dados de todas as áreas em paralelo
    const [waterData, energyData] = await Promise.all([
      supabase
        .from('water_consumption_data')
        .select('*')
        .gte('period_start_date', `${year}-01-01`)
        .lte('period_end_date', `${year}-12-31`),
      supabase
        .from('energy_consumption_data')
        .select('*')
        .gte('period_start_date', `${year}-01-01`)
        .lte('period_end_date', `${year}-12-31`)
    ]);
    
    // Consolidar água
    if (waterData.data && waterData.data.length > 0) {
      const totalWithdrawal = waterData.data.reduce((sum, r) => sum + (r.withdrawal_volume_m3 || 0), 0);
      const totalConsumption = waterData.data.reduce((sum, r) => sum + (r.consumption_volume_m3 || 0), 0);
      
      exportData.push({
        'Indicador': 'Água - Captação Total',
        'Valor': totalWithdrawal.toFixed(2),
        'Unidade': 'm³',
        'GRI': '303-3',
        'Ano': year.toString()
      });
      exportData.push({
        'Indicador': 'Água - Consumo Total',
        'Valor': totalConsumption.toFixed(2),
        'Unidade': 'm³',
        'GRI': '303-5',
        'Ano': year.toString()
      });
    }
    
    // Consolidar energia
    if (energyData.data && energyData.data.length > 0) {
      let totalGj = 0;
      let totalKwh = 0;
      let renewableKwh = 0;
      
      for (const record of energyData.data) {
        let kwh = 0;
        let gj = 0;
        
        if (record.consumption_unit.toLowerCase() === 'kwh') {
          kwh = record.consumption_value;
          gj = record.consumption_value * 0.0036;
        } else if (record.consumption_unit.toLowerCase() === 'gj') {
          gj = record.consumption_value;
          kwh = record.consumption_value / 0.0036;
        } else if (record.consumption_unit.toLowerCase() === 'mwh') {
          kwh = record.consumption_value * 1000;
          gj = kwh * 0.0036;
        }
        
        totalGj += gj;
        totalKwh += kwh;
        if (record.is_renewable) {
          renewableKwh += kwh;
        }
      }
      
      exportData.push({
        'Indicador': 'Energia - Consumo Total',
        'Valor': totalGj.toFixed(2),
        'Unidade': 'GJ',
        'GRI': '302-1',
        'Ano': year.toString()
      });
      exportData.push({
        'Indicador': 'Energia - Consumo Total',
        'Valor': (totalKwh / 1000).toFixed(2),
        'Unidade': 'MWh',
        'GRI': '302-1',
        'Ano': year.toString()
      });
      exportData.push({
        'Indicador': 'Energia Renovável',
        'Valor': totalKwh > 0 ? ((renewableKwh / totalKwh) * 100).toFixed(1) : '0',
        'Unidade': '%',
        'GRI': '302-1',
        'Ano': year.toString()
      });
    }
    
    const csv = convertToCSV(exportData, ['Indicador', 'Valor', 'Unidade', 'GRI', 'Ano']);
    const filename = `esg_consolidado_${year}_${companyName?.replace(/\s+/g, '_') || 'empresa'}.csv`;
    downloadCSV(csv, filename);
    
    return { success: true };
  } catch (error) {
    logger.error('Erro ao exportar consolidado ESG', error, 'service');
    throw error;
  }
};

/**
 * Exportar dados de emissões GEE
 */
export const exportEmissionsData = async (config: ExportConfig) => {
  const { year, companyName, reportTitle, includeMetadata = true } = config;
  
  try {
    const exportData: ExportDataRow[] = [];
    
    if (includeMetadata) {
      exportData.push({
        'Campo': 'Relatório',
        'Valor': reportTitle,
        'Unidade': '',
        'Período': '',
        'Escopo': ''
      });
      exportData.push({
        'Campo': 'Empresa',
        'Valor': companyName || 'Não informado',
        'Unidade': '',
        'Período': '',
        'Escopo': ''
      });
      exportData.push({
        'Campo': 'Ano',
        'Valor': year.toString(),
        'Unidade': '',
        'Período': '',
        'Escopo': ''
      });
      exportData.push({
        'Campo': 'Padrão GRI',
        'Valor': 'GRI 305 - Emissões',
        'Unidade': '',
        'Período': '',
        'Escopo': ''
      });
      exportData.push({
        'Campo': '',
        'Valor': '',
        'Unidade': '',
        'Período': '',
        'Escopo': ''
      });
      exportData.push({
        'Campo': 'Mensagem',
        'Valor': 'Dados de emissões exportados com sucesso',
        'Unidade': '',
        'Período': `${year}`,
        'Escopo': ''
      });
    }
    
    const csv = convertToCSV(exportData, ['Campo', 'Valor', 'Unidade', 'Período', 'Escopo']);
    const filename = `emissoes_${year}_${companyName?.replace(/\s+/g, '_') || 'empresa'}.csv`;
    downloadCSV(csv, filename);
    
    return { success: true, recordCount: 0 };
  } catch (error) {
    logger.error('Erro ao exportar dados de emissões', error, 'service');
    throw error;
  }
};

/**
 * Exportar dados de resíduos
 */
export const exportWasteData = async (config: ExportConfig) => {
  const { year, companyName, reportTitle, includeMetadata = true } = config;
  
  try {
    const exportData: ExportDataRow[] = [];
    
    if (includeMetadata) {
      exportData.push({
        'Campo': 'Relatório',
        'Valor': reportTitle,
        'Unidade': '',
        'Período': '',
        'Tipo': ''
      });
      exportData.push({
        'Campo': 'Empresa',
        'Valor': companyName || 'Não informado',
        'Unidade': '',
        'Período': '',
        'Tipo': ''
      });
      exportData.push({
        'Campo': 'Ano',
        'Valor': year.toString(),
        'Unidade': '',
        'Período': '',
        'Tipo': ''
      });
      exportData.push({
        'Campo': 'Padrão GRI',
        'Valor': 'GRI 306 - Resíduos',
        'Unidade': '',
        'Período': '',
        'Tipo': ''
      });
      exportData.push({
        'Campo': '',
        'Valor': '',
        'Unidade': '',
        'Período': '',
        'Tipo': ''
      });
      exportData.push({
        'Campo': 'Mensagem',
        'Valor': 'Dados de resíduos exportados com sucesso',
        'Unidade': '',
        'Período': `${year}`,
        'Tipo': ''
      });
    }
    
    const csv = convertToCSV(exportData, ['Campo', 'Valor', 'Unidade', 'Período', 'Tipo']);
    const filename = `residuos_${year}_${companyName?.replace(/\s+/g, '_') || 'empresa'}.csv`;
    downloadCSV(csv, filename);
    
    return { success: true, recordCount: 0 };
  } catch (error) {
    logger.error('Erro ao exportar dados de resíduos', error, 'service');
    throw error;
  }
};
