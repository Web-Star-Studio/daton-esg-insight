
# Plano de Correção: Data Um Dia Atrás e Seleção de Avaliadores

## Problemas Identificados

### Problema 1: Data exibida um dia atrás
Na tela de Gestão de Treinamentos, as datas dos programas (início e término) aparecem sempre um dia antes do que foi cadastrado.

**Causa**: O código usa `new Date()` diretamente com strings ISO (YYYY-MM-DD). Isso causa o famoso problema de timezone:
- JavaScript interpreta "2026-01-26" como meia-noite UTC
- No Brasil (UTC-3), meia-noite UTC = 21:00 do dia **anterior**
- Resultado: 26/01/2026 aparece como 25/01/2026

**Local afetado**: `src/pages/GestaoTreinamentos.tsx`, linhas 714-716

### Problema 2: Seleção de avaliadores não encontra colaboradores
Ao buscar colaboradores para "Responsável pela Avaliação", a busca por nome não funciona - mesmo digitando "elian", retorna "Nenhum colaborador encontrado" (mas existem 4 "Eliana/Eliane" no banco).

**Causa**: O componente `Command` do shadcn faz filtragem interna baseada no atributo `value` do `CommandItem`. O código atual usa `value={emp.id}` (UUID), então quando o usuário digita "elian", o Command procura UUIDs que contenham "elian" - que obviamente não existem.

**Local afetado**: `src/components/TrainingProgramModal.tsx`, linha 1095

---

## Solução

### Correção 1: Usar `formatDateDisplay` para datas

O utilitário `formatDateDisplay` já existe e está importado, mas não está sendo usado. Ele usa `T12:00:00` para evitar o problema de timezone.

**Antes (linha 714)**:
```typescript
{program.start_date && format(new Date(program.start_date), "dd/MM/yyyy", { locale: ptBR })}
```

**Depois**:
```typescript
{program.start_date && formatDateDisplay(program.start_date)}
```

### Correção 2: Usar nome no `value` do `CommandItem`

O `Command` precisa que o `value` contenha o texto buscável. A solução é usar uma combinação de nome + código como `value`, mas manter o `onSelect` usando o ID.

**Antes (linha 1095)**:
```typescript
value={emp.id}
```

**Depois**:
```typescript
value={`${emp.full_name} ${emp.employee_code || ''}`}
```

Também precisamos desabilitar a filtragem interna do Command quando já estamos filtrando manualmente pelo `evaluatorSearchTerm`.

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/pages/GestaoTreinamentos.tsx` | Usar `formatDateDisplay` nas linhas 714-716 |
| `src/components/TrainingProgramModal.tsx` | Ajustar `value` do `CommandItem` para usar nome |

---

## Mudanças Detalhadas

### 1. GestaoTreinamentos.tsx (linhas 714-716)

**Atual**:
```typescript
<span>
  {program.start_date && format(new Date(program.start_date), "dd/MM/yyyy", { locale: ptBR })}
  {program.start_date && program.end_date && " - "}
  {program.end_date && format(new Date(program.end_date), "dd/MM/yyyy", { locale: ptBR })}
</span>
```

**Corrigido**:
```typescript
<span>
  {program.start_date && formatDateDisplay(program.start_date)}
  {program.start_date && program.end_date && " - "}
  {program.end_date && formatDateDisplay(program.end_date)}
</span>
```

### 2. TrainingProgramModal.tsx (linha 1083 e 1095)

Adicionar `shouldFilter={false}` no `Command` para desabilitar a filtragem interna (já que filtramos manualmente via `filteredEvaluators`):

**Linha 1083 - Atual**:
```typescript
<Command>
```

**Corrigido**:
```typescript
<Command shouldFilter={false}>
```

E mudar o `value` do `CommandItem` para usar o nome:

**Linha 1095 - Atual**:
```typescript
value={emp.id}
```

**Corrigido**:
```typescript
value={`${emp.full_name} ${emp.employee_code || ''}`}
```

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Data início 26/01/2026 | Mostra 25/01/2026 | Mostra 26/01/2026 |
| Buscar "elian" nos avaliadores | "Nenhum colaborador encontrado" | Encontra Eliana Panke, Eliane Pires, etc. |
| Lista inicial de avaliadores | Apenas ~50 primeiros (por ordem alfabética) | Mesmos 50, mas busca funciona |

---

## Seção Técnica

### Por que `formatDateDisplay` resolve o problema?

A função `parseDateSafe` usada internamente adiciona `T12:00:00` às datas:

```typescript
// Com T12:00:00, mesmo com conversão ±12h, o dia nunca muda
const date = new Date(`${dateString}T12:00:00`);
```

Meio-dia é um "ponto seguro" - qualquer timezone do mundo (UTC-12 a UTC+14) não consegue empurrar meio-dia para outro dia.

### Por que `shouldFilter={false}` é necessário?

O componente `Command` do cmdk/shadcn tem filtragem automática habilitada por padrão. Quando o usuário digita na `CommandInput`, ele filtra os `CommandItem` pelo atributo `value`.

No nosso caso, já filtramos manualmente via `filteredEvaluators`. Se deixarmos a filtragem dupla, o Command filtra novamente pelo `value`, o que causava o problema.

Com `shouldFilter={false}`, delegamos toda a lógica de filtragem para nosso código, que já funciona corretamente com nome e código.
