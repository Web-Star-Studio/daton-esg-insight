import { supabase } from '@/integrations/supabase/client';

export interface ESGScores {
  overall: number;
  environmental: number;
  social: number;
  governance: number;
  lastUpdated: string | null;
  hasData: boolean;
}

export async function calculateESGScores(): Promise<ESGScores> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .single();

    if (!profile?.company_id) {
      return getDefaultScores();
    }

    const companyId = profile.company_id;
    const currentYear = new Date().getFullYear();

    // Fetch data for all three pillars in parallel
    const [
      environmentalData,
      socialData,
      governanceData
    ] = await Promise.all([
      calculateEnvironmentalScore(companyId, currentYear),
      calculateSocialScore(companyId, currentYear),
      calculateGovernanceScore(companyId, currentYear)
    ]);

    const hasData = environmentalData.hasData || socialData.hasData || governanceData.hasData;

    // Calculate overall score (weighted average)
    const overall = hasData 
      ? Math.round((environmentalData.score * 0.33 + socialData.score * 0.33 + governanceData.score * 0.34))
      : 0;

    return {
      overall,
      environmental: environmentalData.score,
      social: socialData.score,
      governance: governanceData.score,
      lastUpdated: new Date().toISOString(),
      hasData
    };
  } catch (error) {
    console.error('Error calculating ESG scores:', error);
    return getDefaultScores();
  }
}

async function calculateEnvironmentalScore(companyId: string, year: number): Promise<{ score: number; hasData: boolean }> {
  try {
    // Get emission sources and targets
    const [emissionsResult, goalsResult, licensesResult] = await Promise.all([
      supabase
        .from('emission_sources')
        .select('id')
        .eq('company_id', companyId),
      supabase
        .from('goals')
        .select('id, name, baseline_value, target_value')
        .eq('company_id', companyId)
        .or('name.ilike.%ambiental%,name.ilike.%emissão%,name.ilike.%carbono%'),
      supabase
        .from('licenses')
        .select('id, status')
        .eq('company_id', companyId)
        .eq('status', 'Ativa')
    ]);

    const hasEmissions = (emissionsResult.data?.length || 0) > 0;
    const hasGoals = (goalsResult.data?.length || 0) > 0;
    const hasLicenses = (licensesResult.data?.length || 0) > 0;
    
    if (!hasEmissions && !hasGoals && !hasLicenses) {
      return { score: 0, hasData: false };
    }

    let score = 50; // Base score

    // Add points for having emission tracking
    if (hasEmissions) score += 15;
    
    // Add points for active licenses
    if (hasLicenses) score += 15;
    
    // Add points for environmental goals
    if (hasGoals) {
      score += 10;
      // Calculate goal progress based on baseline vs target
      const goalsWithProgress = goalsResult.data?.filter(g => 
        g.baseline_value !== null && g.target_value !== null && g.target_value > 0
      ) || [];
      
      if (goalsWithProgress.length > 0) {
        // Assume goals are being worked on - add bonus
        score += Math.min(goalsWithProgress.length * 2, 10);
      }
    }

    return { score: Math.min(score, 100), hasData: true };
  } catch (error) {
    console.error('Error calculating environmental score:', error);
    return { score: 0, hasData: false };
  }
}

async function calculateSocialScore(companyId: string, year: number): Promise<{ score: number; hasData: boolean }> {
  try {
    const [employeesResult, trainingsResult, incidentsResult] = await Promise.all([
      supabase
        .from('employees')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'Ativo'),
      supabase
        .from('training_programs')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'Ativo'),
      supabase
        .from('safety_incidents')
        .select('id, severity')
        .eq('company_id', companyId)
        .gte('incident_date', `${year}-01-01`)
    ]);

    const hasEmployees = (employeesResult.count || 0) > 0;
    const hasTrainings = (trainingsResult.count || 0) > 0;
    
    if (!hasEmployees) {
      return { score: 0, hasData: false };
    }

    let score = 60; // Base score for having employees

    // Add points for training programs
    if (hasTrainings) {
      const trainingRatio = Math.min((trainingsResult.count || 0) / 10, 1);
      score += Math.round(trainingRatio * 20);
    }

    // Deduct points for safety incidents
    const incidents = incidentsResult.data || [];
    const criticalIncidents = incidents.filter(i => i.severity === 'Grave' || i.severity === 'Fatal').length;
    const minorIncidents = incidents.filter(i => i.severity !== 'Grave' && i.severity !== 'Fatal').length;
    
    score -= criticalIncidents * 10;
    score -= minorIncidents * 2;

    // Bonus for no incidents
    if (incidents.length === 0) {
      score += 15;
    }

    return { score: Math.max(Math.min(score, 100), 0), hasData: true };
  } catch (error) {
    console.error('Error calculating social score:', error);
    return { score: 0, hasData: false };
  }
}

async function calculateGovernanceScore(companyId: string, year: number): Promise<{ score: number; hasData: boolean }> {
  try {
    const [risksResult, ncsResult, policiesResult, auditsResult] = await Promise.all([
      supabase
        .from('esg_risks')
        .select('id, status, inherent_risk_level')
        .eq('company_id', companyId)
        .eq('status', 'Ativo'),
      supabase
        .from('non_conformities')
        .select('id, status')
        .eq('company_id', companyId),
      supabase
        .from('corporate_policies')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'Ativo'),
      supabase
        .from('audits')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .gte('scheduled_date', `${year}-01-01`)
    ]);

    const hasRisks = (risksResult.data?.length || 0) > 0;
    const hasNCs = (ncsResult.data?.length || 0) > 0;
    const hasPolicies = (policiesResult.count || 0) > 0;
    const hasAudits = (auditsResult.count || 0) > 0;

    if (!hasRisks && !hasNCs && !hasPolicies) {
      return { score: 0, hasData: false };
    }

    let score = 50; // Base score

    // Add points for risk management
    if (hasRisks) {
      score += 10;
      const criticalRisks = risksResult.data?.filter(r => r.inherent_risk_level === 'Crítico').length || 0;
      // Deduct for critical risks
      score -= criticalRisks * 5;
    }

    // Add points for policies
    if (hasPolicies) {
      score += Math.min((policiesResult.count || 0) * 3, 15);
    }

    // Add points for audits
    if (hasAudits) {
      score += Math.min((auditsResult.count || 0) * 5, 15);
    }

    // Calculate NC resolution rate
    if (hasNCs) {
      const totalNCs = ncsResult.data?.length || 0;
      const resolvedNCs = ncsResult.data?.filter(nc => 
        nc.status === 'Fechada' || nc.status === 'Aprovada' || nc.status === 'Resolvida'
      ).length || 0;
      
      const resolutionRate = totalNCs > 0 ? resolvedNCs / totalNCs : 0;
      score += Math.round(resolutionRate * 15);
    } else {
      score += 10; // Bonus for no NCs
    }

    return { score: Math.max(Math.min(score, 100), 0), hasData: true };
  } catch (error) {
    console.error('Error calculating governance score:', error);
    return { score: 0, hasData: false };
  }
}

function getDefaultScores(): ESGScores {
  return {
    overall: 0,
    environmental: 0,
    social: 0,
    governance: 0,
    lastUpdated: null,
    hasData: false
  };
}
