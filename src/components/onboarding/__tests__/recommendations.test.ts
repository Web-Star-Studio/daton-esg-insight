import { describe, test, expect } from 'vitest';
import { MODULE_MAP_BY_ID } from '../modulesCatalog';

// All sector recommendations
const sectorMap: Record<string, string[]> = {
  'manufacturing': ['inventario_gee', 'energia', 'residuos', 'saude_seguranca'],
  'agro': ['agua', 'biodiversidade', 'residuos', 'inventario_gee'],
  'food_beverage': ['qualidade', 'residuos', 'agua', 'saude_seguranca'],
  'mining': ['inventario_gee', 'agua', 'biodiversidade', 'gestao_licencas'],
  'oil_gas': ['inventario_gee', 'energia', 'gestao_licencas', 'riscos_esg'],
  'energy': ['inventario_gee', 'energia', 'mudancas_climaticas'],
  'chemical': ['inventario_gee', 'residuos', 'saude_seguranca', 'gestao_licencas'],
  'pulp_paper': ['inventario_gee', 'agua', 'residuos', 'biodiversidade'],
  'steel': ['inventario_gee', 'energia', 'residuos', 'saude_seguranca'],
  'logistics': ['inventario_gee', 'energia', 'gestao_pessoas', 'cadeia_suprimentos'],
  'financial': ['riscos_esg', 'compliance', 'stakeholders', 'gestao_pessoas'],
  'telecom': ['energia', 'gestao_pessoas', 'inovacao', 'compliance'],
  'public': ['compliance', 'gestao_pessoas', 'stakeholders', 'riscos_esg'],
  'pharma_cosmetics': ['qualidade', 'saude_seguranca', 'compliance', 'residuos'],
  'automotive': ['inventario_gee', 'qualidade', 'cadeia_suprimentos', 'inovacao'],
  'technology': ['energia', 'residuos', 'inovacao', 'gestao_pessoas'],
  'consumer_goods': ['qualidade', 'cadeia_suprimentos', 'economia_circular', 'residuos'],
  'utilities': ['agua', 'energia', 'gestao_licencas', 'inventario_gee'],
  'healthcare': ['saude_seguranca', 'qualidade', 'residuos', 'gestao_pessoas'],
  'education': ['gestao_pessoas', 'stakeholders', 'energia', 'compliance'],
  'retail': ['energia', 'residuos', 'gestao_pessoas', 'economia_circular'],
  'construction': ['saude_seguranca', 'gestao_licencas', 'residuos', 'biodiversidade'],
  'services': ['gestao_pessoas', 'qualidade', 'performance', 'stakeholders'],
  'other': ['inventario_gee', 'compliance', 'gestao_pessoas', 'qualidade']
};

// All goal recommendations
const goalRecommendations: Record<string, string[]> = {
  'emissions_reduction': ['inventario_gee', 'energia'],
  'environmental_compliance': ['gestao_licencas', 'compliance'],
  'health_safety': ['saude_seguranca'],
  'energy_efficiency': ['energia'],
  'water_management': ['agua'],
  'waste_reduction': ['residuos', 'economia_circular'],
  'quality': ['qualidade'],
  'compliance': ['compliance', 'gestao_licencas'],
  'performance': ['performance', 'analise_dados'],
  'sustainability': ['inventario_gee', 'compliance', 'riscos_esg'],
  'innovation': ['inovacao', 'analise_dados'],
  'cost_reduction': ['energia', 'residuos', 'performance']
};

describe('Module Recommendations Validation', () => {
  test('All sector-recommended module IDs should exist in catalog', () => {
    const allRecommendations = Object.values(sectorMap).flat();
    const uniqueRecommendations = Array.from(new Set(allRecommendations));
    
    const invalidModules: string[] = [];
    uniqueRecommendations.forEach(moduleId => {
      if (!MODULE_MAP_BY_ID[moduleId]) {
        invalidModules.push(moduleId);
      }
    });
    
    expect(invalidModules).toEqual([]);
  });
  
  test('All goal-recommended module IDs should exist in catalog', () => {
    const allRecommendations = Object.values(goalRecommendations).flat();
    const uniqueRecommendations = Array.from(new Set(allRecommendations));
    
    const invalidModules: string[] = [];
    uniqueRecommendations.forEach(moduleId => {
      if (!MODULE_MAP_BY_ID[moduleId]) {
        invalidModules.push(moduleId);
      }
    });
    
    expect(invalidModules).toEqual([]);
  });
  
  test('All sectors should have recommendations', () => {
    const sectors = [
      'manufacturing', 'agro', 'food_beverage', 'mining', 'oil_gas',
      'energy', 'chemical', 'pulp_paper', 'steel', 'logistics',
      'telecom', 'public', 'pharma_cosmetics', 'automotive',
      'consumer_goods', 'utilities', 'healthcare', 'education',
      'retail', 'construction', 'financial', 'services', 'technology', 'other'
    ];
    
    sectors.forEach(sector => {
      expect(sectorMap[sector]).toBeDefined();
      expect(sectorMap[sector].length).toBeGreaterThan(0);
    });
  });
  
  test('All goals should have recommendations', () => {
    const goals = [
      'emissions_reduction', 'environmental_compliance', 'health_safety',
      'energy_efficiency', 'water_management', 'waste_reduction',
      'quality', 'compliance', 'performance', 'sustainability',
      'innovation', 'cost_reduction'
    ];
    
    goals.forEach(goal => {
      expect(goalRecommendations[goal]).toBeDefined();
      expect(goalRecommendations[goal].length).toBeGreaterThan(0);
    });
  });
  
  test('Each sector should recommend at least 3 modules', () => {
    Object.entries(sectorMap).forEach(([sector, modules]) => {
      expect(modules.length).toBeGreaterThanOrEqual(3);
    });
  });
  
  test('No duplicate module IDs in any sector recommendation', () => {
    Object.entries(sectorMap).forEach(([sector, modules]) => {
      const uniqueModules = new Set(modules);
      expect(uniqueModules.size).toBe(modules.length);
    });
  });
});
