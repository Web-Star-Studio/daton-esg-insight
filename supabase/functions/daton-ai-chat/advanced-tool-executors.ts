/**
 * Advanced Tool Executors for Daton AI
 * Implements sophisticated analysis capabilities
 */

/**
 * Analyze compliance gaps across different frameworks
 */
export async function analyzeComplianceGaps(args: any, companyId: string, supabase: any): Promise<any> {
  const { framework = 'all', includeRemediation = true } = args;

  const gaps: any[] = [];
  const recommendations: any[] = [];

  // Check licenses compliance
  if (framework === 'all' || framework === 'licenses') {
    const { data: licenses } = await supabase
      .from('licenses')
      .select('*')
      .eq('company_id', companyId);

    if (licenses) {
      const expired = licenses.filter((l: any) => l.status === 'Vencida').length;
      const expiringSoon = licenses.filter((l: any) => {
        if (!l.expiration_date) return false;
        const daysUntil = Math.floor((new Date(l.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 60;
      }).length;

      if (expired > 0) {
        gaps.push({
          framework: 'Licenciamento Ambiental',
          gap: `${expired} licença(s) vencida(s)`,
          severity: 'critical',
          risk: 'Operação irregular, possíveis multas e embargo'
        });
        
        if (includeRemediation) {
          recommendations.push({
            gap: 'Licenças vencidas',
            action: 'Iniciar imediatamente processo de renovação',
            priority: 'urgent',
            estimatedTime: '30-90 dias'
          });
        }
      }

      if (expiringSoon > 0) {
        gaps.push({
          framework: 'Licenciamento Ambiental',
          gap: `${expiringSoon} licença(s) próximas do vencimento`,
          severity: 'high',
          risk: 'Risco de vencimento sem renovação'
        });
      }
    }
  }

  // Check GRI compliance
  if (framework === 'all' || framework === 'gri') {
    const { data: reports } = await supabase
      .from('gri_reports')
      .select('*, gri_indicator_data(*)')
      .eq('company_id', companyId)
      .eq('status', 'Em Andamento')
      .order('created_at', { ascending: false })
      .limit(1);

    if (reports && reports.length > 0) {
      const report = reports[0];
      const completion = report.completion_percentage || 0;

      if (completion < 70) {
        gaps.push({
          framework: 'GRI Standards',
          gap: `Relatório ${completion}% completo`,
          severity: 'medium',
          risk: 'Divulgação incompleta de informações ESG'
        });

        if (includeRemediation) {
          recommendations.push({
            gap: 'Relatório GRI incompleto',
            action: 'Priorizar coleta de dados para indicadores obrigatórios',
            priority: 'high',
            estimatedTime: '2-4 semanas'
          });
        }
      }
    } else {
      gaps.push({
        framework: 'GRI Standards',
        gap: 'Nenhum relatório GRI em andamento',
        severity: 'medium',
        risk: 'Falta de transparência ESG'
      });
    }
  }

  // Check ISO 14001 compliance indicators
  if (framework === 'all' || framework === 'iso14001') {
    const { data: ncs } = await supabase
      .from('non_conformities')
      .select('*')
      .eq('company_id', companyId)
      .in('status', ['Aberta', 'Em Análise', 'Em Tratamento']);

    const openNCs = ncs?.length || 0;

    if (openNCs > 5) {
      gaps.push({
        framework: 'ISO 14001',
        gap: `${openNCs} não conformidades abertas`,
        severity: 'high',
        risk: 'Sistema de gestão não eficaz'
      });

      if (includeRemediation) {
        recommendations.push({
          gap: 'Múltiplas não conformidades',
          action: 'Implementar programa intensivo de tratamento de NCs',
          priority: 'high',
          estimatedTime: '1-2 meses'
        });
      }
    }

    // Check for overdue tasks
    const { data: tasks } = await supabase
      .from('data_collection_tasks')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'Em Atraso');

    const overdueTasks = tasks?.length || 0;

    if (overdueTasks > 10) {
      gaps.push({
        framework: 'ISO 14001',
        gap: `${overdueTasks} tarefas atrasadas`,
        severity: 'medium',
        risk: 'Perda de rastreabilidade e controle operacional'
      });
    }
  }

  // Calculate overall compliance score
  const totalGaps = gaps.length;
  const criticalGaps = gaps.filter((g: any) => g.severity === 'critical').length;
  const highGaps = gaps.filter((g: any) => g.severity === 'high').length;

  const complianceScore = Math.max(0, 100 - (criticalGaps * 20) - (highGaps * 10) - ((totalGaps - criticalGaps - highGaps) * 5));

  return {
    framework,
    complianceScore: Math.round(complianceScore),
    totalGaps,
    gapsByFramework: framework === 'all' ? 
      groupGapsByFramework(gaps) : 
      { [framework]: gaps },
    gaps,
    recommendations: includeRemediation ? recommendations : undefined,
    summary: generateComplianceSummary(complianceScore, gaps),
    nextSteps: generateNextSteps(gaps, recommendations)
  };
}

/**
 * Benchmark performance against sector standards
 */
export async function benchmarkPerformance(args: any, companyId: string, supabase: any): Promise<any> {
  const { metric, sector } = args;

  // Get company data
  const { data: company } = await supabase
    .from('companies')
    .select('sector')
    .eq('id', companyId)
    .single();

  const targetSector = sector || company?.sector || 'Geral';

  let companyValue = 0;
  let benchmarkValue = 0;
  let sectorAverage = 0;
  let interpretation = '';

  switch (metric) {
    case 'emissions_intensity':
      // Get total emissions for current year
      const { data: emissions } = await supabase
        .from('calculated_emissions')
        .select(`
          total_co2e,
          activity_data!inner(
            emission_source!inner(company_id)
          )
        `)
        .eq('activity_data.emission_source.company_id', companyId);

      const totalEmissions = emissions?.reduce((sum: number, e: any) => sum + (e.total_co2e || 0), 0) || 0;

      // Get revenue or employee count for intensity calculation
      const { data: employees } = await supabase
        .from('employees')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'Ativo');

      const employeeCount = employees?.length || 1;
      companyValue = totalEmissions / employeeCount;

      // Benchmark values (these would ideally come from a benchmarks table)
      const sectorBenchmarks: Record<string, number> = {
        'Indústria': 15.5,
        'Serviços': 5.2,
        'Comércio': 3.8,
        'Tecnologia': 2.1,
        'Geral': 8.0
      };

      benchmarkValue = sectorBenchmarks[targetSector] || sectorBenchmarks['Geral'];
      sectorAverage = benchmarkValue;

      interpretation = companyValue < benchmarkValue 
        ? `Excelente! Sua intensidade de emissões (${companyValue.toFixed(2)} tCO2e/funcionário) está ${Math.round(((benchmarkValue - companyValue) / benchmarkValue) * 100)}% abaixo da média do setor.`
        : `Atenção: Sua intensidade de emissões (${companyValue.toFixed(2)} tCO2e/funcionário) está ${Math.round(((companyValue - benchmarkValue) / benchmarkValue) * 100)}% acima da média do setor. Há oportunidades de melhoria.`;
      break;

    case 'goal_achievement_rate':
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('company_id', companyId)
        .in('status', ['Ativa', 'Concluída']);

      const totalGoals = goals?.length || 0;
      const completedGoals = goals?.filter((g: any) => g.status === 'Concluída').length || 0;
      const onTrackGoals = goals?.filter((g: any) => {
        if (g.status === 'Concluída') return true;
        return (g.progress_percentage || 0) >= 70;
      }).length || 0;

      companyValue = totalGoals > 0 ? (onTrackGoals / totalGoals) * 100 : 0;
      benchmarkValue = 75; // Industry standard for goal achievement
      sectorAverage = 75;

      interpretation = companyValue >= benchmarkValue
        ? `Muito bom! Taxa de alcance de metas (${companyValue.toFixed(1)}%) está acima do benchmark do setor (${benchmarkValue}%).`
        : `Sua taxa de alcance de metas (${companyValue.toFixed(1)}%) está abaixo do benchmark. Considere revisar processos de monitoramento.`;
      break;

    case 'compliance_score':
      const { data: licenses } = await supabase
        .from('licenses')
        .select('*')
        .eq('company_id', companyId);

      const totalLicenses = licenses?.length || 0;
      const validLicenses = licenses?.filter((l: any) => l.status === 'Ativa').length || 0;

      companyValue = totalLicenses > 0 ? (validLicenses / totalLicenses) * 100 : 0;
      benchmarkValue = 95; // Compliance standard
      sectorAverage = 95;

      interpretation = companyValue >= benchmarkValue
        ? `Conformidade excelente (${companyValue.toFixed(1)}%)! Mantém-se acima do padrão esperado.`
        : `Score de conformidade (${companyValue.toFixed(1)}%) abaixo do ideal. Priorize renovação de licenças.`;
      break;
  }

  return {
    metric,
    sector: targetSector,
    companyValue: Math.round(companyValue * 100) / 100,
    sectorBenchmark: benchmarkValue,
    sectorAverage,
    percentile: calculatePercentile(companyValue, benchmarkValue),
    gap: Math.round((companyValue - benchmarkValue) * 100) / 100,
    gapPercentage: benchmarkValue > 0 ? Math.round(((companyValue - benchmarkValue) / benchmarkValue) * 100) : 0,
    interpretation,
    recommendations: generateBenchmarkRecommendations(metric, companyValue, benchmarkValue)
  };
}

/**
 * Identify optimization opportunities
 */
export async function identifyOptimizationOpportunities(args: any, companyId: string, supabase: any): Promise<any> {
  const { focus = 'all', includeImpact = true } = args;

  const opportunities: any[] = [];

  // Cost reduction opportunities
  if (focus === 'all' || focus === 'cost_reduction') {
    // Check for high-emission sources that could be optimized
    const { data: emissions } = await supabase
      .from('calculated_emissions')
      .select(`
        *,
        activity_data!inner(
          emission_source!inner(
            source_name,
            scope,
            company_id
          )
        )
      `)
      .eq('activity_data.emission_source.company_id', companyId)
      .order('total_co2e', { ascending: false })
      .limit(10);

    if (emissions && emissions.length > 0) {
      const topEmitter = emissions[0];
      opportunities.push({
        category: 'Redução de Custos',
        title: `Otimizar maior fonte de emissões: ${topEmitter.activity_data?.emission_source?.source_name}`,
        description: 'Fonte responsável por maior volume de emissões. Redução aqui terá maior impacto.',
        estimatedSaving: 'R$ 50.000 - R$ 150.000/ano',
        estimatedImpact: includeImpact ? {
          financial: 'Alto',
          environmental: `Redução de ${Math.round(topEmitter.total_co2e * 0.3)} tCO2e/ano`,
          effort: 'Médio'
        } : undefined,
        priority: 'high'
      });
    }
  }

  // Efficiency opportunities
  if (focus === 'all' || focus === 'efficiency') {
    // Check for overdue tasks clustering
    const { data: overdueTasks } = await supabase
      .from('data_collection_tasks')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'Em Atraso');

    if (overdueTasks && overdueTasks.length > 5) {
      opportunities.push({
        category: 'Eficiência Operacional',
        title: 'Automatizar coleta de dados recorrentes',
        description: `${overdueTasks.length} tarefas atrasadas indicam gargalo operacional. Automação pode reduzir carga.`,
        estimatedSaving: 'R$ 20.000 - R$ 60.000/ano em tempo de equipe',
        estimatedImpact: includeImpact ? {
          timeReduction: '70%',
          accuracy: '+25%',
          effort: 'Alto (implementação inicial)'
        } : undefined,
        priority: 'medium'
      });
    }

    // Check for duplicate processes
    const { data: tasks } = await supabase
      .from('data_collection_tasks')
      .select('task_type')
      .eq('company_id', companyId);

    if (tasks) {
      const typeCount: Record<string, number> = {};
      tasks.forEach((t: any) => {
        typeCount[t.task_type] = (typeCount[t.task_type] || 0) + 1;
      });

      const duplicates = Object.entries(typeCount).filter(([_, count]) => count > 10);
      if (duplicates.length > 0) {
        opportunities.push({
          category: 'Eficiência Operacional',
          title: 'Consolidar processos de coleta de dados',
          description: `Múltiplas tarefas do tipo "${duplicates[0][0]}" podem ser consolidadas em processo único.`,
          estimatedSaving: 'R$ 15.000 - R$ 40.000/ano',
          estimatedImpact: includeImpact ? {
            timeReduction: '40%',
            errorReduction: '30%',
            effort: 'Baixo'
          } : undefined,
          priority: 'medium'
        });
      }
    }
  }

  // Risk mitigation opportunities
  if (focus === 'all' || focus === 'risk_mitigation') {
    const { data: criticalRisks } = await supabase
      .from('esg_risks')
      .select('*')
      .eq('company_id', companyId)
      .eq('inherent_risk_level', 'Crítico')
      .eq('status', 'Ativo');

    if (criticalRisks && criticalRisks.length > 0) {
      opportunities.push({
        category: 'Mitigação de Riscos',
        title: `Tratar ${criticalRisks.length} risco(s) crítico(s) identificado(s)`,
        description: 'Riscos críticos sem tratamento adequado expõem organização a perdas significativas.',
        estimatedSaving: 'R$ 100.000 - R$ 500.000 (evitar perdas)',
        estimatedImpact: includeImpact ? {
          riskReduction: 'Crítico → Médio/Baixo',
          protectionValue: 'R$ 500k - R$ 2M',
          effort: 'Alto'
        } : undefined,
        priority: 'urgent'
      });
    }
  }

  // Goal acceleration opportunities
  if (focus === 'all' || focus === 'goal_acceleration') {
    const { data: slowGoals } = await supabase
      .from('goals')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'Ativa')
      .lt('progress_percentage', 50);

    if (slowGoals && slowGoals.length > 3) {
      opportunities.push({
        category: 'Aceleração de Metas',
        title: 'Implementar framework de aceleração de metas',
        description: `${slowGoals.length} metas com progresso <50%. Framework estruturado pode acelerar entregas.`,
        estimatedSaving: 'R$ 30.000 - R$ 80.000/ano (valor de metas alcançadas)',
        estimatedImpact: includeImpact ? {
          goalAcceleration: '+35% velocidade',
          achievementRate: '+25%',
          effort: 'Médio'
        } : undefined,
        priority: 'high'
      });
    }
  }

  // Calculate total potential value
  const totalPotential = opportunities.reduce((sum, opp) => {
    const match = opp.estimatedSaving.match(/R\$ ([\d.]+)/);
    return sum + (match ? parseFloat(match[1].replace('.', '')) : 0);
  }, 0);

  return {
    focus,
    totalOpportunities: opportunities.length,
    estimatedTotalValue: `R$ ${totalPotential.toLocaleString('pt-BR')}+/ano`,
    opportunities: opportunities.sort((a, b) => {
      const priority: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    }),
    summary: generateOptimizationSummary(opportunities),
    implementationRoadmap: generateImplementationRoadmap(opportunities)
  };
}

/**
 * Analyze stakeholder impact of actions
 */
export async function analyzeStakeholderImpact(args: any, companyId: string, supabase: any): Promise<any> {
  const { action, stakeholderGroups = [] } = args;

  // Get all stakeholders if specific groups not provided
  const { data: stakeholders } = await supabase
    .from('stakeholders')
    .select('*')
    .eq('company_id', companyId);

  const impactAnalysis: any[] = [];
  const defaultGroups = ['Funcionários', 'Comunidade', 'Investidores', 'Clientes', 'Fornecedores', 'Reguladores'];
  const targetGroups = stakeholderGroups.length > 0 ? stakeholderGroups : defaultGroups;

  targetGroups.forEach((group: string) => {
    const stakeholdersInGroup = stakeholders?.filter((s: any) => 
      s.category?.toLowerCase().includes(group.toLowerCase())
    ) || [];

    // Analyze impact based on action type (simplified logic)
    let impact = 'medium';
    let sentiment = 'neutral';
    let description = '';

    if (action.toLowerCase().includes('emissão') || action.toLowerCase().includes('carbono')) {
      if (group === 'Investidores') {
        impact = 'high';
        sentiment = 'positive';
        description = 'Melhora de rating ESG e atração de investimentos sustentáveis';
      } else if (group === 'Comunidade') {
        impact = 'high';
        sentiment = 'positive';
        description = 'Melhora na qualidade do ar e saúde pública';
      } else if (group === 'Reguladores') {
        impact = 'medium';
        sentiment = 'positive';
        description = 'Demonstra compromisso com metas climáticas';
      }
    }

    if (action.toLowerCase().includes('social') || action.toLowerCase().includes('funcionário')) {
      if (group === 'Funcionários') {
        impact = 'high';
        sentiment = 'positive';
        description = 'Melhora de satisfação, engajamento e retenção';
      }
    }

    impactAnalysis.push({
      stakeholderGroup: group,
      count: stakeholdersInGroup.length,
      impactLevel: impact,
      sentiment,
      description,
      recommendedEngagement: generateEngagementStrategy(group, impact)
    });
  });

  return {
    action,
    stakeholderGroups: targetGroups,
    impactAnalysis,
    overallSentiment: calculateOverallSentiment(impactAnalysis),
    criticalStakeholders: impactAnalysis.filter((a: any) => a.impactLevel === 'high'),
    engagementPlan: generateEngagementPlan(impactAnalysis),
    communicationRecommendations: generateCommunicationRecommendations(action, impactAnalysis)
  };
}

// ============= Helper Functions =============

function groupGapsByFramework(gaps: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  gaps.forEach(gap => {
    if (!grouped[gap.framework]) grouped[gap.framework] = [];
    grouped[gap.framework].push(gap);
  });
  return grouped;
}

function generateComplianceSummary(score: number, gaps: any[]): string {
  if (score >= 90) return 'Conformidade excelente. Manter monitoramento contínuo.';
  if (score >= 70) return 'Conformidade adequada com algumas melhorias necessárias.';
  if (score >= 50) return 'Conformidade moderada. Ação corretiva recomendada.';
  return 'Conformidade crítica. Ação imediata necessária.';
}

function generateNextSteps(gaps: any[], recommendations: any[]): string[] {
  const steps: string[] = [];
  const critical = gaps.filter((g: any) => g.severity === 'critical');
  
  if (critical.length > 0) {
    steps.push(`1. Prioridade URGENTE: Resolver ${critical.length} gap(s) crítico(s)`);
  }
  
  if (recommendations.length > 0) {
    steps.push(`2. Implementar plano de remediação para ${recommendations.length} item(ns)`);
  }
  
  steps.push('3. Estabelecer monitoramento contínuo de conformidade');
  return steps;
}

function calculatePercentile(value: number, benchmark: number): number {
  const ratio = value / benchmark;
  if (ratio >= 1.2) return 90;
  if (ratio >= 1.0) return 75;
  if (ratio >= 0.8) return 50;
  if (ratio >= 0.6) return 25;
  return 10;
}

function generateBenchmarkRecommendations(metric: string, value: number, benchmark: number): string[] {
  const recommendations: string[] = [];
  
  if (value < benchmark) {
    recommendations.push(`Estabelecer meta de alcançar benchmark setorial (${benchmark})`);
    recommendations.push('Estudar best practices de empresas líderes do setor');
    recommendations.push('Implementar programa de melhoria contínua');
  } else {
    recommendations.push('Manter performance acima da média');
    recommendations.push('Considerar estabelecer novo benchmark interno mais ambicioso');
    recommendations.push('Compartilhar boas práticas com setor');
  }
  
  return recommendations;
}

function generateOptimizationSummary(opportunities: any[]): string {
  const total = opportunities.length;
  const urgent = opportunities.filter((o: any) => o.priority === 'urgent').length;
  const high = opportunities.filter((o: any) => o.priority === 'high').length;
  
  return `Identificadas ${total} oportunidades de otimização (${urgent} urgentes, ${high} alta prioridade). Foco em implementação rápida de quick wins pode gerar resultados em 30-60 dias.`;
}

function generateImplementationRoadmap(opportunities: any[]): any[] {
  return [
    {
      phase: 'Curto Prazo (0-3 meses)',
      focus: 'Quick wins e oportunidades de baixo esforço',
      opportunities: opportunities.filter((o: any) => 
        o.estimatedImpact?.effort?.includes('Baixo') || o.priority === 'urgent'
      ).map((o: any) => o.title)
    },
    {
      phase: 'Médio Prazo (3-6 meses)',
      focus: 'Iniciativas estruturantes de médio esforço',
      opportunities: opportunities.filter((o: any) => 
        o.estimatedImpact?.effort?.includes('Médio')
      ).map((o: any) => o.title)
    },
    {
      phase: 'Longo Prazo (6-12 meses)',
      focus: 'Transformações de alto impacto',
      opportunities: opportunities.filter((o: any) => 
        o.estimatedImpact?.effort?.includes('Alto')
      ).map((o: any) => o.title)
    }
  ];
}

function generateEngagementStrategy(group: string, impact: string): string {
  if (impact === 'high') {
    return `Engajamento direto e contínuo. Estabelecer canal dedicado de comunicação.`;
  }
  return 'Comunicação regular através de canais estabelecidos.';
}

function calculateOverallSentiment(analysis: any[]): string {
  const positive = analysis.filter((a: any) => a.sentiment === 'positive').length;
  const total = analysis.length;
  
  if (positive / total >= 0.7) return 'Predominantemente Positivo';
  if (positive / total >= 0.4) return 'Misto';
  return 'Requer Atenção';
}

function generateEngagementPlan(analysis: any[]): any[] {
  return analysis
    .filter((a: any) => a.impactLevel === 'high')
    .map((a: any) => ({
      stakeholder: a.stakeholderGroup,
      priority: 'high',
      actions: [
        'Reunião presencial/virtual para apresentação',
        'Canal direto para feedback e dúvidas',
        'Acompanhamento mensal de percepção'
      ]
    }));
}

function generateCommunicationRecommendations(action: string, analysis: any[]): string[] {
  return [
    'Desenvolver narrativa clara sobre benefícios da ação',
    'Personalizar mensagem por grupo de stakeholder',
    'Estabelecer cronograma de comunicação escalonado',
    'Preparar FAQ antecipando principais dúvidas',
    'Definir KPIs para medir efetividade da comunicação'
  ];
}
