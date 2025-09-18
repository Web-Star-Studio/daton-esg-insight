-- Expandir função para sugestões automáticas de indicadores GRI
CREATE OR REPLACE FUNCTION public.get_indicator_suggested_value(p_company_id uuid, p_indicator_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB := '{}';
  emission_data NUMERIC;
  energy_data NUMERIC;
  employee_count INTEGER;
  board_count INTEGER;
  policy_count INTEGER;
  safety_incidents INTEGER;
  training_programs INTEGER;
  waste_data NUMERIC;
  water_consumption NUMERIC;
  diversity_data JSONB;
  governance_data JSONB;
BEGIN
  
  -- GRI 2-7: Empregados (Universal - Obrigatório)
  IF p_indicator_code = '2-7' THEN
    SELECT COUNT(*) INTO employee_count
    FROM employees
    WHERE company_id = p_company_id AND status = 'Ativo';
    
    SELECT jsonb_build_object(
      'total', COUNT(*),
      'by_gender', jsonb_object_agg(COALESCE(gender, 'Não informado'), count),
      'by_department', jsonb_object_agg(COALESCE(department, 'Não informado'), dept_count)
    ) INTO diversity_data
    FROM (
      SELECT gender, COUNT(*) as count
      FROM employees 
      WHERE company_id = p_company_id AND status = 'Ativo'
      GROUP BY gender
    ) gender_data,
    (
      SELECT department, COUNT(*) as dept_count
      FROM employees 
      WHERE company_id = p_company_id AND status = 'Ativo'
      GROUP BY department
    ) dept_data;
    
    result := jsonb_build_object(
      'suggested_value', employee_count,
      'unit', 'pessoas',
      'data_source', 'employees',
      'confidence', 'high',
      'breakdown', diversity_data
    );
  END IF;
  
  -- GRI 2-9: Estrutura de governança e composição (Universal - Obrigatório)
  IF p_indicator_code = '2-9' THEN
    SELECT 
      jsonb_build_object(
        'total_members', COUNT(*),
        'independent_members', COUNT(*) FILTER (WHERE is_independent = true),
        'gender_diversity', jsonb_object_agg(COALESCE(gender, 'Não informado'), gender_count),
        'committees', jsonb_agg(DISTINCT committee) FILTER (WHERE committee IS NOT NULL)
      ) INTO governance_data
    FROM (
      SELECT *, COUNT(*) OVER (PARTITION BY gender) as gender_count
      FROM board_members
      WHERE company_id = p_company_id AND status = 'Ativo'
    ) board_data;
    
    result := jsonb_build_object(
      'suggested_value', governance_data,
      'unit', 'estrutura',
      'data_source', 'board_members',
      'confidence', 'high'
    );
  END IF;
  
  -- GRI 2-12: Papel do mais alto órgão de governança na supervisão de impactos
  IF p_indicator_code = '2-12' THEN
    SELECT COUNT(*) INTO policy_count
    FROM corporate_policies
    WHERE company_id = p_company_id 
    AND status = 'Ativo'
    AND category ILIKE '%sustentabilidade%' OR category ILIKE '%ESG%';
    
    result := jsonb_build_object(
      'suggested_value', CASE 
        WHEN policy_count > 0 THEN 'O conselho de administração supervisiona impactos através de políticas formais de sustentabilidade e ESG'
        ELSE 'Necessário implementar políticas formais de supervisão de impactos ESG'
      END,
      'unit', 'texto',
      'data_source', 'corporate_policies',
      'confidence', CASE WHEN policy_count > 0 THEN 'high' ELSE 'medium' END
    );
  END IF;
  
  -- GRI 305-1: Emissões diretas (Escopo 1)
  IF p_indicator_code = '305-1' THEN
    SELECT COALESCE(SUM(ce.total_co2e), 0)
    INTO emission_data
    FROM calculated_emissions ce
    JOIN activity_data ad ON ce.activity_data_id = ad.id
    JOIN emission_sources es ON ad.emission_source_id = es.id
    WHERE es.company_id = p_company_id 
    AND es.scope = 1
    AND EXTRACT(YEAR FROM ad.period_start_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    result := jsonb_build_object(
      'suggested_value', emission_data,
      'unit', 'tCO2e',
      'data_source', 'calculated_emissions',
      'confidence', CASE WHEN emission_data > 0 THEN 'high' ELSE 'low' END
    );
  END IF;
  
  -- GRI 305-2: Emissões indiretas de energia (Escopo 2)
  IF p_indicator_code = '305-2' THEN
    SELECT COALESCE(SUM(ce.total_co2e), 0)
    INTO emission_data
    FROM calculated_emissions ce
    JOIN activity_data ad ON ce.activity_data_id = ad.id
    JOIN emission_sources es ON ad.emission_source_id = es.id
    WHERE es.company_id = p_company_id 
    AND es.scope = 2
    AND EXTRACT(YEAR FROM ad.period_start_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    result := jsonb_build_object(
      'suggested_value', emission_data,
      'unit', 'tCO2e',
      'data_source', 'calculated_emissions',
      'confidence', CASE WHEN emission_data > 0 THEN 'high' ELSE 'low' END
    );
  END IF;
  
  -- GRI 302-1: Consumo de energia dentro da organização
  IF p_indicator_code = '302-1' THEN
    SELECT COALESCE(SUM(ad.quantity), 0)
    INTO energy_data
    FROM activity_data ad
    JOIN emission_sources es ON ad.emission_source_id = es.id
    JOIN emission_factors ef ON ad.emission_factor_id = ef.id
    WHERE es.company_id = p_company_id 
    AND ef.category ILIKE '%energia%'
    AND EXTRACT(YEAR FROM ad.period_start_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    result := jsonb_build_object(
      'suggested_value', energy_data,
      'unit', 'GJ',
      'data_source', 'activity_data',
      'confidence', CASE WHEN energy_data > 0 THEN 'high' ELSE 'low' END
    );
  END IF;
  
  -- GRI 403-9: Lesões decorrentes de acidentes do trabalho
  IF p_indicator_code = '403-9' THEN
    SELECT COUNT(*)
    INTO safety_incidents
    FROM safety_incidents
    WHERE company_id = p_company_id
    AND EXTRACT(YEAR FROM incident_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    result := jsonb_build_object(
      'suggested_value', safety_incidents,
      'unit', 'incidentes',
      'data_source', 'safety_incidents',
      'confidence', 'high'
    );
  END IF;
  
  -- GRI 404-1: Média de horas de treinamento por ano por funcionário
  IF p_indicator_code = '404-1' THEN
    SELECT COUNT(DISTINCT tp.id)
    INTO training_programs
    FROM training_programs tp
    WHERE tp.company_id = p_company_id
    AND tp.status = 'Ativo';
    
    -- Calcular média baseada em programas ativos vs funcionários
    SELECT 
      CASE 
        WHEN employee_count > 0 THEN (training_programs * 40.0) / employee_count 
        ELSE 0 
      END
    INTO energy_data -- reutilizando variável numérica
    FROM (
      SELECT COUNT(*) as employee_count
      FROM employees
      WHERE company_id = p_company_id AND status = 'Ativo'
    ) emp_data;
    
    result := jsonb_build_object(
      'suggested_value', ROUND(energy_data, 2),
      'unit', 'horas/funcionário/ano',
      'data_source', 'training_programs',
      'confidence', CASE WHEN training_programs > 0 THEN 'medium' ELSE 'low' END
    );
  END IF;
  
  -- GRI 306-3: Resíduos gerados
  IF p_indicator_code = '306-3' THEN
    SELECT COALESCE(SUM(quantity), 0)
    INTO waste_data
    FROM waste_logs
    WHERE company_id = p_company_id
    AND EXTRACT(YEAR FROM log_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    result := jsonb_build_object(
      'suggested_value', waste_data,
      'unit', 'toneladas',
      'data_source', 'waste_logs',
      'confidence', CASE WHEN waste_data > 0 THEN 'high' ELSE 'low' END
    );
  END IF;
  
  -- GRI 405-1: Diversidade nos órgãos de governança e funcionários
  IF p_indicator_code = '405-1' THEN
    WITH employee_diversity AS (
      SELECT 
        jsonb_build_object(
          'gender', jsonb_object_agg(COALESCE(gender, 'Não informado'), gender_count),
          'age_groups', jsonb_object_agg(age_group, age_count),
          'total_employees', SUM(gender_count)
        ) as emp_diversity
      FROM (
        SELECT 
          gender,
          CASE 
            WHEN EXTRACT(YEAR FROM age(birth_date)) < 30 THEN '<30'
            WHEN EXTRACT(YEAR FROM age(birth_date)) BETWEEN 30 AND 50 THEN '30-50'
            ELSE '>50'
          END as age_group,
          COUNT(*) as gender_count,
          COUNT(*) as age_count
        FROM employees
        WHERE company_id = p_company_id AND status = 'Ativo'
        GROUP BY gender, 
          CASE 
            WHEN EXTRACT(YEAR FROM age(birth_date)) < 30 THEN '<30'
            WHEN EXTRACT(YEAR FROM age(birth_date)) BETWEEN 30 AND 50 THEN '30-50'
            ELSE '>50'
          END
      ) diversity_stats
    )
    SELECT emp_diversity INTO diversity_data FROM employee_diversity;
    
    result := jsonb_build_object(
      'suggested_value', diversity_data,
      'unit', 'percentuais',
      'data_source', 'employees',
      'confidence', 'high'
    );
  END IF;
  
  RETURN result;
END;
$function$;