
# Corrigir avisos de duplicidade na importação LAIA por unidade (causa raiz identificada)

## Diagnóstico (confirmado no código atual)

O problema **não está mais no serviço de validação/importação**, e sim no wizard:

- Em `src/components/laia/LAIAImportWizard.tsx`, o estado inicial está assim:
  - `selectedBranchId = branchId || null`
  - `skipBranch = !!branchId`
- Como a tela atual é `/laia/unidade/:branchId`, `branchId` vem preenchido.
- Isso faz `skipBranch` começar como `true`.
- Na validação/importação, o wizard calcula:
  - `branchToUse = skipBranch ? null : selectedBranchId`
- Resultado: mesmo dentro de uma unidade, ele envia `null` para o serviço e a validação roda em escopo amplo da empresa, gerando os avisos de “já existe”.

Ou seja: a UI mostra “Importando para a filial X”, mas o payload está indo como sem filial.

## Implementação proposta

### 1) Tornar o branch da rota autoritativo no wizard
Arquivo: `src/components/laia/LAIAImportWizard.tsx`

- Introduzir um `effectiveBranchId` único:
  - Se `branchId` (prop) existir, usar **sempre ele**.
  - Só usar `skipBranch/selectedBranchId` quando `branchId` não existir.
- Substituir em ambos os pontos:
  - `handleValidate`
  - `handleImport`

Regra final:
- Contexto `/laia/unidade/:branchId` => validação/importação **sempre** por aquela unidade.
- Contexto sem unidade fixa => comportamento atual de seleção/“sem filial”.

### 2) Corrigir estado inicial para não anular filial pré-definida
Arquivo: `src/components/laia/LAIAImportWizard.tsx`

- Alterar inicialização de `skipBranch` para não depender de `branchId`.
- Sincronizar estado ao abrir modal:
  - Se veio `branchId`, pré-selecionar esse branch.
  - Garantir que não comece em “sem filial” por engano.

### 3) Ajustar UX da etapa “Filial” quando branch já vem da rota
Arquivo: `src/components/laia/LAIAImportWizard.tsx`

- Se `branchId` vier por prop:
  - Mostrar filial como fixa (somente leitura), ou
  - Pular diretamente a etapa de filial (opcional, recomendado para evitar erro humano).
- Esconder/desabilitar checkbox “Importar sem vincular a uma filial específica” nesse contexto.

## Sequência de execução

1. Refatorar cálculo de `effectiveBranchId`.
2. Aplicar `effectiveBranchId` em `validate(...)` e `importAssessments(...)`.
3. Ajustar estado inicial/sincronização da modal.
4. Ajustar UX da etapa de filial para contexto com branch fixo.
5. Validar fluxo completo com o mesmo XLSX do usuário.

## Critérios de aceite

- Em `/laia/unidade/314b7bd3-2237-4f4d-a5e4-a75b05d04d21`, a validação consulta apenas registros dessa unidade.
- Códigos existentes em outra unidade não geram aviso.
- Avisos “já existe” só aparecem quando o código já existe na **mesma** unidade.
- Importação persiste `branch_id` correto em todos os novos registros e setores criados.

## Observações técnicas

- `src/services/laiaImport.ts` já está preparado para receber `branchId` e aplicar filtro por `branch_id`; a correção principal é garantir que o wizard nunca envie `null` indevidamente no contexto de unidade.
- Não há necessidade de mudança de banco ou migration para este ajuste.
