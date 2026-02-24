
## Diagnóstico confirmado (causa raiz)

Do I know what the issue is? **Sim**.

O erro atual (“**Setor '1' não encontrado**”) é consequência de duas coisas acontecendo juntas:

1. **Banco ainda tem uma restrição antiga ativa** em `laia_sectors`:
   - `UNIQUE (company_id, code)`  
   Essa restrição ainda impede repetir código de setor entre filiais da mesma empresa.

2. O importador tenta criar o setor na filial atual, **falha silenciosamente** na criação (por violação de unicidade), e depois continua:
   - como o setor não entra no `sectorMap`, cada linha cai em “setor não encontrado”.

### Evidências encontradas
- Índices/constraints atuais no banco incluem **ao mesmo tempo**:
  - `laia_sectors_company_branch_code` (novo, correto por filial)
  - `laia_sectors_company_id_code_key` (antigo, incorreto para o novo modelo)
- Na filial da rota (`/laia/unidade/314b7...`) não há setores ainda.
- Em outra filial da mesma empresa já existe `code = '1'`.
- Arquivo XLSX enviado usa `COD SET = 1`, então o conflito é esperado com a restrição antiga.

---

## Implementação proposta

### 1) Corrigir unicidade no banco (principal)
**Arquivo novo**: migration em `supabase/migrations/`  
Objetivo: remover a restrição antiga global por empresa e manter apenas por filial.

A migration deve:

1. Remover constraint antiga:
   - `ALTER TABLE public.laia_sectors DROP CONSTRAINT IF EXISTS laia_sectors_company_id_code_key;`
2. Garantir índice correto por filial:
   - manter/criar `UNIQUE (company_id, branch_id, code)` com `IF NOT EXISTS`.
3. (Opcional recomendado) normalizar para evitar diferença por caixa/espaço no futuro:
   - indexar `upper(trim(code))` no escopo `(company_id, branch_id, ...)` se quiser bloquear `1`, ` 1 `, `1 ` como duplicados na mesma filial.

---

### 2) Parar de “engolir” erro de criação de setor no import
**Arquivo**: `src/services/laiaImport.ts`

Ajustar `importLAIAAssessments` para que, ao falhar `createLAIASector`, ele:

1. Tente reconsultar o setor por `(company_id, branch_id, code)` (cobre concorrência/race condition).
2. Se não existir, registre erro explícito de criação do setor (ex.: “Falha ao criar setor X: duplicate key ...”).
3. Evite transformar tudo em erro genérico “setor não encontrado” sem contexto.
4. Opcional: interromper cedo quando nenhum setor faltante pôde ser criado, para não gerar dezenas de erros repetidos por linha.

---

### 3) Melhorar feedback no resultado da importação
**Arquivo**: `src/components/laia/LAIAImportWizard.tsx` (somente mensagem/UI de erro)

- Exibir bloco de “falhas de criação de setor” separado das falhas por linha.
- Mensagem orientada ao usuário:
  - “Há conflito de unicidade de setor no banco. Corrigimos para escopo por filial.”

---

## Sequência de execução

1. Criar migration para remover `UNIQUE(company_id, code)` legado.
2. Validar que permanece somente unicidade por filial.
3. Ajustar tratamento de erro em `importLAIAAssessments`.
4. Ajustar apresentação de erro no wizard.
5. Teste E2E com o mesmo `asp.imp_SJP.xlsx` na rota da filial `314b7...`.

---

## Critérios de aceite

1. Importando em `/laia/unidade/314b7...`, setores `1,2,...` são criados normalmente mesmo se já existirem em outra filial.
2. Não aparece mais “Setor X não encontrado” quando o problema real for criação bloqueada.
3. Se houver erro de criação real, o motivo aparece claramente no resultado.
4. Após import:
   - `laia_sectors.branch_id` = filial atual
   - `laia_assessments.branch_id` = filial atual
   - registros visíveis corretamente no dashboard da filial.

---

## Observações técnicas

- O ajuste anterior no wizard (uso de `effectiveBranchId`) está correto e deve ser mantido.
- O bloqueio atual é **estrutural de banco** (constraint antiga), não de branchId no frontend.
- Não é necessária mudança no formato do XLSX para resolver este erro.
