
# Plano: Melhorar Visibilidade da Seleção de Tipos de Fornecedor

## Diagnóstico

O usuário reportou que ao criar um fornecedor em `/fornecedores/cadastro`, aparece a mensagem "Selecione pelo menos um tipo de fornecedor", mas o formulário não mostra opção para selecionar tipo.

### Problemas Identificados

1. **Seção de Tipos Escondida**: A seção "Tipos de Fornecedor" existe no formulário (linhas 781-841 de `SupplierRegistration.tsx`), mas está localizada no **final do modal**, após todos os campos de endereço e telefone. O modal tem `max-h-[90vh] overflow-y-auto`, então o usuário precisa rolar para ver a seção.

2. **Possível Confusão de Módulos**: A mensagem de erro exata ("Selecione pelo menos um tipo de fornecedor") vem do módulo de **Fornecedores de Resíduos** (`WasteSupplierModal.tsx`), não do módulo de **Gestão de Fornecedores** (`SupplierRegistration.tsx`). Pode haver confusão entre os dois módulos ou um toast antigo.

3. **Dados Existentes**: O usuário tem categoria e tipo cadastrados no banco de dados, então a seção de checkboxes deveria aparecer (não o alerta de "Nenhum tipo cadastrado").

---

## Solução

Reorganizar o formulário para que a seção de **Tipos de Fornecedor** fique mais visível, movendo-a para uma posição anterior no formulário (logo após os dados básicos e antes do endereço).

---

## Alterações

### Arquivo: `src/pages/SupplierRegistration.tsx`

**Mudança 1**: Mover a seção de Tipos de Fornecedor para logo após os campos básicos (PF/PJ)

Atualmente a ordem é:
1. Tabs PJ/PF (dados básicos)
2. Endereço
3. Telefones
4. Apelido
5. **Tipos de Fornecedor** (escondido no final)

Nova ordem:
1. Tabs PJ/PF (dados básicos)
2. **Tipos de Fornecedor** (movido para cima)
3. Endereço
4. Telefones
5. Apelido

**Mudança 2**: Adicionar indicador visual de scroll se houver mais conteúdo

Adicionar uma sombra sutil no topo do modal quando houver conteúdo scrollável acima.

---

## Código a Modificar

### Mover seção de tipos (linhas 781-841 movidas para ~linhas 677)

A seção de "Tipos de Fornecedor" será movida de após todos os campos de endereço para logo após a seção de Tabs (PJ/PF):

```text
[Antes]
- DialogContent
  - Tabs PJ/PF
  - Campos de Endereço (30+ linhas)
  - Campos de Telefone
  - Campo Apelido
  - Seção Tipos de Fornecedor  ← difícil de ver
  - Seção Status (só edição)
  - Footer com botões

[Depois]
- DialogContent
  - Tabs PJ/PF
  - Seção Tipos de Fornecedor  ← mais visível
  - Campos de Endereço
  - Campos de Telefone
  - Campo Apelido
  - Seção Status (só edição)
  - Footer com botões
```

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Usuário abre modal | Tipos escondidos no final | Tipos visíveis logo após dados básicos |
| Tipos cadastrados | Precisa scroll para ver | Visível sem scroll na maioria das telas |
| Sem tipos cadastrados | Alerta escondido | Alerta visível com orientação clara |

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/SupplierRegistration.tsx` | Reordenar seções do modal para colocar Tipos de Fornecedor em posição mais visível |
