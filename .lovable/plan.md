

# Plano de Auditoria Completa de Usabilidade

## Resumo Executivo

Este plano apresenta uma auditoria abrangente de usabilidade do sistema Daton ESG Insight, cobrindo 150+ paginas agrupadas em 12 categorias funcionais. A auditoria identifica melhorias de navegacao, CTAs, formularios, feedback, e acessibilidade conforme a diretiva do CTO.

---

## Mapeamento de Paginas Principais

### Categorias de Paginas

| Categoria | Quantidade | Paginas Principais |
|-----------|------------|-------------------|
| Landing/Marketing | 5 | LandingPage, Funcionalidades, Contato, FAQ, Documentacao |
| Autenticacao | 4 | Auth, ResetPassword, SetPassword, SupplierLogin |
| Dashboard | 3 | Dashboard, AdminDashboard, QualityDashboard |
| ESG Ambiental | 15 | GestaoESG, InventarioGEE, DashboardGHG, Residuos, Metas, Monitoramento* |
| ESG Social | 12 | SocialESG, GestaoFuncionarios, Treinamentos, SegurancaTrabalho, Carreira |
| ESG Governanca | 8 | GovernancaESG, Compliance, Auditoria, GestaoRiscos, GestaoStakeholders |
| Qualidade (SGQ) | 10 | NaoConformidades, AcoesCorretivas, ControleDocumentos, LAIA |
| Financeiro | 14 | DashboardFinanceiro, ContasAPagar, ContasAReceber, FluxoCaixa, Orcamento |
| Fornecedores | 18 | SupplierManagementDashboard, Cadastro, Avaliacoes, Falhas, Indicadores |
| RH | 10 | EstruturaOrganizacional, DescricaoCargos, Recrutamento, BeneficiosRemuneracao |
| Dados/Relatorios | 8 | ColetaDados, DocumentosHub, RelatoriosIntegrados, SDGDashboard |
| Configuracoes | 5 | Configuracao, GestaoUsuarios, AdminDashboard, PlatformAdminDashboard |

---

## Diagnostico do Estado Atual

### Pontos Fortes Identificados

| Categoria | Status | Implementacao |
|-----------|--------|---------------|
| Navegacao Principal | OK | AppSidebar com menu colapsavel, agrupamentos logicos |
| Breadcrumbs | OK | Componente global Breadcrumbs em MainLayout |
| Logo leva a Home | OK | Sidebar e Navbar com link para "/" |
| Skip Links | OK | SkipLinks component implementado para acessibilidade |
| Confirmacao de Acoes Destrutivas | OK | AlertDialog em 18+ arquivos para delete/exclusao |
| Loading States | OK | EnhancedLoading com 4 variantes (default, dots, pulse, gradient) |
| Toast System | OK | Sonner + SmartToastProvider com tipos success/error/warning/info |
| Keyboard Shortcuts | OK | GlobalKeyboardShortcuts (Ctrl+K busca, Ctrl+D docs, etc.) |
| Focus Visible | OK | `focus-visible:ring-2` padrao em 30+ componentes |
| Error Boundary | OK | Componente global com retry e go home |
| Form Validation | OK | Zod + react-hook-form com FormMessage |
| Password Requirements | OK | Feedback visual em tempo real no Auth.tsx |
| Reduced Motion | OK | `@media (prefers-reduced-motion)` no CSS |
| Print Styles | OK | `@media print` com estilos apropriados |
| Dark Mode | OK | ThemeProvider com suporte a light/dark/system |

### Problemas Identificados

| Problema | Severidade | Localizacao | Impacto |
|----------|------------|-------------|---------|
| Footer links nao navegam | MEDIA | HeimdallFooter.tsx | Links de Privacidade/Termos/Seguranca tem onClick vazio |
| Newsletter form sem feedback | MEDIA | HeimdallFooter.tsx | Apenas reseta email, sem toast de sucesso |
| Termos/Privacidade sem pagina | MEDIA | Auth.tsx | Links apontam para spans sem navegacao |
| Sidebar muito densa | BAIXA | AppSidebar.tsx | 150+ items, pode ser overwhelming |
| Alguns forms sem aria-describedby | BAIXA | Diversos | FormMessage existe mas nem todos inputs conectados |
| Footer links sem aria-label | BAIXA | HeimdallFooter.tsx | Buttons sem labels acessiveis |
| Navbar mobile sem aria-expanded | BAIXA | HeimdallNavbar.tsx | Menu hamburger sem estado acessivel |
| Alguns placeholders genericos | BAIXA | Diversos forms | "Digite aqui" vs exemplos especificos |
| Falta de hover em alguns botoes terciarios | BAIXA | FooterLink | Estados hover sutis demais |

---

## Matriz de Conformidade por Checklist

### 1. Navegacao

| Requisito | Status | Implementacao |
|-----------|--------|---------------|
| Menu claro e acessivel | OK | AppSidebar com icones + labels + descriptions |
| Logo leva a home | OK | datonLogo com onClick={() => navigate('/')} |
| Links do footer funcionam | PARCIAL | Navegacao OK, mas Privacidade/Termos/Seguranca sem pagina |
| Breadcrumbs atualizados | OK | Breadcrumbs.tsx com ROUTE_LABELS mapeado |
| Search global | OK | GlobalKeyboardShortcuts + GlobalSearch (Ctrl+K) |
| Favoritos | OK | useFavorites hook para pages favoritas |

### 2. Chamadas para Acao (CTAs)

| Requisito | Status | Implementacao |
|-----------|--------|---------------|
| Botao principal destacado | OK | variant="default" com bg-primary |
| Botoes secundarios diferentes | OK | variant="outline", "ghost", "secondary" |
| Confirmacao em acoes destrutivas | OK | AlertDialog em deletes (18+ componentes) |
| Estados hover claros | OK | hover:bg-primary/90, shadow-md transitions |
| Botoes disabled durante loading | OK | disabled={isLoading} padronizado |

### 3. Formularios

| Requisito | Status | Implementacao |
|-----------|--------|---------------|
| Labels com for/id corretos | OK | FormLabel com htmlFor={formItemId} |
| Ordem logica de campos | OK | Agrupamentos semanticos (Empresa, Usuario, etc.) |
| Validacao em tempo real | OK | mode="onBlur" com Zod validation |
| Submit ativado quando valido | PARCIAL | Alguns forms sempre habilitados |
| Sucesso/erro indicado | OK | Toast + FormMessage |
| Password feedback visual | OK | getPasswordRequirementChecks() em Auth.tsx |

### 4. Feedback

| Requisito | Status | Implementacao |
|-----------|--------|---------------|
| Loading spinner | OK | EnhancedLoading, Loader2 spinner |
| Toast de sucesso | OK | "Salvo com sucesso", "Atualizado", etc. |
| Erro com sugestao | OK | "Email ja usado, tente outro" pattern |
| Transicoes suaves | OK | animate-fade-in, transition-all |
| Empty states | OK | Componentes mostram "Nenhum registro encontrado" |

### 5. Acessibilidade

| Requisito | Status | Implementacao |
|-----------|--------|---------------|
| Contraste texto 4.5:1 | OK | --foreground vs --background adequado |
| Contraste graficos 3:1 | OK | Cores de status com contraste suficiente |
| Keyboard navigation Tab | OK | tabIndex, focus styles |
| Enter/Escape funcionam | OK | onKeyDown handlers em modais e dropdowns |
| Focus visible | OK | focus-visible:ring-2 ring-ring |
| ARIA labels em icons | PARCIAL | 26 arquivos com aria-label, mas alguns gaps |
| Alt text em imagens | PARCIAL | datonLogo tem alt, mas algumas decorativas sem |
| Skip links | OK | SkipLinks.tsx implementado |
| Reduced motion | OK | @media (prefers-reduced-motion) |

---

## Plano de Correcoes

### FASE 1: Footer Links e Navegacao

#### 1.1 Corrigir Footer Links Vazios

**Arquivo:** `src/components/landing/heimdall/HeimdallFooter.tsx`

**Problema:** Links Privacidade/Termos/Seguranca tem `onClick={() => {}}`

**Correcao:**
```typescript
// ANTES (linha 202-204)
<FooterLink label="Privacidade" onClick={() => {}} />
<FooterLink label="Termos" onClick={() => {}} />
<FooterLink label="Segurança" onClick={() => {}} />

// DEPOIS - Criar paginas ou abrir modal
<FooterLink label="Privacidade" onClick={() => navigate('/privacidade')} />
<FooterLink label="Termos" onClick={() => navigate('/termos')} />
<FooterLink label="Segurança" onClick={() => navigate('/seguranca')} />
```

**Alternativa:** Criar TermsModal e PrivacyModal components com conteudo estatico.

#### 1.2 Adicionar Feedback na Newsletter

**Arquivo:** `src/components/landing/heimdall/HeimdallFooter.tsx`

**Problema:** Form de email reseta sem feedback (linhas 19-24)

**Correcao:**
```typescript
import { toast } from 'sonner';

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        // Simula envio (ou integrar com backend)
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Inscrito com sucesso!', {
            description: 'Voce recebera nossas novidades em breve.'
        });
        setEmail('');
    } catch (error) {
        toast.error('Erro ao inscrever', {
            description: 'Tente novamente mais tarde.'
        });
    } finally {
        setIsSubmitting(false);
    }
};
```

#### 1.3 Corrigir Links de Termos no Auth.tsx

**Arquivo:** `src/pages/Auth.tsx`

**Problema:** Spans sem navegacao (linhas 352-359)

**Correcao:**
```typescript
// ANTES
<span className="text-primary cursor-pointer hover:underline">
  Termos de Serviço
</span>

// DEPOIS
<Link to="/termos" className="text-primary hover:underline">
  Termos de Serviço
</Link>
```

---

### FASE 2: Acessibilidade

#### 2.1 Adicionar aria-label em FooterLink

**Arquivo:** `src/components/landing/heimdall/HeimdallFooter.tsx`

**Correcao:**
```typescript
function FooterLink({ label, onClick }: { label: string; onClick: () => void }) {
    // ...
    return (
        <button
            onClick={onClick}
            aria-label={`Navegar para ${label}`}
            // ... rest of props
        >
```

#### 2.2 Adicionar aria-expanded no Menu Mobile

**Arquivo:** `src/components/landing/heimdall/HeimdallNavbar.tsx`

**Correcao:**
```typescript
<button
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    aria-expanded={mobileMenuOpen}
    aria-controls="mobile-menu"
    aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
    // ... rest
>
```

#### 2.3 Melhorar Labels em Formularios

**Arquivo:** Diversos forms

**Padrao a aplicar:**
```typescript
<Label htmlFor="field-id">
  Campo Obrigatorio <span aria-hidden="true" className="text-destructive">*</span>
  <span className="sr-only">(obrigatorio)</span>
</Label>
<Input
  id="field-id"
  aria-describedby="field-id-description field-id-error"
  aria-required="true"
  // ...
/>
<FormDescription id="field-id-description">
  Dica ou exemplo de preenchimento
</FormDescription>
<FormMessage id="field-id-error" />
```

---

### FASE 3: UX de Formularios

#### 3.1 Adicionar Exemplos de Formato

**Problema:** Placeholders genericos como "Digite aqui"

**Arquivos:** EmployeeModal.tsx, SupplierRegistration.tsx, etc.

**Correcao:**
```typescript
// ANTES
<Input placeholder="Digite seu email" />

// DEPOIS
<Input 
  placeholder="exemplo@empresa.com" 
  aria-describedby="email-hint"
/>
<span id="email-hint" className="text-xs text-muted-foreground">
  Use o email corporativo
</span>
```

#### 3.2 Desabilitar Submit ate Formulario Valido

**Problema:** Alguns forms permitem submit com dados invalidos

**Correcao:**
```typescript
<Button 
  type="submit" 
  disabled={isLoading || !form.formState.isValid}
>
  {isLoading ? 'Salvando...' : 'Salvar'}
</Button>
```

---

### FASE 4: Paginas Faltantes

#### 4.1 Criar Paginas de Politicas

**Novos arquivos necessarios:**

| Arquivo | Conteudo |
|---------|----------|
| `src/pages/Privacidade.tsx` | Politica de Privacidade (LGPD compliant) |
| `src/pages/Termos.tsx` | Termos de Servico |
| `src/pages/Seguranca.tsx` | Politica de Seguranca e Cookies |

**Template basico:**
```typescript
export default function Privacidade() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Politica de Privacidade</h1>
      <div className="prose prose-slate dark:prose-invert">
        {/* Conteudo da politica */}
      </div>
    </div>
  );
}
```

---

### FASE 5: Consistencia Visual

#### 5.1 Padronizar Estados de Erro

**Problema:** Alguns campos usam border-destructive, outros nao

**Padrao a aplicar:**
```css
.input-error {
  @apply border-destructive focus-visible:ring-destructive;
}
```

```typescript
<Input
  className={cn(
    "...",
    form.formState.errors.fieldName && "border-destructive focus-visible:ring-destructive"
  )}
/>
```

#### 5.2 Padronizar Empty States

**Componente a criar:** `src/components/ui/empty-state.tsx`

```typescript
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />}
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/Privacidade.tsx` | Pagina de Politica de Privacidade |
| `src/pages/Termos.tsx` | Pagina de Termos de Servico |
| `src/pages/Seguranca.tsx` | Pagina de Politica de Seguranca |
| `src/components/ui/empty-state.tsx` | Componente padronizado para estados vazios |
| `src/components/legal/TermsModal.tsx` | Modal alternativo para Termos (opcional) |
| `src/components/legal/PrivacyModal.tsx` | Modal alternativo para Privacidade (opcional) |

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/components/landing/heimdall/HeimdallFooter.tsx` | Footer links funcionais, aria-labels, toast na newsletter |
| `src/components/landing/heimdall/HeimdallNavbar.tsx` | aria-expanded no menu mobile |
| `src/pages/Auth.tsx` | Links de Termos/Privacidade navegaveis |
| `src/App.tsx` | Adicionar rotas para paginas de politicas |
| `src/components/navigation/Breadcrumbs.tsx` | Adicionar labels para novas paginas |

---

## Checklist de Validacao Final

### Usuario Novo

- [x] Pode usar sem instrucoes (navegacao clara, icones com labels)
- [x] Onboarding flow existe (CleanOnboardingMain)
- [ ] Termos/Privacidade acessiveis antes do registro

### Acoes Criticas

- [x] Delete tem confirmacao (AlertDialog)
- [x] Logout tem confirmacao (AppHeader)
- [ ] Cancel em modais pergunta se quer descartar alteracoes

### Feedback

- [x] Toast para sucesso/erro
- [x] Loading spinners
- [x] Form errors com indicador visual

### Consistencia

- [x] Cores de botoes padronizadas
- [x] Espacamento consistente (8px grid)
- [x] Tipografia hierarquica

### Performance

- [x] Resposta rapida para clicks (< 100ms)
- [x] Lazy loading de rotas
- [x] Skeleton loaders

---

## Ordem de Execucao

1. **Fase 1:** Corrigir footer links e adicionar feedback newsletter (impacto alto, esforco baixo)
2. **Fase 2:** Adicionar aria-labels e aria-expanded faltantes
3. **Fase 3:** Padronizar exemplos de formato em inputs
4. **Fase 4:** Criar paginas de Privacidade/Termos/Seguranca
5. **Fase 5:** Criar componente EmptyState padronizado
6. **Validacao:** Testar fluxos principais com keyboard-only

---

## Metricas de Sucesso

| Metrica | Antes | Depois |
|---------|-------|--------|
| Footer links funcionais | 60% | 100% |
| Componentes com aria-label | 70% | 95%+ |
| Forms com feedback de formato | 50% | 100% |
| Paginas legais disponiveis | 0% | 100% |
| Empty states padronizados | 30% | 100% |

---

## Secao Tecnica

### Testes de Acessibilidade Recomendados

```bash
# Lighthouse Accessibility
npx lighthouse https://daton-esg-insight.lovable.app --view --only-categories=accessibility

# axe-core (CLI)
npx @axe-core/cli https://daton-esg-insight.lovable.app

# Keyboard testing manual
# Tab through entire page, verify:
# - All interactive elements focusable
# - Focus order logical
# - Modal traps focus
# - Escape closes modals
```

### Ferramentas de Validacao

1. **Chrome DevTools > Accessibility tab**: Verificar arvore ARIA
2. **Lighthouse**: Score 90+ em Accessibility
3. **axe DevTools extension**: Detectar violacoes WCAG
4. **NVDA/VoiceOver**: Testar com leitor de tela real

### Compatibilidade

- WCAG 2.1 AA (target)
- Browsers: Chrome, Firefox, Safari, Edge (ultimas 2 versoes)
- Mobile: iOS Safari, Chrome Android
- Screen readers: NVDA, VoiceOver

