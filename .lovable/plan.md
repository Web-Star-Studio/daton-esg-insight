

# Oferecer criação de legislações não encontradas após import simplificado

## Problema
No formato simplificado, quando uma legislação não é encontrada no banco, ela é ignorada com um warning. O usuário não tem opção de criar essas legislações a partir dos dados da planilha.

## Solução

### 1. Rastrear linhas não encontradas no resultado
**Arquivo: `src/services/legislationImport.ts`**
- Adicionar um novo campo `unmatchedRows` ao `LegislationImportResult`:
  ```typescript
  unmatchedRows: ParsedLegislation[];
  ```
- No bloco onde se emite o warning "não encontrada no banco" (linha ~1070), além do detail, guardar o `ParsedLegislation` completo em `result.unmatchedRows`.

### 2. Botão "Criar legislações não encontradas" na tela de resultado
**Arquivo: `src/components/legislation/LegislationImportDialog.tsx`**
- Na stage `result`, se `importResult.unmatchedRows.length > 0`, exibir um alerta informativo com contagem e um botão "Criar X legislações não encontradas".
- Ao clicar, chamar `importLegislations` novamente com os `unmatchedRows`, mas com `isSimplifiedFormat: false` (forçando a criação) e um `norm_type` default (ex: "Outro") para linhas sem tipo explícito.
- Mostrar progresso e atualizar o resultado ao final.

### 3. Fluxo alternativo: pré-importação
- Na stage `preview`, se o formato é simplificado, exibir um checkbox: **"Criar legislações que não existem no banco"** (default: desmarcado).
- Se marcado, o import service pula o `continue` na linha ~1078 e segue para o bloco de INSERT (linhas 1081+), usando `norm_type: 'Outro'` como fallback.

### Detalhes técnicos
- O `ParsedLegislation` já contém `title`, `summary`, `jurisdiction`, `unitEvaluations` — dados suficientes para criar a legislação.
- Para o `norm_type` ausente no formato simplificado, usar `'Outro'` como default.
- O campo `unmatchedRows` é inicializado como `[]` junto com os demais campos do result.
- A opção de criação pós-import é um segundo `importLegislations` call com flag `forceCreate: true` que ignora a guard de `isSimplifiedFormat`.

### Arquivos a alterar
- `src/services/legislationImport.ts` — tipo `LegislationImportResult`, lógica de skip, nova flag `forceCreate`
- `src/components/legislation/LegislationImportDialog.tsx` — UI do resultado + checkbox na preview

