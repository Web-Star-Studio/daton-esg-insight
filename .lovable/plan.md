
# Plano: Corrigir Role Errada ao Criar Organizacao

## Diagnostico

Existe uma **condicao de corrida** entre dois triggers:

```text
handle_new_user (auth.users)
    |
    v
INSERT INTO profiles (role='admin')
    |
    v  <- trigger fires immediately
on_profile_created_ensure_role (profiles)
    |
    v
INSERT INTO user_roles (role='viewer')  <- viewer inserted first!
    |
    v
handle_new_user continues...
    |
    v
INSERT INTO user_roles (role='admin') ON CONFLICT DO NOTHING
    |
    v
Conflict detected -> admin NOT applied -> user stays viewer
```

## Solucao

Alterar o trigger `handle_new_user` para usar `ON CONFLICT DO UPDATE` em vez de `ON CONFLICT DO NOTHING` para a insercao de user_roles.

---

## Alteracao SQL Necessaria

### Trigger Atual (problema):

```sql
INSERT INTO user_roles (user_id, role, company_id, assigned_by_user_id)
VALUES (NEW.id, 'admin'::user_role_type, company_record.id, NEW.id)
ON CONFLICT (user_id, company_id) DO NOTHING;  -- BUG: viewer role nao e atualizado
```

### Trigger Corrigido:

```sql
INSERT INTO user_roles (user_id, role, company_id, assigned_by_user_id)
VALUES (NEW.id, 'admin'::user_role_type, company_record.id, NEW.id)
ON CONFLICT (user_id, company_id) DO UPDATE SET
  role = EXCLUDED.role,
  assigned_by_user_id = EXCLUDED.assigned_by_user_id,
  updated_at = now();
```

---

## Locais a Alterar no Trigger

O trigger `handle_new_user` tem 3 lugares onde insere user_roles:

1. **Linha ~45** (usuario convidado): Ja usa `DO UPDATE` - OK
2. **Linha ~75** (CNPJ existente - viewer): Mudar para `DO UPDATE`
3. **Linha ~90** (CNPJ novo - admin): Mudar para `DO UPDATE`

---

## Migracao SQL Completa

```sql
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Corrigir Usuario Existente

Depois de aplicar a migracao, corrigir o role de Douglas:

```sql
UPDATE user_roles 
SET role = 'admin', updated_at = now()
WHERE user_id = 'b3b675c3-3a02-4e93-9e69-8827c412f933'
AND company_id = 'e50e7445-e38e-450a-8c51-fb5918b2faf3';
```

---

## Resumo

| Alteracao | Descricao |
|-----------|-----------|
| Migracao SQL | Atualizar trigger `handle_new_user` para usar `DO UPDATE` |
| Fix manual | Corrigir role do usuario Douglas para `admin` |

---

## Resultado Esperado

1. Novos usuarios que criam empresa serao ADMIN
2. Novos usuarios que entram em empresa existente serao VIEWER
3. Usuarios convidados terao o role definido pelo admin
4. Douglas tera acesso admin a gestao de usuarios
