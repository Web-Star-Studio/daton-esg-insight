
# Plano de Correção: Seleção de Avaliador e Adição de Participantes

## Resumo dos Problemas Identificados

### Problema 1: Avaliador de Eficácia - Não aparecem todos os funcionários

**Causa Raiz Identificada**

No arquivo `TrainingProgramModal.tsx`, linha 464, a lista de avaliadores está **limitada artificialmente a 20 funcionários**:

```typescript
const filteredEvaluators = useMemo(() => {
  if (!evaluatorSearchTerm) return employees.slice(0, 20); // ← PROBLEMA: Limite de 20
  return employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(evaluatorSearchTerm.toLowerCase()) ||
    emp.employee_code?.toLowerCase().includes(evaluatorSearchTerm.toLowerCase())
  ).slice(0, 20); // ← PROBLEMA: Também limita a 20
}, [employees, evaluatorSearchTerm]);
```

Isso significa que:
- Sem busca: apenas os 20 primeiros funcionários aparecem
- Com busca: apenas os 20 primeiros resultados aparecem
- Funcionários que não estão nos primeiros 20 são invisíveis para seleção

### Problema 2: Adicionar participantes na edição

**Situação Atual**

A seção de participantes está explicitamente oculta durante a edição (linha 1089-1090):

```typescript
{/* ============ SEÇÃO: PARTICIPANTES (apenas na criação) ============ */}
{!isEditing && (
  // ... toda a seção de seleção de participantes
)}
```

**Funcionalidade Existente**

A funcionalidade de adicionar participantes já existe no modal de detalhes (`TrainingProgramDetailModal`), acessível via botão "Adicionar" na aba Participantes. No entanto, não está disponível diretamente no modal de edição.

---

## Solução Proposta

### Correção 1: Remover limite de 20 avaliadores

**Arquivo:** `src/components/TrainingProgramModal.tsx`

Alterar a lógica de `filteredEvaluators` para permitir visualização de mais funcionários:

| Cenário | Antes | Depois |
|---------|-------|--------|
| Sem busca | Máx 20 | Máx 50 (para performance) |
| Com busca | Máx 20 | Máx 100 (prioriza busca) |

```typescript
const filteredEvaluators = useMemo(() => {
  if (!evaluatorSearchTerm) return employees.slice(0, 50); // Aumentar limite inicial
  return employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(evaluatorSearchTerm.toLowerCase()) ||
    emp.employee_code?.toLowerCase().includes(evaluatorSearchTerm.toLowerCase())
  ).slice(0, 100); // Mais resultados na busca
}, [employees, evaluatorSearchTerm]);
```

**Melhoria adicional:** Adicionar mensagem informativa quando há mais resultados:

```typescript
// Adicionar contador de resultados ocultos
const totalMatchingEvaluators = useMemo(() => {
  if (!evaluatorSearchTerm) return employees.length;
  return employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(evaluatorSearchTerm.toLowerCase()) ||
    emp.employee_code?.toLowerCase().includes(evaluatorSearchTerm.toLowerCase())
  ).length;
}, [employees, evaluatorSearchTerm]);

// Exibir aviso quando há mais resultados
{totalMatchingEvaluators > filteredEvaluators.length && (
  <p className="text-xs text-muted-foreground px-2 py-1 border-t">
    Mostrando {filteredEvaluators.length} de {totalMatchingEvaluators}. 
    Digite para refinar a busca.
  </p>
)}
```

### Correção 2: Permitir adicionar participantes na edição

**Abordagem:** Exibir a seção de participantes na edição, mostrando os participantes atuais e permitindo adicionar novos.

**Arquivo:** `src/components/TrainingProgramModal.tsx`

**Mudanças necessárias:**

1. **Buscar participantes existentes quando editando:**

```typescript
// Adicionar query para buscar participantes existentes
const { data: existingParticipants = [] } = useQuery({
  queryKey: ['training-participants-modal', program?.id],
  queryFn: async () => {
    if (!program?.id) return [];
    const { data, error } = await supabase
      .from('employee_trainings')
      .select('employee_id')
      .eq('training_program_id', program.id);
    if (error) throw error;
    return (data || []).map(p => p.employee_id);
  },
  enabled: open && isEditing && !!program?.id,
});
```

2. **Inicializar participantes selecionados com existentes:**

```typescript
// Atualizar pendingParticipants quando editando
useEffect(() => {
  if (isEditing && existingParticipants.length > 0) {
    setPendingParticipants(new Set(existingParticipants));
  }
}, [isEditing, existingParticipants]);
```

3. **Modificar condição de exibição da seção de participantes:**

```typescript
// ANTES: {!isEditing && (
// DEPOIS: Sempre exibir, com texto diferenciado
{(
  <>
    <Separator />
    
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Participantes
          </h3>
          {pendingParticipants.size > 0 && (
            <Badge variant="secondary">
              {pendingParticipants.size} {isEditing ? 'inscrito(s)' : 'selecionado(s)'}
            </Badge>
          )}
        </div>
        // ... resto da seção
      </div>
    </div>
  </>
)}
```

4. **Atualizar lógica de salvamento para adicionar novos participantes na edição:**

```typescript
// Na função onSubmit, após updateTrainingProgram:
if (isEditing && program?.id) {
  await updateTrainingProgram(program.id, sanitizedValues);
  
  // Adicionar novos participantes que não existiam
  const newParticipants = Array.from(pendingParticipants).filter(
    empId => !existingParticipants.includes(empId)
  );
  
  if (newParticipants.length > 0) {
    for (const employeeId of newParticipants) {
      try {
        await createEmployeeTraining({
          employee_id: employeeId,
          training_program_id: program.id,
          status: "Inscrito",
          company_id: "",
        });
      } catch (err) {
        console.error(`Erro ao inscrever funcionário ${employeeId}:`, err);
      }
    }
    
    toast({
      title: "Sucesso",
      description: `Programa atualizado. ${newParticipants.length} novo(s) participante(s) adicionado(s).`,
    });
  } else {
    toast({
      title: "Sucesso",
      description: "Programa de treinamento atualizado com sucesso!",
    });
  }
}
```

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/TrainingProgramModal.tsx` | 1. Aumentar limite de avaliadores de 20 para 50/100 |
|  | 2. Adicionar contador de resultados ocultos |
|  | 3. Buscar participantes existentes na edição |
|  | 4. Exibir seção de participantes na edição |
|  | 5. Atualizar lógica de salvamento para novos participantes |

---

## Fluxo de Usuário Após Correções

### Seleção de Avaliador

```text
┌──────────────────────────────────────┐
│  Responsável pela Avaliação          │
│  ┌──────────────────────────────────┐│
│  │ Buscar por nome ou código...    ││
│  └──────────────────────────────────┘│
│  ┌──────────────────────────────────┐│
│  │ ✓ Ana Silva (EMP001)            ││
│  │   Bruno Santos (EMP002)         ││
│  │   Carlos Oliveira (EMP003)      ││
│  │   ... (até 50 sem busca)        ││
│  │                                 ││
│  │ Mostrando 50 de 150.            ││
│  │ Digite para refinar a busca.    ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

### Adicionar Participantes na Edição

```text
┌──────────────────────────────────────┐
│  PARTICIPANTES                       │
│  [32 inscrito(s)]                    │
│                                       │
│  [Buscar funcionários...] [Dept ▼]   │
│                                       │
│  ┌──────────────────────────────────┐│
│  │ ✓ Ana Silva - RH                ││  ← Já inscrita
│  │ ✓ Bruno Santos - TI             ││  ← Já inscrito
│  │ ☐ Carlos Oliveira - Vendas      ││  ← Pode adicionar
│  │ ✓ Daniela Lima - Produção       ││  ← Já inscrita
│  │ ☐ Eduardo Pereira - Logística   ││  ← Pode adicionar
│  └──────────────────────────────────┘│
│                                       │
│  ⚠️ Participantes já inscritos não   │
│  podem ser removidos por aqui.       │
│  Use o modal de detalhes.            │
└──────────────────────────────────────┘
```

---

## Resultado Esperado

| Funcionalidade | Antes | Depois |
|----------------|-------|--------|
| Avaliadores visíveis | Máximo 20 | Até 50 sem busca, 100 com busca |
| Adicionar participantes | Apenas na criação | Criação e edição |
| Feedback ao usuário | Nenhum | Contador de resultados ocultos |

---

## Seção Técnica

### Query Keys a Adicionar

```typescript
['training-participants-modal', programId] // Para buscar participantes existentes na edição
```

### Invalidações Necessárias

Após salvar com novos participantes:
```typescript
queryClient.invalidateQueries({ queryKey: ['training-program-participants'] });
queryClient.invalidateQueries({ queryKey: ['employee-trainings'] });
```

### Considerações de UX

1. **Participantes já inscritos:** Devem aparecer selecionados e não podem ser desmarcados via este modal (remoção deve ser feita pelo modal de detalhes)

2. **Distinção visual:** Participantes existentes vs novos a adicionar

3. **Mensagem informativa:** Explicar que remoção não é possível neste modal
