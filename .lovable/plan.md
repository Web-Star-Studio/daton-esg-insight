

# Enriquecer "Visualizar Treinamento" na aba do Colaborador

## Problema
O dialog de visualização do treinamento no cadastro do colaborador mostra apenas carga horária, datas e status. Faltam: objetivo, responsável, lista de participantes e avaliação de eficácia.

## Alterações

### 1. Ampliar a query no `EmployeeTrainingsTab.tsx`
Expandir o `select` do `training_programs` para incluir todos os campos relevantes:
```
description, responsible_name, responsible_email, modality,
efficacy_evaluation_deadline, efficacy_evaluator_employee_id
```

### 2. Reescrever `ViewEmployeeTrainingDialog.tsx`
Transformar de dialog simples em dialog completo com seções:

**Seção "Informações do Programa"** (já existente, expandir):
- Objetivo do treinamento (`program.description`)
- Responsável (`program.responsible_name` / `responsible_email`)
- Modalidade (`program.modality`)
- Carga horária, datas (já existem)

**Seção "Participantes"** (nova):
- Buscar via `getTrainingProgramParticipants(programId)` do serviço existente
- Exibir tabela com nome, código, departamento, status
- Mostrar contagem total

**Seção "Avaliação de Eficácia"** (nova):
- Se o programa tem `efficacy_evaluation_deadline`, exibir seção
- Buscar avaliações existentes via `getEfficacyEvaluations(programId)` filtrando pelo `employee_training_id`
- Se já existe avaliação: mostrar resultado (eficaz/não eficaz), nota, comentários, data
- Se não existe avaliação e prazo ainda não passou: mostrar formulário inline para registrar (campos: eficaz sim/não, comentários)
- Usar `createEfficacyEvaluation` do serviço existente para salvar

### 3. Arquivos modificados
- `src/components/EmployeeTrainingsTab.tsx` — expandir select query
- `src/components/ViewEmployeeTrainingDialog.tsx` — reescrever com seções completas + participantes + eficácia

Sem alterações de banco de dados. Todos os campos e serviços já existem.

