
# Plano: Melhorar UX dos Selects de Departamento

## Diagnóstico

O problema ocorre porque:

1. A empresa do usuário (`e50e7445-e38e-450a-8c51-fb5918b2faf3`) nao tem funcionarios cadastrados
2. A empresa do usuário nao tem departamentos cadastrados
3. Os Selects aparecem vazios sem nenhuma indicacao visual de que nao ha opcoes

Este nao e um bug - e um problema de usabilidade quando as listas estao vazias.

---

## Solucao

Melhorar a experiencia do usuario adicionando:

1. **Opcao "Nenhum"** para campos opcionais (gerente e departamento pai)
2. **Mensagem informativa** quando nao ha opcoes disponiveis

---

## Alteracoes

**Arquivo:** `src/components/DepartmentManager.tsx`

### 1. Select de Departamento Pai (linhas 324-343)

Adicionar opcao "Nenhum" e mensagem quando vazio:

```typescript
<Select
  value={formData.parent_department_id}
  onValueChange={(value) => setFormData({ ...formData, parent_department_id: value === 'none' ? '' : value })}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecione o departamento pai (opcional)" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">Nenhum (departamento raiz)</SelectItem>
    {flattenDepartments(departments)
      .filter(dept => dept.id !== editingDepartment?.id)
      .length > 0 ? (
      flattenDepartments(departments)
        .filter(dept => dept.id !== editingDepartment?.id)
        .map((department) => (
          <SelectItem key={department.id} value={department.id}>
            {department.name}
          </SelectItem>
        ))
    ) : null}
  </SelectContent>
</Select>
```

### 2. Select de Gerente (linhas 345-362)

Adicionar opcao "Nenhum" e mensagem quando vazio:

```typescript
<Select
  value={formData.manager_employee_id}
  onValueChange={(value) => setFormData({ ...formData, manager_employee_id: value === 'none' ? '' : value })}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecione o gerente (opcional)" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">Nenhum</SelectItem>
    {employees.length > 0 ? (
      employees.map((employee) => (
        <SelectItem key={employee.id} value={employee.id}>
          {employee.full_name} - {employee.position || employee.department || 'Sem cargo'}
        </SelectItem>
      ))
    ) : (
      <div className="py-2 px-3 text-sm text-muted-foreground">
        Nenhum funcionario cadastrado
      </div>
    )}
  </SelectContent>
</Select>
```

### 3. Atualizar placeholders para indicar opcionalidade

Mudar os Labels para indicar que sao campos opcionais:

- "Departamento Pai" → "Departamento Pai (opcional)"
- "Gerente" → "Gerente (opcional)"

---

## Resultado Esperado

| Situacao | Antes | Depois |
|----------|-------|--------|
| Select vazio clicado | Nada acontece ou lista vazia | Mostra "Nenhum" + mensagem informativa |
| Campo opcional | Obrigado a selecionar algo | Pode escolher "Nenhum" |
| Placeholders | Genericos | Indicam opcionalidade |

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/DepartmentManager.tsx` | Adicionar opcao "Nenhum" nos Selects de gerente e departamento pai |
| `src/components/DepartmentManager.tsx` | Mostrar mensagem quando nao ha funcionarios cadastrados |
| `src/components/DepartmentManager.tsx` | Atualizar placeholders para indicar opcionalidade |
