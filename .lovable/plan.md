

## Plan: Corrigir Mapeamento de Valores de Unidade na Importação de Legislações

### Problema

A planilha enviada (`federais_sem_formula.xlsx`) tem o formato:
- Colunas: `RESUMO E TÍTULO | POA | PIR | GO | PREAL | SBC | SJP | DUC | IRA | SC | ES | CE | CHUÍ | APLICABILIDADE | ATENDIMENTO | STATUS | EVIDÊNCIA DE ATENDIMENTO | ENVIADO E DATA | PRÓXIMA VERIFICAÇÃO | FONTE`
- Os valores nas colunas de unidades (POA, PIR, etc.) precisam ser mapeados corretamente

**Mapeamento atual (INCORRETO):**
- 1 = Real / Pending
- 2 = Potencial / Pending
- 3 = Pendente / Pending
- x = Pendente / Pending
- z = ignorado (null)

**Mapeamento correto (solicitado):**
- 1 = Potencial, não aplicado → `applicability: 'potential'`, `compliance_status: 'pending'`
- 2 = OK, Conforme → `applicability: 'real'`, `compliance_status: 'conforme'`
- 3 = Não conforme → `applicability: 'real'`, `compliance_status: 'adequacao'`
- x = Sem avaliação → `applicability: 'pending'`, `compliance_status: 'pending'`
- z = Não pertinente → `applicability: 'na'`, `compliance_status: 'na'` (criar registro em vez de ignorar)

### Problemas Adicionais Detectados

1. **Header detection falha** para esta planilha — não tem colunas "TIPO", "Nº" ou "TEMÁTICA". Tem "RESUMO E TÍTULO" + "APLICABILIDADE" como pattern. O `findHeaderRow` e `findLegislationsSheet` precisam reconhecer esse padrão.

2. **Colunas extras do formato**: `ENVIADO E DATA` e `PRÓXIMA VERIFICAÇÃO` podem ser mapeadas para `general_notes` e `review_frequency` respectivamente.

### Alterações

**Arquivo: `src/services/legislationImport.ts`**

1. **`mapUnitValue` (linhas 435-480)**: Atualizar o mapeamento dos 5 valores conforme solicitado. Valor `z` agora cria registro com `applicability: 'na'` em vez de retornar `null`.

2. **`UnitEvaluation` interface (linhas 9-14)**: Adicionar `'na'` ao tipo de `complianceStatus`.

3. **`findHeaderRow` (linhas 182-221)**: Adicionar pattern para detectar `RESUMO E TÍTULO` + `APLICABILIDADE` como header válido.

4. **`findLegislationsSheet` (linhas 146-180)**: Adicionar pattern `RESUMO E TÍTULO` + `APLICABILIDADE`.

5. **Parsing de colunas**: Garantir que `ENVIADO E DATA` seja capturado em `general_notes` e `PRÓXIMA VERIFICAÇÃO` em dados relevantes.

### Resumo Técnico

- 1 arquivo alterado: `src/services/legislationImport.ts`
- Mudança principal: corrigir a função `mapUnitValue` para os 5 valores
- Mudança secundária: garantir detecção do header neste formato simplificado de planilha

