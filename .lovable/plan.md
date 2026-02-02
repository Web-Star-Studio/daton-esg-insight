
# Plano de Implementacao de Acessibilidade WCAG 2.1 AA

## Resumo Executivo

Este plano apresenta uma auditoria completa de acessibilidade e implementacao de conformidade WCAG 2.1 AA para o sistema Daton ESG Insight, cobrindo HTML semantico, formularios, contraste, foco, navegacao por teclado, ARIA, imagens e testes.

---

## Diagnostico do Estado Atual

### Pontos Fortes Identificados

| Categoria | Status | Implementacao |
|-----------|--------|---------------|
| Skip Links | OK | `SkipLinks.tsx` com links para `#main-content` e `#navigation` |
| HTML Semantico no MainLayout | OK | `<nav>`, `<main id="main-content">` implementados |
| Focus Visible | OK | `focus-visible:ring-2` em 30+ componentes UI |
| Reduced Motion | OK | `@media (prefers-reduced-motion)` no CSS global |
| Labels em Forms | PARCIAL | 187+ arquivos com `<Label htmlFor>` |
| aria-label em icons | PARCIAL | 35+ arquivos com aria-labels |
| sr-only para textos ocultos | OK | 10+ componentes usando `.sr-only` |
| Contrast Variables | OK | CSS variables com cores definidas em HSL |
| role="alert" em erros | OK | Alert, FormMessage, EmptyState |
| Accessible Form Hook | OK | `useAccessibleForm.ts` com aria-describedby |
| Keyboard Handlers | PARCIAL | onKeyDown/onKeyPress em 33+ arquivos |
| AlertDialog para confirmacoes | OK | 18+ usos em deletes destrutivos |
| Breadcrumbs acessiveis | OK | aria-label="breadcrumb", separadores aria-hidden |

### Problemas Identificados

| Problema | Severidade | Localizacao | Impacto WCAG |
|----------|------------|-------------|--------------|
| `<html lang="en">` em vez de `"pt-BR"` | ALTA | index.html | 3.1.1 - Language of Page |
| Falta de `<header>` semantico | ALTA | MainLayout.tsx | 1.3.1 - Info and Relationships |
| Falta de `<footer>` semantico | ALTA | MainLayout.tsx | 1.3.1 - Info and Relationships |
| Falta de `<fieldset>/<legend>` em grupos | MEDIA | Formularios | 1.3.1 - Info and Relationships |
| Hierarquia de headings inconsistente | MEDIA | Diversos | 1.3.1 - Info and Relationships |
| Botoes de icone sem aria-label | MEDIA | Diversos modais | 4.1.2 - Name, Role, Value |
| Video sem controles acessiveis | MEDIA | HeroSection.tsx | 1.2.1 - Audio-only/Video-only |
| Falta role="button" em divs clicaveis | BAIXA | FooterLink | 4.1.2 - Name, Role, Value |
| Alguns inputs sem aria-describedby | BAIXA | Diversos | 1.3.1 - Info and Relationships |
| Falta aria-current="page" no nav | BAIXA | AppSidebar | 2.4.8 - Location |

---

## Matriz de Conformidade WCAG 2.1 AA

### Perceivable (Perceptivel)

| Criterio | Status | Acao Necessaria |
|----------|--------|-----------------|
| 1.1.1 Non-text Content | PARCIAL | Adicionar alt text em imagens decorativas |
| 1.3.1 Info and Relationships | PARCIAL | Adicionar header, footer, fieldset/legend |
| 1.3.2 Meaningful Sequence | OK | Ordem DOM logica |
| 1.3.4 Orientation | OK | Layout responsivo |
| 1.4.1 Use of Color | PARCIAL | Garantir icones alem de cor em status |
| 1.4.3 Contrast Minimum | OK | 4.5:1 nas variables CSS |
| 1.4.4 Resize Text | OK | Layout nao quebra em 200% |
| 1.4.10 Reflow | OK | Responsivo ate 320px |
| 1.4.11 Non-text Contrast | OK | 3:1 em graficos |
| 1.4.12 Text Spacing | OK | Sem quebra com spacing aumentado |

### Operable (Operavel)

| Criterio | Status | Acao Necessaria |
|----------|--------|-----------------|
| 2.1.1 Keyboard | PARCIAL | Verificar todos elementos interativos |
| 2.1.2 No Keyboard Trap | OK | Modais fecham com Escape |
| 2.4.1 Bypass Blocks | OK | SkipLinks implementado |
| 2.4.2 Page Titled | OK | Titulo dinamico |
| 2.4.3 Focus Order | OK | Ordem tabindex logica |
| 2.4.4 Link Purpose | PARCIAL | Alguns links sem contexto claro |
| 2.4.6 Headings and Labels | PARCIAL | Hierarquia inconsistente |
| 2.4.7 Focus Visible | OK | focus-visible:ring-2 |

### Understandable (Compreensivel)

| Criterio | Status | Acao Necessaria |
|----------|--------|-----------------|
| 3.1.1 Language of Page | FALHA | Corrigir lang="pt-BR" |
| 3.1.2 Language of Parts | N/A | Conteudo em portugues |
| 3.2.1 On Focus | OK | Nenhuma mudanca inesperada |
| 3.2.2 On Input | OK | Formularios controlados |
| 3.3.1 Error Identification | OK | FormMessage com role="alert" |
| 3.3.2 Labels or Instructions | OK | Labels para inputs |
| 3.3.3 Error Suggestion | OK | Mensagens de erro especificas |

### Robust

| Criterio | Status | Acao Necessaria |
|----------|--------|-----------------|
| 4.1.1 Parsing | OK | React gera HTML valido |
| 4.1.2 Name, Role, Value | PARCIAL | Adicionar aria-labels em icones |
| 4.1.3 Status Messages | PARCIAL | Adicionar aria-live em mais areas |

---

## Plano de Correcoes

### FASE 1: Correcoes Criticas (Lang e HTML Semantico)

#### 1.1 Corrigir Atributo lang

**Arquivo:** `index.html`

```html
<!-- ANTES (linha 2) -->
<html lang="en">

<!-- DEPOIS -->
<html lang="pt-BR">
```

#### 1.2 Adicionar Header e Footer Semanticos ao MainLayout

**Arquivo:** `src/components/MainLayout.tsx`

```typescript
// ANTES (linha 92-99)
<div className="flex-1 flex flex-col min-w-0">
  <AppHeader />
  <main id="main-content" className="flex-1 p-3 sm:p-4 md:p-6 bg-muted/10">
    <Breadcrumbs />
    {children}
  </main>
</div>

// DEPOIS
<div className="flex-1 flex flex-col min-w-0">
  <header role="banner">
    <AppHeader />
  </header>
  <main id="main-content" className="flex-1 p-3 sm:p-4 md:p-6 bg-muted/10">
    <Breadcrumbs />
    {children}
  </main>
  <footer role="contentinfo" className="sr-only">
    <p>Daton - Plataforma ESG Inteligente</p>
  </footer>
</div>
```

---

### FASE 2: Melhorias em Formularios

#### 2.1 Criar Componente Fieldset Acessivel

**Arquivo:** `src/components/ui/fieldset.tsx` (NOVO)

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldsetProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend: string;
  legendClassName?: string;
  hideLegend?: boolean;
}

const Fieldset = React.forwardRef<HTMLFieldSetElement, FieldsetProps>(
  ({ legend, legendClassName, hideLegend, className, children, ...props }, ref) => {
    return (
      <fieldset
        ref={ref}
        className={cn("space-y-4 border-0 p-0 m-0", className)}
        {...props}
      >
        <legend 
          className={cn(
            hideLegend ? "sr-only" : "text-sm font-medium text-foreground mb-2",
            legendClassName
          )}
        >
          {legend}
        </legend>
        {children}
      </fieldset>
    );
  }
);
Fieldset.displayName = "Fieldset";

export { Fieldset };
```

#### 2.2 Atualizar Formulario de Registro com Fieldsets

**Arquivo:** `src/pages/Auth.tsx`

Envolver grupos de campos com `<Fieldset>`:
- "Dados da Empresa" (company_name, cnpj)
- "Dados do Usuário" (user_name, email, password)

---

### FASE 3: Hierarquia de Headings

#### 3.1 Criar Utilitario de Verificacao de Headings

**Arquivo:** `src/utils/accessibilityAudit.ts` (NOVO)

```typescript
/**
 * Accessibility Audit Utilities
 * Development-only tools for WCAG compliance verification
 */

export function auditHeadingHierarchy(): {
  valid: boolean;
  issues: string[];
  headings: { level: number; text: string }[];
} {
  if (typeof document === 'undefined') {
    return { valid: true, issues: [], headings: [] };
  }

  const headings: { level: number; text: string }[] = [];
  const issues: string[] = [];
  let lastLevel = 0;
  let hasH1 = false;

  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
    const level = parseInt(el.tagName[1]);
    const text = el.textContent?.trim() || '';
    headings.push({ level, text });

    if (level === 1) {
      if (hasH1) {
        issues.push(`Multiple h1 found: "${text}"`);
      }
      hasH1 = true;
    }

    if (level > lastLevel + 1 && lastLevel !== 0) {
      issues.push(
        `Heading level skip: h${lastLevel} to h${level} ("${text}")`
      );
    }

    lastLevel = level;
  });

  if (!hasH1) {
    issues.push('No h1 heading found on page');
  }

  return {
    valid: issues.length === 0,
    issues,
    headings,
  };
}

// Run audit in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    const audit = auditHeadingHierarchy();
    if (!audit.valid) {
      console.warn('🔍 Accessibility - Heading Issues:', audit.issues);
    }
  }, 2000);
}
```

#### 3.2 Padronizar Hierarquia em Paginas

**Padrao a seguir em todas as paginas:**

```typescript
// Cada pagina deve ter UM h1 como titulo principal
<h1 className="text-3xl font-bold">Titulo da Pagina</h1>

// Secoes com h2
<h2 className="text-xl font-semibold">Secao Principal</h2>

// Subsecoes com h3
<h3 className="text-lg font-medium">Subsecao</h3>
```

---

### FASE 4: Botoes de Icone e ARIA

#### 4.1 Criar Componente IconButton Acessivel

**Arquivo:** `src/components/ui/icon-button.tsx` (NOVO)

```typescript
import * as React from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  label: string;
  showLabel?: boolean;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, showLabel = false, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={showLabel ? "default" : "icon"}
        aria-label={label}
        className={cn("gap-2", className)}
        {...props}
      >
        <span aria-hidden="true">{icon}</span>
        {showLabel ? (
          <span>{label}</span>
        ) : (
          <span className="sr-only">{label}</span>
        )}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";

export { IconButton };
```

#### 4.2 Atualizar Botoes sem Labels

**Exemplos de correcao em diversos arquivos:**

```typescript
// ANTES
<Button variant="ghost" size="icon">
  <MoreVertical className="h-4 w-4" />
</Button>

// DEPOIS
<Button variant="ghost" size="icon" aria-label="Mais opcoes">
  <MoreVertical className="h-4 w-4" aria-hidden="true" />
  <span className="sr-only">Mais opcoes</span>
</Button>
```

---

### FASE 5: Video Acessivel

#### 5.1 Adicionar Controles ao Video do Hero

**Arquivo:** `src/components/landing/heimdall/HeroSection.tsx`

```typescript
// ANTES (linha 180-197)
<video
  autoPlay 
  muted 
  loop 
  playsInline
  onLoadedData={() => setVideoLoaded(true)}
  ...
>

// DEPOIS - Adicionar aria-label e role
<video
  autoPlay 
  muted 
  loop 
  playsInline
  onLoadedData={() => setVideoLoaded(true)}
  aria-label="Video demonstrativo do dashboard ESG - decorativo"
  role="presentation"
  aria-hidden="true"  // Video puramente decorativo
  ...
>
```

---

### FASE 6: Navegacao e Estado Atual

#### 6.1 Adicionar aria-current ao Sidebar

**Arquivo:** `src/components/AppSidebar.tsx`

```typescript
// Em cada item de navegacao ativo
<SidebarMenuButton 
  isActive={isActive}
  aria-current={isActive ? "page" : undefined}
  // ...
>
```

#### 6.2 Criar Link com Indicador de Rota Atual

**Arquivo:** `src/components/ui/nav-link.tsx` (NOVO)

```typescript
import { Link, LinkProps, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
}

export function NavLink({ 
  to, 
  className, 
  activeClassName = "font-semibold",
  children,
  ...props 
}: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(className, isActive && activeClassName)}
      aria-current={isActive ? "page" : undefined}
      {...props}
    >
      {children}
    </Link>
  );
}
```

---

### FASE 7: Anuncios de Status

#### 7.1 Criar Componente de Live Region

**Arquivo:** `src/components/ui/live-region.tsx` (NOVO)

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  politeness?: "polite" | "assertive";
  atomic?: boolean;
  relevant?: "additions" | "removals" | "text" | "all";
}

const LiveRegion = React.forwardRef<HTMLDivElement, LiveRegionProps>(
  ({ politeness = "polite", atomic = true, relevant = "additions", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live={politeness}
        aria-atomic={atomic}
        aria-relevant={relevant}
        className={cn("sr-only", className)}
        {...props}
      />
    );
  }
);
LiveRegion.displayName = "LiveRegion";

export { LiveRegion };
```

---

### FASE 8: Indicadores Visuais Alem de Cor

#### 8.1 Atualizar Badge de Status

Garantir que badges de status usem icones alem de cor:

```typescript
// ANTES
<Badge className="bg-green-500">Ativo</Badge>
<Badge className="bg-red-500">Inativo</Badge>

// DEPOIS
<Badge className="bg-green-500 gap-1">
  <CheckCircle className="h-3 w-3" aria-hidden="true" />
  Ativo
</Badge>
<Badge className="bg-red-500 gap-1">
  <XCircle className="h-3 w-3" aria-hidden="true" />
  Inativo
</Badge>
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/ui/fieldset.tsx` | Fieldset acessivel com legend |
| `src/components/ui/icon-button.tsx` | Botao de icone com aria-label |
| `src/components/ui/nav-link.tsx` | Link com aria-current |
| `src/components/ui/live-region.tsx` | Componente de aria-live |
| `src/utils/accessibilityAudit.ts` | Utilitarios de auditoria (dev) |

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `index.html` | lang="pt-BR" |
| `src/components/MainLayout.tsx` | header, footer semanticos |
| `src/pages/Auth.tsx` | Fieldsets em grupos de campos |
| `src/components/landing/heimdall/HeroSection.tsx` | Video com aria-hidden |
| `src/components/AppSidebar.tsx` | aria-current="page" |
| Diversos modais | aria-label em botoes de icone |

---

## Checklist de Validacao Final

### Testes Automatizados

- [ ] Axe DevTools: 0 violations (WCAG 2.1 AA)
- [ ] Lighthouse Accessibility: 90+
- [ ] WAVE Extension: Sem erros criticos

### Testes Manuais - Teclado

- [ ] Tab navega para todos elementos interativos
- [ ] Shift+Tab volta para elemento anterior
- [ ] Enter ativa buttons e links
- [ ] Escape fecha modais e menus
- [ ] Space ativa checkboxes e radios
- [ ] Nenhum elemento com keyboard trap

### Testes Manuais - Screen Reader

- [ ] VoiceOver (Mac): Navegacao completa
- [ ] NVDA (Windows): Formularios legiveis
- [ ] Headings anunciados corretamente
- [ ] Erros de form anunciados

### Testes Visuais

- [ ] Zoom 200%: Layout nao quebra
- [ ] High Contrast Mode: Conteudo visivel
- [ ] Focus indicator: Visivel em todos elementos
- [ ] Cores: Nao usadas sozinhas para informacao

---

## Ordem de Execucao

1. **Fase 1:** Correcoes criticas (lang, header, footer)
2. **Fase 2:** Componente Fieldset e uso em forms
3. **Fase 3:** Hierarquia de headings e auditoria
4. **Fase 4:** IconButton e aria-labels
5. **Fase 5:** Video acessivel
6. **Fase 6:** Navegacao com aria-current
7. **Fase 7:** Live regions para status
8. **Fase 8:** Indicadores visuais alem de cor
9. **Testes:** Axe, Lighthouse, teclado, screen reader

---

## Metricas de Sucesso

| Metrica | Antes | Depois |
|---------|-------|--------|
| Lighthouse Accessibility | ~85 | 95+ |
| Axe Violations | ~15 | 0 |
| lang correto | NAO | SIM |
| Elementos semanticos | PARCIAL | 100% |
| aria-label em icons | 70% | 100% |
| Keyboard navigable | 90% | 100% |

---

## Secao Tecnica

### Ferramentas de Teste

```bash
# Lighthouse CLI
npx lighthouse https://daton-esg-insight.lovable.app --only-categories=accessibility --view

# Axe CLI
npx @axe-core/cli https://daton-esg-insight.lovable.app
```

### Extensoes de Browser Recomendadas

1. **axe DevTools** - Auditorias WCAG automatizadas
2. **WAVE Evaluation Tool** - Visualizacao de problemas
3. **Headings Map** - Verificar hierarquia de headings
4. **Accessibility Insights** - Testes guiados

### Screen Readers para Teste

| OS | Screen Reader | Comando |
|----|---------------|---------|
| macOS | VoiceOver | Cmd+F5 |
| Windows | NVDA | Ctrl+Alt+N |
| Windows | Narrator | Win+Ctrl+Enter |
| Linux | Orca | Super+Alt+S |

### Contrast Checker

Usar WebAIM Contrast Checker para verificar:
- Texto normal (< 18pt): 4.5:1 minimo
- Texto grande (>= 18pt ou bold 14pt+): 3:1 minimo
- Elementos graficos: 3:1 minimo

### Regex para Encontrar Problemas

```bash
# Buscar botoes sem aria-label
grep -r 'size="icon"' src/components --include="*.tsx" | grep -v "aria-label"

# Buscar imagens sem alt
grep -r '<img' src --include="*.tsx" | grep -v 'alt='

# Buscar icons sem aria-hidden
grep -r 'Icon\s' src --include="*.tsx" | grep -v 'aria-hidden'
```
