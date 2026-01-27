
## Objetivo
Corrigir definitivamente o erro ao apagar uma filial (ex.: `training_programs_branch_id_fkey`), garantindo que a exclusão “inteligente” realmente remova todos os dados dependentes em ordem correta e depois delete a filial, enquanto **desvincula colaboradores** (branch_id = NULL).

## O que está acontecendo agora (diagnóstico)
Mesmo com `deleteBranchWithDependencies`, o erro de FK continua porque a limpeza não está completa/garantida:

1) A função **não valida erros** das deleções intermediárias.  
   - Se qualquer `delete()` falhar por RLS/FK, a execução segue e, no final, a exclusão da filial falha com a FK.
2) Existe uma tabela dependente **que não está sendo removida**: `training_schedule_participants`.  
   - Ela referencia `training_schedules`. Se houver participantes, a deleção de `training_schedules` falha, o que impede a deleção de `training_programs`, e então a deleção de `branches` falha.

Pelo schema (`src/integrations/supabase/types.ts`) há FK:
- `training_schedule_participants.schedule_id -> training_schedules.id`
- `training_schedules.training_program_id -> training_programs.id`
- `training_programs.branch_id -> branches.id`

## Mudanças planejadas (frontend) – sem mexer no banco
Vamos ajustar a exclusão para:
- Remover também `training_schedule_participants`
- Checar e tratar `error` em cada etapa, com mensagens mais claras
- Opcionalmente: melhorar robustez removendo avaliações por `training_program_id` (e não só por `employee_training_id`)

### 1) Ajustar `deleteBranchWithDependencies` em `src/services/branches.ts`
#### Nova ordem (mais completa)
1. Buscar `training_programs` da filial: ids
2. Buscar `training_schedules` desses programas: ids
3. Deletar `training_schedule_participants` pelos `schedule_id`
4. Deletar `training_schedules` pelos `training_program_id`
5. (Recomendado) Deletar `training_efficacy_evaluations` por `training_program_id` (mais direto)  
6. Deletar `employee_trainings` por `training_program_id`
7. Deletar `training_documents` por `training_program_id`
8. Deletar `training_programs` por `branch_id`
9. Deletar `laia_assessments` por `branch_id`
10. Deletar `legislation_unit_compliance` por `branch_id`
11. Deletar `legislation_compliance_profiles` por `branch_id`
12. Desvincular `employees`: `update branch_id = null` por `branch_id`
13. Deletar `branches` por `id`

#### Validação de erros (crítico)
Em cada chamada `await supabase.from(...).delete()/update()/select()`, capturar `{ error }` e:
- Se `error`, lançar `throw new Error("Falha ao remover [ETAPA]: " + error.message)`
- Isso evita “seguir adiante” e só descobrir no final.

#### Logs/telemetria (para debug)
Adicionar logs com contagens (qtd de programas, schedules, participantes) antes de deletar, para ficar fácil diagnosticar em caso de RLS ou registros inesperados.

### 2) Ajustes menores no hook `useDeleteBranch`
Manter o hook como está, mas garantir que o erro exibido no toast seja o novo erro “da etapa”, e não apenas o FK final.
Opcional: invalidar queries adicionais (ex.: `training-schedules`, `training-documents`) se existirem chaves no projeto.

### 3) (Opcional) Melhorar o diálogo de confirmação em `GestaoFiliais.tsx`
Já existe aviso; podemos acrescentar a linha “participantes de agenda” para ficar totalmente transparente:
- “Agendamentos e participantes de agendamentos” dentro dos itens de treinamento.

## Alternativa mais robusta (se ainda houver bloqueio por RLS)
Se após corrigir a cascata ainda falhar por RLS (por exemplo, se o usuário não tiver permissão de deletar em alguma tabela), aí o caminho certo é mover a operação para o banco:

- Criar uma função SQL `public.safe_delete_branch(branch_id uuid)` com `security definer` que:
  - Executa a mesma cascata em transação
  - Desvincula employees
  - Deleta a branch
- O frontend chama `supabase.rpc('safe_delete_branch', { branch_id: id })`

Essa alternativa é a mais confiável para “deleção atômica” e evita inconsistências, mas exige migration (mudança de schema/DB).

## Critérios de aceite (como validar)
1) Escolher uma filial que hoje dá erro ao excluir.
2) Clicar em excluir e confirmar.
3) Resultado esperado:
   - Toast de sucesso
   - Filial some da listagem
   - Não deve existir nenhum `training_programs` com `branch_id` daquela filial
   - Colaboradores antes vinculados continuam existindo, com `branch_id = NULL`
4) Caso falhe:
   - Toast deve indicar exatamente a etapa (ex.: “Falha ao remover participantes de agenda: …”)

## Arquivos que serão alterados (previsto)
- `src/services/branches.ts` (principal: completar cascata + checar erros)
- `src/pages/GestaoFiliais.tsx` (opcional: texto do alerta)

## Riscos e mitigação
- Risco: existirem outras tabelas novas no futuro referenciando `training_programs`/`branches`.
  - Mitigação: mensagens por etapa + logs + (opcional) migrar para RPC transacional no banco.
