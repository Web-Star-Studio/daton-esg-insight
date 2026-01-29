

# Plano: Adicionar Estrutura Organizacional ao Sidebar

## Objetivo
Adicionar a página **Estrutura Organizacional** na seção **ESG > Social** do menu lateral, tornando-a acessível diretamente pela navegação principal.

---

## Alteração

**Arquivo:** `src/components/AppSidebar.tsx`

Adicionar um novo item no array `subItems` da categoria Social (linhas 137-145), posicionando-o logicamente após "Gestão de Cargos":

| Campo | Valor |
|-------|-------|
| id | `organizational-structure` |
| title | `Estrutura Organizacional` |
| icon | `Building2` |
| path | `/estrutura-organizacional` |
| description | `Organograma, departamentos e hierarquia` |

### Código a adicionar (após linha 139)

```typescript
{ id: "organizational-structure", title: "Estrutura Organizacional", icon: Building2, path: "/estrutura-organizacional", description: "Organograma, departamentos e hierarquia" },
```

---

## Resultado no menu

**ESG > Social:**
1. Dashboard Social
2. Gestão de Cargos
3. **Estrutura Organizacional** ← NOVO
4. Gestão de Colaboradores
5. Segurança do Trabalho
6. Treinamentos
7. Avaliação de Eficácia
8. Desenvolvimento de Carreira

---

## Observação

O ícone `Building2` já está importado no arquivo (linha 48), então não é necessário adicionar nova importação.

