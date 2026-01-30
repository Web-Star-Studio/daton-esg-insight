

# Plano de Validação Funcional - Continuação

## Status Atual
Login realizado com sucesso. Navegação para Gestão de Colaboradores iniciada.

---

## Testes Pendentes

### 1. Deleção de Funcionário (Cascade)

**Objetivo:** Validar que a exclusão de funcionário remove corretamente todos os dados relacionados.

**Passos de Teste:**
1. Abrir modal de edição de um funcionário existente
2. Clicar no botão "Excluir" 
3. Confirmar no AlertDialog
4. Verificar toast de sucesso
5. Confirmar que funcionário foi removido da lista
6. Verificar no banco que registros em `employee_experiences`, `employee_education`, `benefit_enrollments` e `employee_trainings` foram removidos

**Arquivos Relacionados:**
- `src/components/EmployeeModal.tsx` - Modal com botão Excluir
- `src/services/employeeService.ts` - Lógica de cascade deletion

---

### 2. Módulo QUALIDADE

**Componentes a Testar:**

| Componente | Rota | Validações |
|------------|------|------------|
| Dashboard SGQ | `/quality-dashboard` | Carregamento de métricas, gráficos |
| Não Conformidades | `/nao-conformidades` | CRUD, workflow 6 etapas |
| Tarefas NC | `/nc-tarefas` | Listagem, filtros, conclusão |

**Testes Específicos:**
1. **Dashboard:** Verificar carregamento de indicadores sem erros 406
2. **Criar NC:** Testar fluxo completo de registro (campos obrigatórios: Unidade, Setor)
3. **Workflow:** Navegar pelas 6 etapas (registro → ação imediata → análise causa → planejamento → implementação → eficácia)
4. **Validação Zod:** Testar mensagens de erro em português

---

### 3. Módulo FORNECEDORES

**Componentes a Testar:**

| Componente | Rota | Validações |
|------------|------|------------|
| Dashboard | `/fornecedores` | Listagem, filtros |
| Cadastro | `/fornecedores/cadastro` | Validação CNPJ/CPF |
| Edição | `/fornecedores/:id` | Atualização de dados |

**Testes Específicos:**
1. **Validação CNPJ:** Testar dígitos verificadores (rejeitar `11.111.111/1111-11`)
2. **Validação CPF:** Testar dígitos verificadores (rejeitar `111.111.111-11`)
3. **ViaCEP:** Testar auto-preenchimento de endereço
4. **Unicidade:** Testar rejeição de CNPJ/CPF duplicado
5. **Tipo de Pessoa:** Testar toggle PJ/PF e campos condicionais

**Arquivos Relacionados:**
- `src/utils/formValidation.ts` - Funções `validateCNPJ`, `validateCPF`
- `src/components/suppliers/SupplierForm.tsx` - Formulário de cadastro

---

## Bugs Potenciais a Investigar

1. **Erro 406 no Dashboard:** Verificar se queries do módulo Qualidade usam `.maybeSingle()`
2. **Cascade Deletion:** Confirmar que serviço de exclusão limpa todas as tabelas dependentes
3. **Validação Submit:** Garantir que CNPJ/CPF inválidos bloqueiam envio (não apenas exibem mensagem)

---

## Arquivos a Verificar

```
src/services/employeeService.ts       # Cascade deletion
src/components/UnifiedQualityDashboard.tsx  # Dashboard Qualidade
src/pages/NaoConformidades.tsx        # NC principal
src/components/suppliers/SupplierForm.tsx   # Formulário fornecedor
```

---

## Próximos Passos

1. Continuar navegação no browser para completar testes visuais
2. Verificar logs de console para erros não tratados
3. Validar network requests para erros 406/500
4. Documentar bugs encontrados para correção

