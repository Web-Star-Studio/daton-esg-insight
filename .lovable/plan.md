

# Plano de Implementacao de Design System Completo

## Resumo Executivo

Este plano documenta uma auditoria abrangente do Design System do Daton ESG Insight e propoe melhorias para garantir consistencia visual profissional em toda a aplicacao. A analise revelou uma base solida ja implementada, com areas especificas para padronizacao e documentacao.

---

## Diagnostico do Estado Atual

### Pontos Fortes Identificados

| Categoria | Status | Detalhes |
|-----------|--------|----------|
| Cores Primarias | EXCELENTE | Verde Daton #00bf63 (HSL 151 100% 37%) bem definido |
| CSS Variables | EXCELENTE | 50+ variables em HSL no index.css |
| Dark Mode | OK | Suporte completo light/dark com ThemeProvider |
| Spacing System | OK | 8px grid documentado (--spacing-xs a --spacing-2xl) |
| Shadows | OK | 5 niveis padronizados (xs, sm, md, lg, hover) |
| Transitions | OK | --transition-smooth e --transition-fast definidos |
| Border Radius | OK | --radius: 0.75rem com variantes (lg, md, sm) |
| Typography | PARCIAL | Inter definido, mas falta escala tipografica formal |
| Chart Colors | EXCELENTE | 5 cores harmonizadas para graficos |
| Focus States | OK | focus-visible:ring-2 padronizado |
| Print Styles | OK | @media print abrangente |
| Responsive | OK | Breakpoints 320px-1920px com utilities |

### Problemas Identificados

| Problema | Severidade | Quantidade | Impacto |
|----------|------------|------------|---------|
| Cores hardcoded (bg-green-500, etc) | MEDIA | 251 arquivos | Inconsistencia de cores |
| Falta badge variants (success, warning) | MEDIA | 1 componente | UX inconsistente |
| Hex hardcoded (#15c470) em Navbar | BAIXA | 1 arquivo | Manutencao dificil |
| Falta documentacao formal de tokens | MEDIA | 0 arquivos | Onboarding de devs |
| Info color nao definida | BAIXA | CSS variables | Falta cor semantica |
| Typography scale informal | MEDIA | Diversos | Tamanhos inconsistentes |

---

## Design System Atual (Ja Implementado)

### 1. Paleta de Cores (CSS Variables)

```text
+------------------+-------------------+------------------------+
| Cor              | HSL Light         | Uso                    |
+------------------+-------------------+------------------------+
| Primary          | 151 100% 37%      | Verde Daton (#00bf63)  |
| Primary Light    | 151 60% 85%       | Backgrounds suaves     |
| Secondary        | 210 17% 96%       | Elementos neutros      |
| Accent           | 151 100% 32%      | Verde mais escuro      |
| Destructive      | 0 84% 60%         | Vermelho erros         |
| Success          | 151 100% 37%      | Verde sucesso          |
| Warning          | 38 92% 50%        | Laranja avisos         |
| Background       | 0 0% 100%         | Branco fundo           |
| Foreground       | 0 0% 9%           | Texto principal        |
| Muted            | 210 17% 95%       | Backgrounds secundarios|
| Muted Foreground | 0 0% 45%          | Texto secundario       |
+------------------+-------------------+------------------------+
```

### 2. Sistema de Sombras (Definido)

```css
--shadow-xs: 0 1px 2px 0 hsl(0 0% 9% / 0.05);
--shadow-sm: 0 1px 3px 0 hsl(0 0% 9% / 0.1), 0 1px 2px -1px hsl(0 0% 9% / 0.1);
--shadow-md: 0 4px 6px -1px hsl(0 0% 9% / 0.1), 0 2px 4px -2px hsl(0 0% 9% / 0.1);
--shadow-lg: 0 10px 15px -3px hsl(0 0% 9% / 0.1), 0 4px 6px -4px hsl(0 0% 9% / 0.1);
--shadow-hover: 0 20px 25px -5px hsl(0 0% 9% / 0.1), 0 8px 10px -6px hsl(0 0% 9% / 0.1);
```

### 3. Sistema de Espacamento (8px Grid)

```css
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
--spacing-2xl: 3rem;    /* 48px */
```

### 4. Border Radius

```css
--radius: 0.75rem; /* 12px - Base */
/* Via Tailwind */
rounded-lg: 12px
rounded-md: 10px
rounded-sm: 8px
rounded-full: 50%
```

---

## Plano de Melhorias

### FASE 1: Documentacao Formal do Design System

#### 1.1 Criar Arquivo de Design Tokens

**Arquivo:** `src/constants/designTokens.ts` (NOVO)

```typescript
/**
 * Daton Design System - Design Tokens
 * 
 * Documentacao formal dos tokens de design para uso consistente
 * em toda a aplicacao.
 */

export const DESIGN_TOKENS = {
  // ============ CORES SEMANTICAS ============
  colors: {
    primary: {
      DEFAULT: 'hsl(151, 100%, 37%)', // #00bf63 - Verde Daton
      light: 'hsl(151, 60%, 85%)',
      dark: 'hsl(151, 100%, 32%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    secondary: {
      DEFAULT: 'hsl(210, 17%, 96%)',
      foreground: 'hsl(0, 0%, 9%)',
    },
    destructive: {
      DEFAULT: 'hsl(0, 84%, 60%)', // Vermelho
      light: 'hsl(0, 84%, 95%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    success: {
      DEFAULT: 'hsl(151, 100%, 37%)', // Verde
      light: 'hsl(151, 60%, 90%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    warning: {
      DEFAULT: 'hsl(38, 92%, 50%)', // Laranja
      light: 'hsl(38, 92%, 90%)',
      foreground: 'hsl(0, 0%, 9%)',
    },
    info: {
      DEFAULT: 'hsl(199, 89%, 48%)', // Azul
      light: 'hsl(199, 89%, 90%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    neutral: {
      50: 'hsl(0, 0%, 98%)',
      100: 'hsl(0, 0%, 96%)',
      200: 'hsl(0, 0%, 91%)',
      300: 'hsl(0, 0%, 83%)',
      400: 'hsl(0, 0%, 64%)',
      500: 'hsl(0, 0%, 45%)',
      600: 'hsl(0, 0%, 32%)',
      700: 'hsl(0, 0%, 21%)',
      800: 'hsl(0, 0%, 9%)',
      900: 'hsl(0, 0%, 4%)',
    },
  },

  // ============ TIPOGRAFIA ============
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // ============ ESPACAMENTO (8px Grid) ============
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
  },

  // ============ BORDER RADIUS ============
  borderRadius: {
    none: '0',
    sm: '0.5rem',     // 8px - Inputs pequenos
    DEFAULT: '0.75rem', // 12px - Cards, botoes
    lg: '1rem',       // 16px - Modais
    full: '9999px',   // Circular - Avatars, badges
  },

  // ============ SOMBRAS ============
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },

  // ============ TRANSICOES ============
  transitions: {
    fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // ============ BREAKPOINTS ============
  breakpoints: {
    xs: '320px',
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1366px',
    '2xl': '1920px',
  },

  // ============ Z-INDEX ============
  zIndex: {
    dropdown: 50,
    sticky: 100,
    modal: 150,
    popover: 200,
    tooltip: 250,
    toast: 300,
  },
} as const;

// Tipos para autocomplete
export type ColorToken = keyof typeof DESIGN_TOKENS.colors;
export type SpacingToken = keyof typeof DESIGN_TOKENS.spacing;
export type ShadowToken = keyof typeof DESIGN_TOKENS.shadows;
```

---

### FASE 2: Adicionar Variaveis CSS Faltantes

#### 2.1 Adicionar Info Color ao CSS

**Arquivo:** `src/index.css`

Adicionar na secao `:root`:

```css
/* Azul para informacoes */
--info: 199 89% 48%;
--info-foreground: 0 0% 100%;
```

Adicionar na secao `.dark`:

```css
--info: 199 89% 55%;
--info-foreground: 0 0% 100%;
```

#### 2.2 Registrar no Tailwind Config

**Arquivo:** `tailwind.config.ts`

Adicionar em `colors`:

```typescript
info: {
  DEFAULT: "hsl(var(--info))",
  foreground: "hsl(var(--info-foreground))",
},
```

---

### FASE 3: Adicionar Variantes de Badge

#### 3.1 Atualizar Componente Badge

**Arquivo:** `src/components/ui/badge.tsx`

```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // NOVAS VARIANTES
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/80",
        // Variantes sutis (fundo claro)
        "success-subtle": "border-success/30 bg-success/10 text-success hover:bg-success/20",
        "warning-subtle": "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20",
        "destructive-subtle": "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
        "info-subtle": "border-info/30 bg-info/10 text-info hover:bg-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

---

### FASE 4: Corrigir Hex Hardcoded

#### 4.1 Atualizar HeimdallNavbar

**Arquivo:** `src/components/landing/heimdall/HeimdallNavbar.tsx`

Substituir:
```tsx
className="... bg-[#15c470] ..."
```

Por:
```tsx
className="... bg-primary ..."
```

---

### FASE 5: Criar Componentes de Status Padronizados

#### 5.1 Criar Componente StatusIndicator

**Arquivo:** `src/components/ui/status-indicator.tsx` (NOVO)

```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Info, Clock, Loader2 } from "lucide-react";

const statusVariants = cva(
  "inline-flex items-center gap-1.5 text-sm font-medium",
  {
    variants: {
      status: {
        success: "text-success",
        error: "text-destructive",
        warning: "text-warning",
        info: "text-info",
        pending: "text-muted-foreground",
        loading: "text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "info",
    },
  }
);

const StatusIcon = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  pending: Clock,
  loading: Loader2,
};

interface StatusIndicatorProps extends VariantProps<typeof statusVariants> {
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

export function StatusIndicator({ 
  status = "info", 
  children, 
  showIcon = true,
  className 
}: StatusIndicatorProps) {
  const Icon = StatusIcon[status || "info"];
  
  return (
    <span className={cn(statusVariants({ status }), className)}>
      {showIcon && (
        <Icon 
          className={cn(
            "h-4 w-4 flex-shrink-0",
            status === "loading" && "animate-spin"
          )} 
          aria-hidden="true" 
        />
      )}
      {children && <span>{children}</span>}
    </span>
  );
}
```

---

### FASE 6: Criar Utilitarios de Cor Semantica

#### 6.1 Criar Funcoes Helper

**Arquivo:** `src/utils/designHelpers.ts` (NOVO)

```typescript
/**
 * Design System Helpers
 * Funcoes utilitarias para uso consistente do design system
 */

/**
 * Retorna classes de cor semantica baseado no status
 */
export function getStatusClasses(status: 'success' | 'error' | 'warning' | 'info' | 'neutral') {
  const statusMap = {
    success: {
      bg: 'bg-success/10',
      border: 'border-success/30',
      text: 'text-success',
      solid: 'bg-success text-success-foreground',
    },
    error: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      text: 'text-destructive',
      solid: 'bg-destructive text-destructive-foreground',
    },
    warning: {
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      text: 'text-warning',
      solid: 'bg-warning text-warning-foreground',
    },
    info: {
      bg: 'bg-info/10',
      border: 'border-info/30',
      text: 'text-info',
      solid: 'bg-info text-info-foreground',
    },
    neutral: {
      bg: 'bg-muted',
      border: 'border-border',
      text: 'text-muted-foreground',
      solid: 'bg-secondary text-secondary-foreground',
    },
  };
  
  return statusMap[status];
}

/**
 * Retorna classes de prioridade
 */
export function getPriorityClasses(priority: 'high' | 'medium' | 'low') {
  const priorityMap = {
    high: 'bg-destructive/10 text-destructive border-destructive/30',
    medium: 'bg-warning/10 text-warning border-warning/30',
    low: 'bg-success/10 text-success border-success/30',
  };
  
  return priorityMap[priority];
}

/**
 * Retorna classes de confianca/score
 */
export function getConfidenceClasses(confidence: number) {
  if (confidence >= 0.8) return 'bg-success/10 text-success border-success/30';
  if (confidence >= 0.6) return 'bg-warning/10 text-warning border-warning/30';
  return 'bg-destructive/10 text-destructive border-destructive/30';
}
```

---

### FASE 7: Documentacao Visual

#### 7.1 Criar Pagina de Storybook/Design System

**Arquivo:** `src/pages/DesignSystem.tsx` (NOVO - Opcional, para desenvolvimento)

Esta pagina servira como referencia visual para desenvolvedores, mostrando todos os tokens e componentes disponiveis.

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/constants/designTokens.ts` | Documentacao formal dos design tokens |
| `src/components/ui/status-indicator.tsx` | Componente de status padronizado |
| `src/utils/designHelpers.ts` | Funcoes helper para cores semanticas |

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/index.css` | Adicionar --info e --info-foreground |
| `tailwind.config.ts` | Adicionar cor info |
| `src/components/ui/badge.tsx` | Adicionar variantes success, warning, info |
| `src/components/landing/heimdall/HeimdallNavbar.tsx` | Substituir hex hardcoded |

---

## Checklist de Validacao

### Cores
- [x] Primary definida (Verde Daton #00bf63)
- [x] Secondary definida
- [x] Destructive definida
- [x] Success definida
- [x] Warning definida
- [ ] Info a adicionar
- [x] Contrast 4.5:1 para texto

### Tipografia
- [x] Inter como fonte principal
- [x] Font weights definidos (400-700)
- [ ] Escala tipografica a documentar formalmente

### Espacamento
- [x] 8px grid implementado
- [x] CSS variables definidas

### Sombras
- [x] 5 niveis padronizados
- [x] Hover states com shadow-hover

### Border Radius
- [x] --radius base definido (12px)
- [x] Variantes sm, md, lg via Tailwind

### Componentes
- [x] Button variants consistentes
- [ ] Badge variants a expandir (success, warning, info)
- [x] Card styles padronizados
- [ ] StatusIndicator a criar

---

## Ordem de Execucao

1. **Fase 1:** Criar designTokens.ts (documentacao)
2. **Fase 2:** Adicionar info color ao CSS e Tailwind
3. **Fase 3:** Expandir badge variants
4. **Fase 4:** Corrigir hex hardcoded na Navbar
5. **Fase 5:** Criar StatusIndicator component
6. **Fase 6:** Criar design helpers
7. **Validacao:** Verificar consistencia visual em todas as paginas

---

## Metricas de Sucesso

| Metrica | Antes | Depois |
|---------|-------|--------|
| CSS Variables documentadas | Parcial | 100% |
| Cores semanticas disponiveis | 5 | 6 (+ info) |
| Badge variants | 4 | 11 |
| Hex hardcoded | 1 | 0 |
| Design tokens documentados | 0% | 100% |
| Componentes de status | 0 | 1 |

---

## Secao Tecnica

### Ferramentas de Validacao

```bash
# Verificar cores hardcoded
grep -rn "bg-green-\|bg-red-\|bg-yellow-\|bg-blue-\|bg-orange-" src/components --include="*.tsx" | wc -l

# Verificar hex hardcoded
grep -rn "#[0-9a-fA-F]\{6\}\|#[0-9a-fA-F]\{3\}" src/components --include="*.tsx"

# Verificar uso de design tokens
grep -rn "DESIGN_TOKENS" src --include="*.tsx" --include="*.ts"
```

### Contrast Checker

Para validar contraste WCAG:
- Texto normal: minimo 4.5:1
- Texto grande (18px+): minimo 3:1
- Ferramenta: WebAIM Contrast Checker

### Migracao Gradual

Para migrar cores hardcoded (bg-green-500, etc) para variaveis semanticas:

1. Identificar contexto (sucesso, erro, aviso, info)
2. Substituir por classe semantica correspondente:
   - `bg-green-500` -> `bg-success`
   - `bg-red-500` -> `bg-destructive`
   - `bg-yellow-500` -> `bg-warning`
   - `bg-blue-500` -> `bg-info`

Esta migracao pode ser feita gradualmente em sprints futuras.

