

# Duas melhorias no módulo de Treinamentos

## 1. Campo "Modalidade" no cadastro de treinamento

**Problema:** Não existe campo para informar se o treinamento é Presencial, Online ou Híbrido.

**Solução:**
- Adicionar coluna `modality` (varchar) na tabela `training_programs` via migration
- Adicionar campo `modality` ao schema Zod e ao formulário no `TrainingProgramModal.tsx`
- Exibir como `<Select>` com opções: Presencial, Online, Híbrido
- Posicionar na seção de informações gerais (ao lado de Filial/Instrutor)
- Incluir no `onSubmit` / `sanitizedValues`
- Adicionar enum `TRAINING_MODALITY` em `src/types/enums.ts`

## 2. Digitação manual de datas (DD/MM/AAAA) em todos os date pickers

**Problema:** Atualmente os campos de data só permitem seleção via calendário (botão). O usuário quer digitar a data pelo teclado.

**Solução:** Já existe o componente `DateInputWithCalendar` (usado no `EmployeeModal`) que faz exatamente isso -- campo de texto com máscara DD/MM/AAAA + botão de calendário ao lado. Precisa ser adaptado para funcionar com `react-hook-form` (recebe/emite `Date` ao invés de `string`).

Criar um novo componente `DateInputWithCalendarForm` que:
- Aceita `value: Date | null` e `onChange: (date: Date | null) => void` (compatível com `field.value` / `field.onChange` do react-hook-form)
- Internamente converte Date ↔ string usando `formatDateForDB` / `parseDateSafe`
- Reutiliza a mesma lógica de máscara DD/MM/AAAA do `DateInputWithCalendar`

Substituir os date pickers (Popover+Calendar) nos seguintes componentes de treinamento:
- `TrainingProgramModal.tsx` (3 campos: start_date, end_date, efficacy_evaluation_deadline)
- `TrainingScheduleModal.tsx` (2 campos)
- `EmployeeTrainingModal.tsx` (1 campo)
- `RescheduleTrainingModal.tsx` (2 campos)
- `TrainingEfficacyEvaluationDialog.tsx` (1 campo)

**Arquivos modificados:**
- `supabase/migrations/xxx.sql` — ADD COLUMN modality
- `src/types/enums.ts` — novo enum TRAINING_MODALITY
- `src/components/DateInputWithCalendar.tsx` — novo export `DateInputWithCalendarForm`
- `src/components/TrainingProgramModal.tsx` — campo modalidade + date inputs manuais
- `src/components/TrainingScheduleModal.tsx` — date inputs manuais
- `src/components/EmployeeTrainingModal.tsx` — date inputs manuais
- `src/components/RescheduleTrainingModal.tsx` — date inputs manuais
- `src/components/TrainingEfficacyEvaluationDialog.tsx` — date inputs manuais

