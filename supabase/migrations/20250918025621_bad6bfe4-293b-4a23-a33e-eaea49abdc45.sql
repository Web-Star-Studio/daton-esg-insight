-- Corrigir avisos de segurança das funções recém-criadas

-- Corrigir função calculate_risk_level
CREATE OR REPLACE FUNCTION public.calculate_risk_level(p_probability VARCHAR, p_impact VARCHAR)
RETURNS VARCHAR
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Matriz de risco: Probabilidade x Impacto
    CASE 
        WHEN p_probability = 'Alta' AND p_impact = 'Alto' THEN RETURN 'Crítico';
        WHEN (p_probability = 'Alta' AND p_impact = 'Médio') OR (p_probability = 'Média' AND p_impact = 'Alto') THEN RETURN 'Alto';
        WHEN (p_probability = 'Alta' AND p_impact = 'Baixo') OR (p_probability = 'Média' AND p_impact = 'Médio') OR (p_probability = 'Baixa' AND p_impact = 'Alto') THEN RETURN 'Médio';
        WHEN (p_probability = 'Média' AND p_impact = 'Baixo') OR (p_probability = 'Baixa' AND p_impact = 'Médio') THEN RETURN 'Baixo';
        WHEN p_probability = 'Baixa' AND p_impact = 'Baixo' THEN RETURN 'Muito Baixo';
        ELSE RETURN 'Indefinido';
    END CASE;
END;
$$;

-- Corrigir função update_risk_level
CREATE OR REPLACE FUNCTION public.update_risk_level()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    NEW.inherent_risk_level = calculate_risk_level(NEW.probability, NEW.impact);
    RETURN NEW;
END;
$$;