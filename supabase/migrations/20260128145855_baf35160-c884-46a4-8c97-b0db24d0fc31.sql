-- Fix race condition: use DO UPDATE instead of DO NOTHING
-- This ensures the role from handle_new_user takes precedence over the default viewer from on_profile_created_ensure_role

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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
  -- Se tem flag skip_trigger, nao fazer nada
  IF (NEW.raw_user_meta_data->>'skip_trigger')::boolean = true THEN
    RETURN NEW;
  END IF;

  -- Extrair dados dos metadados
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'viewer');
  user_department := NEW.raw_user_meta_data->>'department';
  user_phone := NEW.raw_user_meta_data->>'phone';
  
  -- CASO 1: Usuario CONVIDADO
  IF NEW.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    BEGIN
      invited_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      invited_company_id := NULL;
    END;
    
    IF invited_company_id IS NOT NULL THEN
      SELECT * INTO company_record FROM companies WHERE id = invited_company_id;
      
      IF company_record IS NOT NULL THEN
        INSERT INTO profiles (id, full_name, company_id, email, department, phone, role)
        VALUES (NEW.id, user_full_name, invited_company_id, NEW.email, user_department, user_phone, user_role::user_role_type)
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          company_id = EXCLUDED.company_id,
          email = EXCLUDED.email,
          department = EXCLUDED.department,
          phone = EXCLUDED.phone,
          role = EXCLUDED.role;
        
        BEGIN
          invited_by_user := (NEW.raw_user_meta_data->>'invited_by')::uuid;
        EXCEPTION WHEN OTHERS THEN
          invited_by_user := NEW.id;
        END;
        
        INSERT INTO user_roles (user_id, role, company_id, assigned_by_user_id)
        VALUES (NEW.id, user_role::user_role_type, invited_company_id, COALESCE(invited_by_user, NEW.id))
        ON CONFLICT (user_id, company_id) DO UPDATE SET
          role = EXCLUDED.role,
          assigned_by_user_id = EXCLUDED.assigned_by_user_id,
          updated_at = now();
        
        RETURN NEW;
      END IF;
    END IF;
  END IF;
  
  -- CASO 2: Usuario fazendo SIGNUP com CNPJ
  clean_cnpj := regexp_replace(COALESCE(NEW.raw_user_meta_data->>'cnpj', ''), '[^0-9]', '', 'g');
  
  IF clean_cnpj != '' AND length(clean_cnpj) >= 14 THEN
    SELECT * INTO company_record 
    FROM companies 
    WHERE regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g') = clean_cnpj
    LIMIT 1;
  END IF;
  
  IF company_record IS NOT NULL THEN
    -- Empresa ja existe - criar como VIEWER
    INSERT INTO profiles (id, full_name, company_id, email, role)
    VALUES (NEW.id, user_full_name, company_record.id, NEW.email, 'viewer')
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      company_id = EXCLUDED.company_id,
      email = EXCLUDED.email;
    
    -- CORRIGIDO: Usar DO UPDATE para garantir role correto
    INSERT INTO user_roles (user_id, role, company_id, assigned_by_user_id)
    VALUES (NEW.id, 'viewer'::user_role_type, company_record.id, NEW.id)
    ON CONFLICT (user_id, company_id) DO UPDATE SET
      role = EXCLUDED.role,
      assigned_by_user_id = EXCLUDED.assigned_by_user_id,
      updated_at = now();
    
  ELSEIF clean_cnpj IS NOT NULL AND clean_cnpj != '' AND length(clean_cnpj) >= 14 THEN
    -- Empresa nao existe - CRIAR EMPRESA e usuario como ADMIN
    INSERT INTO companies (name, cnpj)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'Empresa'), clean_cnpj)
    RETURNING * INTO company_record;
    
    INSERT INTO profiles (id, full_name, company_id, email, role)
    VALUES (NEW.id, user_full_name, company_record.id, NEW.email, 'admin')
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      company_id = EXCLUDED.company_id,
      email = EXCLUDED.email;
    
    -- CORRIGIDO: Usar DO UPDATE para garantir admin role
    INSERT INTO user_roles (user_id, role, company_id, assigned_by_user_id)
    VALUES (NEW.id, 'admin'::user_role_type, company_record.id, NEW.id)
    ON CONFLICT (user_id, company_id) DO UPDATE SET
      role = EXCLUDED.role,
      assigned_by_user_id = EXCLUDED.assigned_by_user_id,
      updated_at = now();
  ELSE
    RAISE EXCEPTION 'Nao e possivel criar usuario sem empresa ou CNPJ valido';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix Douglas's current role to admin
UPDATE user_roles 
SET role = 'admin', updated_at = now()
WHERE user_id = 'b3b675c3-3a02-4e93-9e69-8827c412f933'
AND company_id = 'e50e7445-e38e-450a-8c51-fb5918b2faf3';