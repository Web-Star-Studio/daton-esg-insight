-- Remover duplicatas de CNPJ mantendo apenas o mais recente
DELETE FROM public.supplier_management 
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY company_id, cnpj ORDER BY created_at DESC) as rn
        FROM public.supplier_management
        WHERE cnpj IS NOT NULL AND cnpj != ''
    ) sub
    WHERE rn > 1
);

-- Remover duplicatas de CPF mantendo apenas o mais recente  
DELETE FROM public.supplier_management 
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY company_id, cpf ORDER BY created_at DESC) as rn
        FROM public.supplier_management
        WHERE cpf IS NOT NULL AND cpf != ''
    ) sub
    WHERE rn > 1
);

-- Criar índices únicos para CNPJ e CPF por empresa
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_management_cnpj_unique 
ON public.supplier_management(company_id, cnpj) 
WHERE cnpj IS NOT NULL AND cnpj != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_management_cpf_unique 
ON public.supplier_management(company_id, cpf) 
WHERE cpf IS NOT NULL AND cpf != '';