

# Duas alteracoes no modulo LAIA

## 1. Remover infograficos da Visao Geral

No componente `LAIADashboard.tsx`, remover os dois graficos (BarChart de "Distribuicao por Atividade/Operacao" e PieChart de "Proporcao por Atividade"), mantendo apenas os 4 cards de resumo (Total, Significativos, Criticos, Nao Significativos).

### Alteracoes:
- **`src/components/laia/LAIADashboard.tsx`**: Remover linhas 122-197 (bloco `{/* Charts */}` inteiro), e remover imports nao utilizados (`PieChart`, `Pie`, `Cell`, `ResponsiveContainer`, `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `BarChart3`, `TrendingUp`, e a constante `SECTOR_COLORS`).

---

## 2. Tornar setores unicos por unidade (branch)

Atualmente a tabela `laia_sectors` tem escopo apenas por `company_id`, ou seja, setores sao compartilhados entre todas as unidades. O usuario precisa que cada unidade tenha seus proprios setores independentes.

### Alteracoes no banco de dados:
- Adicionar coluna `branch_id UUID REFERENCES branches(id)` na tabela `laia_sectors`
- Criar indice unico `(company_id, branch_id, code)` para garantir que o codigo do setor seja unico dentro de cada unidade
- Atualizar RLS policies para considerar `branch_id`

### Alteracoes no codigo:

**`src/services/laiaService.ts`**:
- `getLAIASectors()` passa a receber `branchId` como parametro e filtrar `.eq("branch_id", branchId)`
- `createLAIASector()` passa a receber e salvar `branch_id`

**`src/hooks/useLAIA.ts`**:
- `useLAIASectors()` passa a receber `branchId` como parametro e repassar ao service
- `useCreateLAIASector()` passa a receber `branchId`
- Query keys incluem `branchId` para cache correto

**`src/components/laia/LAIASectorManager.tsx`**:
- Receber `branchId` como prop
- Repassar `branchId` para os hooks de sectors

**`src/pages/LAIAUnidadePage.tsx`**:
- Passar `branchId` para `LAIASectorManager`

**`src/components/laia/LAIAAssessmentForm.tsx`**:
- Garantir que o dropdown de setores filtre por `branchId`

### Detalhes tecnicos da migracao SQL

```sql
ALTER TABLE laia_sectors ADD COLUMN branch_id UUID REFERENCES branches(id);
CREATE UNIQUE INDEX laia_sectors_company_branch_code ON laia_sectors(company_id, branch_id, code);
```

Os setores existentes (sem `branch_id`) continuarao funcionando como setores "globais" da empresa ate serem reassociados a unidades especificas. Novos setores criados dentro de uma unidade serao automaticamente vinculados ao `branch_id` correspondente.

