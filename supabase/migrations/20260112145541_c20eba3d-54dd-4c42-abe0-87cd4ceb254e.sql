-- =====================================================
-- PARTE 1: Corrigir usuário dcpa@cesar.school
-- =====================================================

-- O usuário foi criado com dados errados pelo bug no fluxo de convite
-- Vamos corrigir para a empresa Transportes Gabardo

-- Atualizar profile
UPDATE profiles 
SET 
  full_name = 'Douglas Araújo',
  company_id = '021647af-61a5-4075-9db3-bb5024ef7a67'
WHERE id = 'c552ff27-9654-4c7b-b363-564a5ea1cc84'
  AND company_id != '021647af-61a5-4075-9db3-bb5024ef7a67';

-- Atualizar user_role para a empresa correta
UPDATE user_roles 
SET company_id = '021647af-61a5-4075-9db3-bb5024ef7a67'
WHERE user_id = 'c552ff27-9654-4c7b-b363-564a5ea1cc84'
  AND company_id != '021647af-61a5-4075-9db3-bb5024ef7a67';

-- =====================================================
-- PARTE 2: Verificar e limpar empresa órfã "Empresa"
-- =====================================================

-- Primeiro verificar se há outros usuários na empresa "Empresa"
-- Se não houver, podemos deletar

-- Deletar empresa órfã se não tiver mais ninguém
DELETE FROM companies 
WHERE name = 'Empresa' 
  AND id NOT IN (SELECT DISTINCT company_id FROM profiles WHERE company_id IS NOT NULL)
  AND id NOT IN (SELECT DISTINCT company_id FROM user_roles WHERE company_id IS NOT NULL);

-- =====================================================
-- PARTE 3: Atualizar trigger handle_new_user
-- para tratar corretamente usuários convidados
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  company_record RECORD;
  clean_cnpj text;
  invited_company_id uuid;
  user_role text;
  user_full_name text;
  invited_by_user uuid;
  user_department text;
  user_phone text;
BEGIN
  -- Extrair dados dos metadados
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'viewer');
  user_department := NEW.raw_user_meta_data->>'department';
  user_phone := NEW.raw_user_meta_data->>'phone';
  
  -- ========================================
  -- CASO 1: Usuário CONVIDADO (tem company_id nos metadados)
  -- ========================================
  IF NEW.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    BEGIN
      invited_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      invited_company_id := NULL;
    END;
    
    IF invited_company_id IS NOT NULL THEN
      -- Verificar se a empresa existe
      SELECT * INTO company_record FROM companies WHERE id = invited_company_id;
      
      IF company_record IS NOT NULL THEN
        -- Criar profile para usuário convidado
        INSERT INTO profiles (id, full_name, company_id, email, department, phone, role)
        VALUES (
          NEW.id,
          user_full_name,
          invited_company_id,
          NEW.email,
          user_department,
          user_phone,
          user_role
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          company_id = EXCLUDED.company_id,
          department = EXCLUDED.department,
          phone = EXCLUDED.phone,
          role = EXCLUDED.role;
        
        -- Tentar extrair invited_by
        BEGIN
          invited_by_user := (NEW.raw_user_meta_data->>'invited_by')::uuid;
        EXCEPTION WHEN OTHERS THEN
          invited_by_user := NEW.id;
        END;
        
        -- Criar user_role para usuário convidado
        INSERT INTO user_roles (user_id, role, company_id, assigned_by_user_id)
        VALUES (
          NEW.id,
          user_role::user_role_type,
          invited_company_id,
          COALESCE(invited_by_user, NEW.id)
        )
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RETURN NEW; -- Sair aqui - não criar nova empresa!
      END IF;
    END IF;
  END IF;
  
  -- ========================================
  -- CASO 2: Usuário fazendo SIGNUP com CNPJ
  -- ========================================
  
  -- Normalizar CNPJ removendo caracteres especiais
  clean_cnpj := regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'cnpj', ''), 
    '[^0-9]', '', 'g'
  );
  
  -- Verificar se empresa já existe com este CNPJ normalizado
  IF clean_cnpj != '' AND length(clean_cnpj) >= 14 THEN
    SELECT * INTO company_record 
    FROM companies 
    WHERE regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g') = clean_cnpj
    LIMIT 1;
  END IF;
  
  IF company_record IS NOT NULL THEN
    -- Empresa já existe - criar apenas profile e role como VIEWER
    INSERT INTO profiles (id, full_name, company_id, email)
    VALUES (
      NEW.id,
      user_full_name,
      company_record.id,
      NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      company_id = EXCLUDED.company_id;
    
    INSERT INTO user_roles (user_id, role, company_id, assigned_by_user_id)
    VALUES (
      NEW.id,
      'viewer'::user_role_type,
      company_record.id,
      NEW.id
    )
    ON CONFLICT (user_id, role) DO NOTHING;
    
  ELSE
    -- Empresa não existe - criar nova com CNPJ limpo
    INSERT INTO companies (name, cnpj)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Empresa'),
      NULLIF(clean_cnpj, '')
    )
    RETURNING * INTO company_record;
    
    -- Criar profile como ADMIN (primeiro usuário da empresa)
    INSERT INTO profiles (id, full_name, company_id, email)
    VALUES (
      NEW.id,
      user_full_name,
      company_record.id,
      NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      company_id = EXCLUDED.company_id;
    
    INSERT INTO user_roles (user_id, role, company_id, assigned_by_user_id)
    VALUES (
      NEW.id,
      'admin'::user_role_type,
      company_record.id,
      NEW.id
    )
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;