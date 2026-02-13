
# Correcao do Erro de Signup com CNPJ Duplicado

## Problema
Ao tentar registrar uma nova empresa com um CNPJ que ja existe na tabela `companies`, o trigger `handle_new_user` falha com o erro `duplicate key value violates unique constraint "companies_cnpj_key"`. A versao atual do trigger (migracao 20260128) removeu o bloco EXCEPTION que tratava esse caso, fazendo com que o erro se propague e aborte toda a transacao de signup.

## Causa Raiz
O trigger faz um SELECT para verificar se a empresa ja existe, mas nao possui um tratamento de falha (EXCEPTION handler) caso o INSERT subsequente falhe por constraint de unicidade. Mesmo que o SELECT funcione na maioria dos casos, sem o handler de excecao qualquer falha no INSERT aborta a transacao inteira.

## Solucao

### 1. Migracao SQL - Adicionar EXCEPTION handler ao trigger
Recriar a funcao `handle_new_user` com um bloco `EXCEPTION WHEN unique_violation` ao redor do INSERT na tabela companies. Quando a violacao de unicidade ocorrer, o handler fara um SELECT para buscar a empresa existente e continuara o fluxo normalmente, associando o novo usuario como `viewer`.

Mudancas especificas no trigger:
- Envolver o bloco do INSERT em companies (linhas 94-113 do trigger atual) em um sub-bloco BEGIN...EXCEPTION
- No handler de `unique_violation`, fazer SELECT na empresa existente pelo CNPJ limpo
- Prosseguir criando o profile e user_role com a empresa encontrada (como viewer)

### 2. Frontend - Validacao de CNPJ antes do signup

**Arquivo:** `src/pages/Auth.tsx`
- Antes de chamar `registerCompany`, consultar a tabela `companies` para verificar se o CNPJ ja esta cadastrado
- Se o CNPJ ja existir, exibir mensagem informativa ao usuario: "Este CNPJ ja esta registrado. Seu cadastro sera vinculado a empresa existente como visualizador, pendente de aprovacao do administrador."
- Permitir que o usuario prossiga com o signup mesmo assim (o trigger associara como viewer)
- Isso evita a surpresa do erro e melhora a UX

### 3. Frontend - Melhor tratamento de erro no registro

**Arquivo:** `src/services/auth.ts` (metodo `registerCompany`)
- Melhorar a mensagem de erro para erros de unique constraint, traduzindo "Database error saving new user" para uma mensagem amigavel como "CNPJ ja cadastrado. Entre em contato com o administrador da empresa."

## Detalhes Tecnicos

### SQL do trigger corrigido (trecho relevante):
```text
-- Onde atualmente faz INSERT direto:
INSERT INTO companies (name, cnpj) VALUES (...) RETURNING * INTO company_record;

-- Sera envolvido em:
BEGIN
  INSERT INTO companies (name, cnpj) VALUES (...) RETURNING * INTO company_record;
EXCEPTION WHEN unique_violation THEN
  SELECT * INTO company_record FROM companies 
  WHERE regexp_replace(COALESCE(cnpj,''),'[^0-9]','','g') = clean_cnpj LIMIT 1;
  IF company_record IS NULL THEN
    RAISE EXCEPTION 'Empresa nao encontrada apos violacao de unicidade';
  END IF;
END;
-- Continua criando profile como viewer (nao admin)
```

### Validacao frontend no Auth.tsx:
- Query Supabase: `supabase.from('companies').select('id, name').eq('cnpj', cleanCnpj).maybeSingle()`
- Se encontrar, mostrar alerta informativo e ajustar o fluxo
- Se nao encontrar, prosseguir normalmente
