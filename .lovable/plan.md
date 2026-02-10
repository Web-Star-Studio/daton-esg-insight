

## Problema Identificado

O Supabase retorna no maximo **1000 linhas por consulta** por padrao. Voce tem **1898 colaboradores ativos**, entao a query ordenada por nome retorna apenas os primeiros 1000 (letras A ate J) e ignora o restante.

Isso afeta **dois modais**:
- `TrainingProgramModal.tsx` (query: `employees-for-training-modal`)
- `EmployeeTrainingModal.tsx` (query: `employees-for-training-modal-2`)

## Solucao

Adicionar `.range(0, 5000)` nas queries de ambos os modais para garantir que todos os colaboradores sejam retornados. O Supabase suporta ate ~10.000 linhas com range explicito.

## Arquivos a Alterar

### 1. `src/components/TrainingProgramModal.tsx` (linha ~112)

Antes:
```typescript
.order("full_name");
```

Depois:
```typescript
.order("full_name")
.range(0, 4999);
```

### 2. `src/components/EmployeeTrainingModal.tsx` (query similar)

Aplicar a mesma correcao `.range(0, 4999)` na query de employees.

### 3. Verificar outros modais

Revisar `RescheduleTrainingModal.tsx` e `BenefitConfigurationModal.tsx` para o mesmo problema.

## Impacto

- Nenhuma mudanca funcional, de layout ou de copy
- Apenas garante que todos os colaboradores sejam carregados
- Risco: nenhum
