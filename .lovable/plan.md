
Objetivo: corrigir o import para realmente atualizar status por unidade quando a legislação já existe (em vez de mostrar “sem dados para atualizar”).

Diagnóstico (confirmado):
- O problema principal não é mais o matching da legislação.
- O upsert em `legislation_unit_compliance` está falhando no banco por trigger inválido.
- A função `public.notify_unit_compliance_issues()` usa campos que não existem nessa tabela (`NEW.unit_id`, `NEW.pending_requirements`) e isso quebra INSERT/UPDATE.
- Evidência: a tabela `legislation_unit_compliance` está com `count = 0`, mesmo após importações com milhares de avaliações detectadas.
- Além disso, o frontend/serviço mascara esse erro como warning (“sem dados para atualizar”) e ainda soma `unitsByBranch` antes de confirmar sucesso.

Do I know what the issue is? Sim.

Plano de implementação

1) Corrigir trigger/função no Supabase (schema)
- Criar migration nova para substituir `public.notify_unit_compliance_issues()` com colunas corretas da tabela:
  - usar `branch_id` (não `unit_id`)
  - usar `has_pending_requirements` / `pending_description` / `compliance_status` (não `pending_requirements`)
  - usar `unit_responsible_user_id` e fallback para responsável da legislação.
- Garantir que falha de notificação não bloqueie a gravação de compliance (bloco `EXCEPTION` retornando `NEW`).

2) Corrigir tratamento de erro no import
- Arquivo: `src/services/legislationImport.ts`
- Ajustar os dois blocos de upsert (legislação existente e nova):
  - se `complianceError`, registrar erro real no `result.details` (status `error`) e não warning genérico.
  - só incrementar `unitsByBranch` e `unitCompliancesCreated` após upsert bem-sucedido.
- Manter warning “sem dados para atualizar” apenas quando realmente não houver evidência nem avaliações válidas para aquela linha.

3) Melhorar feedback no modal de resultado
- Arquivo: `src/components/legislation/LegislationImportDialog.tsx`
- Exibir separadamente:
  - novas importadas (`imported`)
  - existentes atualizadas (`updated`)
  - avaliações por unidade criadas/atualizadas (`unitCompliancesCreated`)
- Isso evita interpretação de falha quando há atualização sem criação de legislação nova.

4) Correção adicional de consistência (rápida)
- Em `legislationImport.ts`, ajustar insert de evidências para coluna correta (`evidence_type` em vez de `type`) para não perder atualização de evidências silenciosamente.

Detalhes técnicos
- Arquivos a alterar:
  - `supabase/migrations/<new>_fix_unit_compliance_notification_trigger.sql`
  - `src/services/legislationImport.ts`
  - `src/components/legislation/LegislationImportDialog.tsx`
- Sem mudança de fluxo de matching já aprovado (tipo+número → título → summary).
- O modo simplificado continua “update-only” (sem INSERT de nova legislação quando não encontrar match).

Validação (fim a fim)
1. Reexecutar import no formato simplificado.
2. Esperado:
   - warnings “sem dados para atualizar” caem drasticamente (só linhas realmente sem dados).
   - `updated` e `unitCompliancesCreated` > 0.
3. Confirmar no banco:
   - `SELECT count(*) FROM legislation_unit_compliance WHERE company_id = <empresa>;`
   - deve retornar > 0 após import.
4. Verificar na tela de legislações por unidade se status foi atualizado conforme planilha.
