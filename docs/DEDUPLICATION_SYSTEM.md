# Sistema de Deduplicação Configurável

## 🎯 Visão Geral

O sistema de deduplicação configurável do Daton permite que você defina regras personalizadas para evitar registros duplicados no banco de dados durante o processamento automático de documentos.

## 🔧 Como Funciona

### Fluxo de Deduplicação

```
┌─────────────────────────────────────────────────────────┐
│  Documento Processado                                    │
│  Dados extraídos pela IA                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  intelligent-data-processor                              │
│  Prepara operação de inserção                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  Buscar Regras de            │
        │  Deduplicação                │
        │  (por tabela + company_id)   │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  Para cada regra (por        │
        │  ordem de prioridade):       │
        │                              │
        │  1. Verificar campos únicos  │
        │  2. Buscar registro          │
        │     existente                │
        └──────────┬───────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
      ▼                         ▼
┌───────────┐          ┌────────────────┐
│ Duplicata │          │ Não duplicado  │
│ Encontrada│          │                │
└─────┬─────┘          └────────┬───────┘
      │                         │
      │                         ▼
      │               ┌──────────────────┐
      │               │ INSERT normal    │
      │               └──────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ Aplicar Estratégia de Mesclagem:        │
│                                          │
│ • skip_if_exists → Pular inserção       │
│ • update_existing → Atualizar existente │
│ • merge_fields → Mesclar campos         │
└──────────────────────────────────────────┘
```

## 📊 Estrutura da Tabela

### `deduplication_rules`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `company_id` | UUID | Empresa dona da regra |
| `target_table` | TEXT | Tabela alvo (ex: `emission_sources`) |
| `rule_name` | TEXT | Nome descritivo da regra |
| `unique_fields` | JSONB | Array de campos que devem ser únicos |
| `merge_strategy` | TEXT | Estratégia ao encontrar duplicata |
| `enabled` | BOOLEAN | Se a regra está ativa |
| `priority` | INTEGER | Ordem de aplicação (menor = maior prioridade) |
| `created_by_user_id` | UUID | Usuário que criou |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Última atualização |

## 🎛️ Estratégias de Mesclagem

### 1. Skip if Exists (Pular se Existir)
**Uso:** Quando você quer manter o registro original e ignorar novos dados duplicados

**Comportamento:**
- Verifica se existe registro com os mesmos valores nos campos únicos
- Se existe, **pula** a inserção
- O registro original permanece intacto
- Operação registrada como `SKIPPED`

**Exemplo:**
```typescript
{
  target_table: 'licenses',
  unique_fields: ['license_number'],
  merge_strategy: 'skip_if_exists'
}
```

### 2. Update Existing (Atualizar Existente)
**Uso:** Quando você quer substituir dados antigos por dados novos

**Comportamento:**
- Verifica se existe registro com os mesmos valores nos campos únicos
- Se existe, **atualiza** todos os campos com os novos valores
- O registro existente é completamente sobrescrito
- Operação registrada como `UPDATED`

**Exemplo:**
```typescript
{
  target_table: 'activity_data',
  unique_fields: ['emission_source_id', 'period_start_date'],
  merge_strategy: 'update_existing'
}
```

### 3. Merge Fields (Mesclar Campos)
**Uso:** Quando você quer combinar dados novos e antigos

**Comportamento:**
- Verifica se existe registro com os mesmos valores nos campos únicos
- Se existe, **mescla** os campos:
  - Mantém valores existentes para campos nulos/vazios nos novos dados
  - Sobrescreve com novos valores apenas campos não-nulos
- Operação registrada como `MERGED`

**Exemplo:**
```typescript
{
  target_table: 'employees',
  unique_fields: ['cpf'],
  merge_strategy: 'merge_fields'
}
```

**Cenário de mesclagem:**
```javascript
// Registro existente
{ cpf: '123', name: 'João', email: 'joao@email.com', phone: null }

// Novos dados
{ cpf: '123', name: 'João Silva', email: null, phone: '999999999' }

// Resultado após merge
{ cpf: '123', name: 'João Silva', email: 'joao@email.com', phone: '999999999' }
```

## 🎯 Configuração de Regras

### Interface de Gerenciamento

Acesse: **Documentos → Deduplicação**

### Criando uma Nova Regra

1. **Nome da Regra:** Descrição clara (ex: "Funcionário por CPF")
2. **Tabela Alvo:** Selecione a tabela no dropdown
3. **Campos Únicos:** 
   - Digite o nome do campo e clique em "+"
   - Ou clique nas sugestões automáticas
   - Múltiplos campos formam uma chave composta
4. **Estratégia:** Escolha como tratar duplicatas
5. **Prioridade:** Número (0 = maior prioridade)

### Exemplo Prático: Emissões GEE

**Problema:** Mesma fonte de emissão sendo inserida múltiplas vezes

**Solução:**
```typescript
{
  rule_name: "Fonte de emissão por nome e escopo",
  target_table: "emission_sources",
  unique_fields: ["source_name", "scope"],
  merge_strategy: "skip_if_exists",
  priority: 1
}
```

**Resultado:** Se processar um documento com "Frota de Veículos - Escopo 1", e essa fonte já existir, a inserção será pulada automaticamente.

## 📝 Regras Padrão

O sistema cria automaticamente regras padrão para as tabelas mais comuns:

### 1. Fontes de Emissão
- **Campos:** `source_name`, `scope`
- **Estratégia:** `skip_if_exists`
- **Motivo:** Evitar fontes duplicadas

### 2. Dados de Atividade
- **Campos:** `emission_source_id`, `period_start_date`, `period_end_date`
- **Estratégia:** `update_existing`
- **Motivo:** Atualizar dados de períodos já registrados

### 3. Resíduos
- **Campos:** `waste_type_id`, `log_date`
- **Estratégia:** `skip_if_exists`
- **Motivo:** Evitar logs duplicados no mesmo dia

### 4. Licenças
- **Campos:** `license_number`
- **Estratégia:** `update_existing`
- **Motivo:** Atualizar dados da licença ao reprocessar

### 5. Funcionários
- **Campos:** `cpf`
- **Estratégia:** `update_existing`
- **Motivo:** Atualizar cadastro ao encontrar CPF existente

## 🔍 Monitoramento e Logs

### Logs da Edge Function

Os logs do `intelligent-data-processor` mostram a aplicação das regras:

```
🔍 Duplicate found in emission_sources using rule: Fonte de emissão por nome e escopo
⏭️ Skipping insert (duplicate found, strategy: skip_if_exists)
```

```
🔍 Duplicate found in activity_data using rule: Dado de atividade por fonte e período
🔄 Updating existing record (strategy: update_existing)
```

```
🔍 Duplicate found in employees using rule: Funcionário por CPF
🔀 Merging fields (strategy: merge_fields)
```

### Resultado das Operações

O resultado inclui informações de deduplicação:

```json
{
  "successful_operations": [
    {
      "table": "emission_sources",
      "operation": "SKIPPED",
      "confidence": 95,
      "reasoning": "Duplicata encontrada. Alta confiança na classificação",
      "deduplication": {
        "rule_applied": "Fonte de emissão por nome e escopo",
        "strategy": "skip_if_exists",
        "existing_record_id": "uuid-do-registro-existente"
      }
    }
  ]
}
```

## 🎨 Boas Práticas

### 1. Prioridade das Regras

Use prioridades quando múltiplas regras se aplicam à mesma tabela:

```typescript
// Prioridade 1 (aplicada primeiro)
{
  rule_name: "Licença por número completo",
  unique_fields: ["license_number"],
  priority: 1
}

// Prioridade 2 (aplicada se a primeira não encontrar duplicata)
{
  rule_name: "Licença por tipo e órgão",
  unique_fields: ["license_type", "issuing_agency"],
  priority: 2
}
```

### 2. Chaves Compostas

Use múltiplos campos quando um único campo não é suficientemente único:

```typescript
// ❌ FRACO: Apenas data
{ unique_fields: ["log_date"] }

// ✅ FORTE: Tipo + data + destino
{ unique_fields: ["waste_type_id", "log_date", "destination_id"] }
```

### 3. Estratégia por Caso de Uso

| Caso de Uso | Estratégia Recomendada | Motivo |
|-------------|----------------------|--------|
| Dados mestres (cadastros) | `update_existing` | Manter cadastro atualizado |
| Histórico/logs | `skip_if_exists` | Preservar histórico original |
| Dados incrementais | `merge_fields` | Complementar informações |

### 4. Teste Antes de Ativar

1. Crie a regra com `enabled: false`
2. Teste com documentos reais
3. Verifique os logs
4. Ative quando confiante

## 🔧 Gerenciamento via API

### Criar Regra

```typescript
import { createDeduplicationRule } from '@/services/deduplication';

await createDeduplicationRule({
  target_table: 'suppliers',
  rule_name: 'Fornecedor por CNPJ',
  unique_fields: ['cnpj'],
  merge_strategy: 'update_existing',
  priority: 1
});
```

### Listar Regras

```typescript
import { getDeduplicationRules } from '@/services/deduplication';

const rules = await getDeduplicationRules();
```

### Atualizar Regra

```typescript
import { updateDeduplicationRule } from '@/services/deduplication';

await updateDeduplicationRule('rule-id', {
  enabled: false,
  merge_strategy: 'skip_if_exists'
});
```

### Deletar Regra

```typescript
import { deleteDeduplicationRule } from '@/services/deduplication';

await deleteDeduplicationRule('rule-id');
```

## 🚨 Troubleshooting

### Problema: Duplicatas ainda sendo inseridas

**Possíveis causas:**
1. Regra desabilitada (`enabled: false`)
2. Campos únicos não estão presentes nos dados extraídos
3. Valores dos campos não batem exatamente (case-sensitive)
4. Prioridade baixa e outra regra foi aplicada primeiro

**Solução:**
1. Verificar se regra está ativa
2. Ver logs da edge function
3. Ajustar campos únicos ou normalização dos dados

### Problema: Dados legítimos sendo bloqueados

**Causa:** Regra muito restritiva (poucos campos únicos)

**Solução:** Adicionar mais campos à chave única

```typescript
// ❌ Muito restritivo
{ unique_fields: ["date"] }

// ✅ Mais específico
{ unique_fields: ["date", "location", "equipment_id"] }
```

### Problema: Dados sendo atualizados incorretamente

**Causa:** Estratégia `update_existing` quando deveria ser `merge_fields`

**Solução:** Trocar estratégia ou ajustar lógica de inserção

## 📊 Tabelas Suportadas

Configurações recomendadas para cada tabela:

| Tabela | Campos Sugeridos | Estratégia |
|--------|------------------|------------|
| `emission_sources` | `source_name`, `scope` | `skip_if_exists` |
| `activity_data` | `emission_source_id`, `period_start_date` | `update_existing` |
| `waste_logs` | `waste_type_id`, `log_date` | `skip_if_exists` |
| `licenses` | `license_number` | `update_existing` |
| `employees` | `cpf` | `update_existing` |
| `suppliers` | `cnpj` | `update_existing` |
| `energy_consumption` | `meter_id`, `reading_date` | `update_existing` |
| `water_consumption` | `meter_id`, `reading_date` | `update_existing` |
| `safety_incidents` | `incident_date`, `location` | `skip_if_exists` |
| `training_programs` | `program_name`, `start_date` | `merge_fields` |

## 🔗 Integração com Pipeline

O sistema de deduplicação é automaticamente aplicado em:

1. ✅ `intelligent-data-processor` - Processamento manual
2. ✅ `intelligent-pipeline-orchestrator` - Processamento automático via pipeline
3. ✅ Todas as inserções feitas via extração de documentos

**Não se aplica a:**
- ❌ Inserções manuais via UI
- ❌ Importações CSV diretas
- ❌ APIs externas

## 📚 Referências

- **Arquivo de Serviço:** `src/services/deduplication.ts`
- **Componente de UI:** `src/components/deduplication/DeduplicationRulesManager.tsx`
- **Edge Function:** `supabase/functions/intelligent-data-processor/index.ts`
- **Migration:** `supabase/migrations/[timestamp]_create_deduplication_rules.sql`

---

**Última atualização:** 2025-01-11  
**Versão:** 1.0
