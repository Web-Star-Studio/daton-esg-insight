# Skill: responsive
# Trigger: /responsive
# Descrição: Checar e corrigir problemas de responsividade em componentes ou páginas

O usuário quer verificar ou corrigir responsividade. Siga o processo abaixo.

## Breakpoints do projeto (tailwind.config.ts)

```
xs:  320px  → Celulares pequenos (iPhone SE)
sm:  480px  → Celulares (padrão)
md:  768px  → Tablets
lg: 1024px  → Notebooks pequenos / tablet paisagem
xl: 1366px  → Desktop padrão
2xl:1920px  → Ultrawide / monitores grandes
```

**Mobile-first:** estilos base = mobile, modificadores sobrescrevem para telas maiores.

## Padrões estabelecidos no projeto

### Layout de página
```tsx
// Container principal de página
<div className="flex flex-col gap-4 p-4 sm:p-6">

// Header com título e ação
<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-xl font-semibold sm:text-2xl">Título</h1>
    <p className="text-sm text-muted-foreground">Subtítulo</p>
  </div>
  <Button className="w-full sm:w-auto">Ação</Button>
</div>
```

### Grids
```tsx
// Grid de cards de métricas
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

// Grid de conteúdo principal
<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
  <div className="lg:col-span-2">Conteúdo principal</div>
  <div>Sidebar/secundário</div>
</div>

// Grid de formulário
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
```

### Tabelas responsivas
```tsx
// Tabela com scroll horizontal em mobile
<div className="overflow-x-auto rounded-lg border">
  <table className="w-full min-w-[600px]">
    {/* Colunas menos importantes: hidden md:table-cell */}
    <th className="hidden md:table-cell">Coluna opcional</th>
    <td className="hidden md:table-cell">Valor</td>
  </table>
</div>
```

### Tipografia responsiva
```tsx
text-xs sm:text-sm          // Labels, badges
text-sm sm:text-base        // Corpo de texto
text-base sm:text-lg        // Títulos de seção
text-xl sm:text-2xl         // Títulos de página
text-2xl sm:text-3xl        // Hero/destaque
```

### Espaçamentos responsivos
```tsx
p-3 sm:p-4 md:p-6           // Padding de cards
gap-3 sm:gap-4              // Gap entre items
space-y-3 sm:space-y-4      // Espaço vertical entre seções
```

### Botões
```tsx
// Botão full-width no mobile, auto no desktop
<Button className="w-full sm:w-auto">Texto</Button>

// Grupo de botões empilhado no mobile
<div className="flex flex-col gap-2 sm:flex-row">
  <Button variant="outline">Cancelar</Button>
  <Button>Confirmar</Button>
</div>
```

### Modais/Dialogs
```tsx
// DialogContent com largura responsiva
<DialogContent className="w-full max-w-sm sm:max-w-lg md:max-w-2xl">
```

### Sidebar/Navigation
```tsx
// Sidebar colapsa em mobile (já tratado pelo AppSidebar)
// Em componentes internos, evitar margens fixas que assumem sidebar aberta
```

## Processo de auditoria

### 1. Identificar o componente/página alvo

```bash
# Ler o arquivo alvo completo
cat src/pages/[NomePagina].tsx
# ou
cat src/components/[NomeComponente].tsx
```

### 2. Checar anti-padrões comuns

```bash
# Larguras fixas em px (problemático)
grep -n "w-\[.*px\]\|min-w-\[.*px\]\|max-w-\[.*px\]" src/[arquivo]

# Overflow oculto sem tratamento
grep -n "overflow-hidden" src/[arquivo]

# Flex sem flex-wrap em mobile
grep -n "flex " src/[arquivo] | grep -v "flex-col\|flex-wrap\|flex-row"
```

### 3. Lista de problemas comuns e correções

| Problema | Código com problema | Correção |
|----------|--------------------|---------|
| Grid sem responsividade | `grid grid-cols-4` | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| Padding fixo | `p-6` | `p-4 sm:p-6` |
| Flex row no mobile | `flex flex-row gap-4` | `flex flex-col gap-3 sm:flex-row sm:gap-4` |
| Botão sem width no mobile | `<Button>` | `<Button className="w-full sm:w-auto">` |
| Tabela sem scroll | `<table>` | `<div className="overflow-x-auto"><table className="min-w-[600px]">` |
| Texto grande no mobile | `text-2xl` | `text-xl sm:text-2xl` |
| Espaço fixo | `space-y-6` | `space-y-4 sm:space-y-6` |
| Dialog muito largo | `max-w-2xl` | `w-full max-w-sm sm:max-w-2xl` |
| Colunas ocultas necessárias | `hidden` em coluna importante | Mover dados para row expandível |

### 4. Aplicar correções

Para cada problema, aplicar o fix mínimo necessário. Não refatorar código que funciona.

### 5. Verificar resultado

```bash
bun run dev
# No DevTools: testar nos breakpoints 375px, 768px, 1024px, 1440px
# Usar DevTools Toggle Device Toolbar (Ctrl+Shift+M)
```

## Checklist de responsividade

Ao criar ou revisar qualquer componente, verificar:

- [ ] Layout principal usa `flex-col` em mobile, `flex-row` em sm+
- [ ] Grids começam com `grid-cols-1` e escalam
- [ ] Paddings usam `p-4 sm:p-6` (nunca fixo)
- [ ] Textos de título: `text-xl sm:text-2xl` (nunca fixo no maior tamanho)
- [ ] Botões de ação: `w-full sm:w-auto`
- [ ] Tabelas têm `overflow-x-auto` no container
- [ ] Colunas secundárias: `hidden md:table-cell`
- [ ] Modais/Dialogs: `w-full max-w-sm sm:max-w-[tamanho]`
- [ ] Nenhum `w-[Npx]` fixo que quebre em mobile
- [ ] Sidebar e header já são responsivos — não interferir neles
