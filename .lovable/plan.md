

# Plano de Teste e Correcao de Cross-Browser - Auditoria Completa

## Resumo Executivo

Este plano estabelece uma auditoria abrangente de compatibilidade cross-browser para a aplicacao Daton ESG, cobrindo Chrome, Safari, Firefox e Edge em dispositivos desktop e mobile. O plano inclui identificacao de problemas potenciais, implementacao de correcoes e criacao de uma matriz de compatibilidade.

---

## Analise do Estado Atual

### Infraestrutura de Build

| Recurso | Status | Avaliacao |
|---------|--------|-----------|
| Vite + React | v5.4.19 / v18.3.1 | Moderno, boa compatibilidade |
| PostCSS + Autoprefixer | Configurado | Prefixos automaticos |
| Tailwind CSS | v3.4.17 | Suporte robusto cross-browser |
| TypeScript | v5.8.3 | Transpilacao para ES2015+ |

### Bibliotecas Criticas para Compatibilidade

| Biblioteca | Versao | Risco de Compatibilidade |
|------------|--------|-------------------------|
| react-day-picker | v8.10.1 | Safari: OK (nao usa Date nativo) |
| framer-motion | v12.23.22 | Prefixos webkit incluidos |
| @radix-ui/* | Ultimas versoes | Acessibilidade built-in |
| recharts | v2.15.4 | SVG - universal |
| leaflet | v1.9.4 | Testado em todos navegadores |

### Pontos Fortes Identificados

1. **Autoprefixer configurado** - PostCSS adiciona prefixos automaticamente
2. **Tailwind CSS** - Gera CSS compativel com todos os navegadores modernos
3. **react-day-picker** - Nao depende de `<input type="date">` nativo
4. **Radix UI** - Componentes acessiveis com suporte a teclado built-in
5. **Focus states** - `focus-visible` presente em 21 arquivos
6. **Keyboard navigation** - Hook `useKeyboardNavigation` implementado
7. **ARIA labels** - Presentes em 13+ componentes

### Problemas Potenciais Identificados

| Problema | Severidade | Navegadores Afetados | Localizacao |
|----------|------------|---------------------|-------------|
| `backdrop-filter` sem prefixo webkit em alguns lugares | MEDIA | Safari iOS antigo | `heimdall.css` usa prefixo, mas inline styles nao |
| Inputs `type="date"` nativos (82 ocorrencias) | BAIXA | Safari 14- | Varios formularios |
| Falta de `type="tel"` em campos de telefone | BAIXA | Todos (UX) | Formularios |
| Smooth scroll pode falhar em Safari antigo | BAIXA | Safari 14- | Lenis scroll |
| CSS Grid sem fallback Flexbox | BAIXA | IE11 (nao suportado) | N/A |
| `prefers-color-scheme` nao detectado diretamente | INFO | Todos | Usa next-themes |

---

## Matriz de Testes por Navegador/Dispositivo

### Navegadores Desktop

| Navegador | Versao Minima | Viewport | Sistema |
|-----------|---------------|----------|---------|
| Chrome | 90+ | 1366x768, 1920x1080 | Windows, Mac |
| Safari | 14+ | 1366x768, 1920x1080 | Mac |
| Firefox | 88+ | 1366x768, 1920x1080 | Windows, Mac |
| Edge | 90+ | 1366x768, 1920x1080 | Windows |

### Dispositivos Mobile

| Dispositivo | Navegador | Viewport | Sistema |
|-------------|-----------|----------|---------|
| iPhone 12 | Safari | 390x844 | iOS |
| iPhone SE | Safari | 375x667 | iOS |
| Samsung Galaxy A71 | Chrome | 412x914 | Android |
| Google Pixel 5 | Chrome | 393x851 | Android |
| iPad | Safari | 768x1024 | iPadOS |
| iPad Pro | Safari | 1024x1366 | iPadOS |

---

## Plano de Correcoes

### Fase 1: CSS Cross-Browser Fixes

**1.1 Adicionar prefixos webkit para backdrop-filter inline**

**Arquivo:** `src/components/landing/heimdall/HeimdallNavbar.tsx`

O arquivo ja usa `WebkitBackdropFilter` em inline styles (linha 95), mas vamos verificar consistencia em todo o projeto.

**1.2 Criar utility class para backdrop-filter seguro**

**Arquivo:** `src/index.css`

```css
/* Cross-browser backdrop filter */
.backdrop-blur-safe {
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}

/* Safe area insets para notch devices */
.safe-area-inset {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

**1.3 Scroll behavior com fallback**

**Arquivo:** `src/index.css`

```css
/* Smooth scroll com fallback */
html {
  scroll-behavior: smooth;
}

@supports not (scroll-behavior: smooth) {
  html {
    scroll-behavior: auto;
  }
}

/* iOS momentum scrolling */
.scroll-touch {
  -webkit-overflow-scrolling: touch;
}
```

---

### Fase 2: Input Types Validation

**2.1 Verificar inputs de telefone**

O projeto nao usa `type="tel"` em nenhum lugar. Campos de telefone devem usar:

```tsx
<Input type="tel" inputMode="tel" pattern="[0-9]*" />
```

**Arquivos a verificar:**
- `src/components/EmployeeModal.tsx`
- `src/pages/SupplierRegistration.tsx`
- `src/components/StakeholderModal.tsx`

**2.2 Date inputs**

O projeto usa `react-day-picker` para selecao de datas em modals, mas tambem usa `<Input type="date">` em 82 lugares. Isso e aceitavel pois:
- Safari 14+ suporta `type="date"` nativo
- O fallback para texto funciona
- react-day-picker nao depende de input nativo

**Recomendacao:** Manter como esta para formularios simples, migrar para react-day-picker em casos criticos de UX.

---

### Fase 3: Acessibilidade e Teclado

**3.1 Verificar focus visibility**

O projeto ja usa `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` em componentes principais. Adicionar classe global de fallback:

**Arquivo:** `src/index.css`

```css
/* Fallback para navegadores sem suporte a focus-visible */
@supports not selector(:focus-visible) {
  button:focus,
  a:focus,
  input:focus,
  select:focus,
  textarea:focus {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }
}
```

**3.2 Skip links para acessibilidade**

**Arquivo:** `src/components/SkipLinks.tsx` (NOVO)

```tsx
export function SkipLinks() {
  return (
    <a 
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      Pular para o conteudo principal
    </a>
  );
}
```

---

### Fase 4: Dark Mode Cross-Browser

**4.1 Verificar deteccao de tema do sistema**

O projeto usa `next-themes` que ja detecta `prefers-color-scheme` automaticamente.

**Arquivo:** `src/App.tsx`

```tsx
<ThemeProvider 
  attribute="class"
  defaultTheme="system"  // Detecta preferencia do sistema
  enableSystem={true}    // Habilita deteccao automatica
>
```

**4.2 Adicionar meta tag para color-scheme**

**Arquivo:** `index.html`

```html
<meta name="color-scheme" content="light dark">
```

---

### Fase 5: Performance Cross-Browser

**5.1 Verificar Lazy Loading de Imagens**

O componente `ResponsiveImage` ja usa `loading="lazy"` por padrao.

**5.2 CSS Containment para performance**

**Arquivo:** `src/index.css`

```css
/* CSS Containment para cards e listas longas */
.contain-layout {
  contain: layout style;
}

.contain-paint {
  contain: paint;
}
```

---

### Fase 6: Print Styles

**6.1 Adicionar estilos de impressao globais**

**Arquivo:** `src/index.css`

```css
@media print {
  /* Esconder elementos nao imprimiveis */
  .no-print,
  .ai-chat-container,
  nav,
  .sidebar,
  button:not(.print-button) {
    display: none !important;
  }
  
  /* Reset de cores para economia de tinta */
  body {
    color: #000 !important;
    background: #fff !important;
  }
  
  /* Quebras de pagina controladas */
  .page-break-before {
    page-break-before: always;
  }
  
  .page-break-after {
    page-break-after: always;
  }
  
  .avoid-break {
    break-inside: avoid;
  }
  
  /* Garantir contraste em links */
  a {
    color: #000 !important;
    text-decoration: underline !important;
  }
  
  /* Mostrar URLs de links */
  a[href^="http"]:after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
  }
}
```

---

### Fase 7: Zoom Testing Support

**7.1 Garantir layout nao quebra em zoom 200%**

Os componentes ja usam unidades relativas (rem, %) e Tailwind responsive classes. Verificar:

**Checklist:**
- [ ] Texto nao e cortado em zoom 200%
- [ ] Botoes continuam clicaveis
- [ ] Formularios continuam usaveis
- [ ] Navegacao funciona

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/SkipLinks.tsx` | Link de pular navegacao para acessibilidade |
| `src/utils/browserDetection.ts` | Utilitarios para deteccao de navegador (opcional) |

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/index.css` | Adicionar cross-browser utilities e print styles |
| `index.html` | Adicionar meta tag color-scheme |
| `src/components/MainLayout.tsx` | Adicionar SkipLinks e id="main-content" |

---

## Checklist de Testes por Navegador

### Testes Funcionais

| Teste | Chrome | Safari | Firefox | Edge |
|-------|--------|--------|---------|------|
| Carregar aplicacao sem erros console | [ ] | [ ] | [ ] | [ ] |
| Render cores, fonts, icones corretos | [ ] | [ ] | [ ] | [ ] |
| Formularios com inputs corretos | [ ] | [ ] | [ ] | [ ] |
| Date picker funciona | [ ] | [ ] | [ ] | [ ] |
| Validacao HTML5 mensagens | [ ] | [ ] | [ ] | [ ] |
| Teclado virtual nao esconde inputs | [ ] | [ ] | [ ] | [ ] |
| Scroll smooth sem jank | [ ] | [ ] | [ ] | [ ] |
| Botoes tamanho correto | [ ] | [ ] | [ ] | [ ] |
| Links clicaveis, hover states | [ ] | [ ] | [ ] | [ ] |
| Performance LCP menos que 2.5s | [ ] | [ ] | [ ] | [ ] |

### Testes Especificos

| Teste | Chrome | Safari | Firefox | Edge |
|-------|--------|--------|---------|------|
| Zoom 200% layout nao quebra | [ ] | [ ] | [ ] | [ ] |
| Print Ctrl+P pagina legivel | [ ] | [ ] | [ ] | [ ] |
| Tab navigation focus visivel | [ ] | [ ] | [ ] | [ ] |
| Dark mode do SO responde | [ ] | [ ] | [ ] | [ ] |
| Backdrop-filter funciona | [ ] | [ ] | [ ] | [ ] |
| iOS momentum scroll | N/A | [ ] | N/A | N/A |

### Testes por Dispositivo Mobile

| Teste | iPhone 12 | iPhone SE | Galaxy A71 | Pixel 5 | iPad |
|-------|-----------|-----------|------------|---------|------|
| Touch targets 44x44px | [ ] | [ ] | [ ] | [ ] | [ ] |
| Text min 16px | [ ] | [ ] | [ ] | [ ] | [ ] |
| Teclado virtual | [ ] | [ ] | [ ] | [ ] | [ ] |
| Orientacao landscape | [ ] | [ ] | [ ] | [ ] | [ ] |
| Safe area insets | [ ] | [ ] | [ ] | [ ] | [ ] |

---

## Script de Teste Automatizado (Recomendacao)

Para testes automatizados de cross-browser, recomenda-se usar Playwright ou Cypress com BrowserStack:

```typescript
// playwright.config.ts (exemplo futuro)
export default {
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
};
```

---

## Relatorio de Conformidade WCAG

### Criterios WCAG 2.1 AA Verificados

| Criterio | Status | Notas |
|----------|--------|-------|
| 1.4.3 Contraste Minimo | VERIFICAR | Usar ferramentas de contraste |
| 1.4.4 Redimensionar Texto | OK | Tailwind usa rem |
| 2.1.1 Teclado | OK | useKeyboardNavigation implementado |
| 2.4.1 Ignorar Blocos | IMPLEMENTAR | Adicionar SkipLinks |
| 2.4.3 Ordem de Foco | OK | Ordem natural do DOM |
| 2.4.7 Foco Visivel | OK | focus-visible em componentes |
| 3.3.2 Rotulos ou Instrucoes | OK | Labels em formularios |

---

## Ordem de Execucao

1. **Fase 1:** CSS Cross-Browser Fixes (backdrop-filter, scroll)
2. **Fase 2:** Input Types Validation (tel, verificar date)
3. **Fase 3:** Acessibilidade (SkipLinks, focus fallback)
4. **Fase 4:** Dark Mode (meta tag color-scheme)
5. **Fase 5:** Performance (CSS containment)
6. **Fase 6:** Print Styles
7. **Fase 7:** Testes manuais em cada navegador/dispositivo
8. **Fase 8:** Documentacao de matriz de compatibilidade

---

## Entregaveis Finais

- Cross-browser CSS utilities adicionadas
- Print styles implementados
- SkipLinks para acessibilidade
- Meta tag color-scheme adicionada
- Checklist de testes por navegador preenchido
- Relatorio de conformidade WCAG atualizado
- Matriz de compatibilidade documentada

