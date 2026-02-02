
# Plano de Auditoria e Revisao de Conteudo

## Resumo Executivo

Esta auditoria abrangente cobre todos os textos da aplicacao Daton ESG Insight, identificando problemas de ortografia, consistencia terminologica, placeholders, mensagens do sistema, help text e onboarding. O plano apresenta um glossario de termos padronizados e implementa correcoes sistematicas.

---

## Diagnostico do Estado Atual

### Pontos Fortes Identificados

| Categoria | Status | Detalhes |
|-----------|--------|----------|
| Conteudo Legal | OK | Paginas Termos, Privacidade e Seguranca com conteudo real e completo |
| Toasts Padronizados | OK | Sistema unificado em `unifiedToast.ts` com success/error/warning/info |
| Password Feedback | OK | `PasswordRequirements.tsx` com validacao em tempo real |
| FormMessage em Forms | OK | Mensagens de erro via react-hook-form em 180+ arquivos |
| Tooltips em Graficos | OK | 100+ arquivos com tooltips em Recharts |
| FormDescription | OK | Presente em 16+ formularios complexos |
| Empty States | OK | "Nenhum resultado encontrado" padronizado |
| Loading States | OK | "Carregando..." e spinners consistentes |

### Problemas Identificados

| Problema | Severidade | Quantidade | Impacto |
|----------|------------|------------|---------|
| TODOs/FIXMEs no codigo | MEDIA | 13 arquivos | Funcionalidades incompletas |
| Inconsistencia Excluir/Deletar/Remover | BAIXA | 166 arquivos | UX inconsistente |
| Dashboard vs Painel | BAIXA | 275 arquivos | Terminologia mista |
| Placeholders genericos | BAIXA | 101 arquivos | Falta de orientacao |
| Falta de help text | MEDIA | Diversos | Campos sem dicas |
| Comentario placeholder em edge function | MEDIA | `esg-dashboard` | Scoring incompleto |

---

## Tarefa 1: Ortografia e Gramatica

### Analise Realizada

A analise nao encontrou erros significativos de ortografia ou gramatica nos textos principais. O conteudo esta bem escrito em portugues brasileiro.

**Pontos Verificados:**
- Paginas legais (Termos, Privacidade, Seguranca): Corretas
- Mensagens de toast: Corretas
- Labels de formularios: Corretos
- Descricoes de componentes: Corretas

**Nenhuma correcao ortografica necessaria.**

---

## Tarefa 2: Glossario de Terminologia

### Glossario Padronizado

| Termo Padrao | Variantes a Evitar | Uso |
|--------------|-------------------|-----|
| Excluir | Deletar, Remover, Apagar | Acoes destrutivas permanentes |
| Remover | - | Desvincular (nao permanente) |
| Salvar | Guardar, Armazenar | Persistir dados |
| Dashboard | Painel | Manter "Dashboard" por ser termo tecnico ESG |
| Usuario | usuario (sem acento) | Sempre com acento |
| Email | E-mail | Sem hifen (padrao atual) |
| Carregando | Loading | Preferir portugues |
| Cancelar | Voltar (em modais) | Para fechar sem salvar |
| Confirmar | OK, Sim | Para acoes afirmativas |
| Sucesso | OK | Em mensagens de confirmacao |
| Erro | Falha | Em mensagens de erro |

### Arquivos Principais para Padronizar

A terminologia esta majoritariamente consistente. Principais areas:

1. **"Excluir" vs "Remover"**: 166 arquivos usam ambos
   - Recomendacao: "Excluir" para delecao permanente, "Remover" para desvincular

2. **"Dashboard" vs "Painel"**: 275 arquivos
   - Recomendacao: Manter "Dashboard" (termo tecnico aceito em ESG)

3. **"Usuario" com acento**: Verificado e correto (98 arquivos)

---

## Tarefa 3: Placeholders e TODOs

### TODOs Identificados (13 arquivos)

| Arquivo | Linha | Conteudo |
|---------|-------|----------|
| `src/utils/logger.ts` | 219 | TODO: Integrate with Sentry |
| `src/components/AttendanceReportsModal.tsx` | 108 | TODO: Implementar exportacao real |
| `src/components/GRIIndicatorFormModal.tsx` | 104 | TODO: Implement API call |
| `src/pages/OuvidoriaClientes.tsx` | 22 | TODO: Implementar hook useOmbudsman |
| `src/components/ErrorBoundary.tsx` | 39 | TODO: Send to Sentry |
| `src/components/financial/BalanceteVerificacao.tsx` | 26 | TODO: Implementar getBalancete |
| `src/components/financial/AccountStatement.tsx` | 35 | TODO: Implementar getAccountStatement |
| `src/components/intelligence/FeedbackCollector.tsx` | 80 | TODO: Uncomment when table created |
| `src/hooks/useTourAnalytics.ts` | 46 | TODO: Implementar envio |
| `src/utils/performanceMonitor.ts` | 91 | TODO: Send to monitoring |
| `src/components/ActivityMonitoringModal.tsx` | 81 | TODO: Upload files |
| `src/components/EmployeeScheduleAssignmentModal.tsx` | 40 | TODO: Implementar API |
| `src/components/RootCauseAnalysisModal.tsx` | 155 | TODO: Integrar com API |

### Placeholders em Edge Functions

| Arquivo | Problema |
|---------|----------|
| `supabase/functions/esg-dashboard/index.ts` | Linhas 429-433: "placeholder scoring" comments |

### Acoes

1. **Criar arquivo de documentacao de TODOs**

```typescript
// src/utils/todoRegistry.ts
/**
 * Registro de funcionalidades pendentes de implementacao
 * 
 * ## Integracao Futura
 * - logger.ts: Integracao com Sentry para error reporting
 * - performanceMonitor.ts: Envio de metricas para servico de monitoramento
 * - ErrorBoundary.tsx: Captura de erros em producao
 * 
 * ## APIs Pendentes
 * - BalanceteVerificacao: getBalancete service
 * - AccountStatement: getAccountStatement service
 * - OuvidoriaClientes: useOmbudsman hook
 * - EmployeeScheduleAssignment: API de atribuicao de escala
 * - RootCauseAnalysis: API de salvar analise
 * 
 * ## Melhorias de UX
 * - AttendanceReports: Exportacao real de relatorios
 * - ActivityMonitoring: Upload de evidencias
 * 
 * ## Analytics
 * - useTourAnalytics: Envio para backend
 * - FeedbackCollector: Tabela ai_feedback_logs
 */
export const PENDING_FEATURES = {
  SENTRY_INTEGRATION: 'logger.ts, ErrorBoundary.tsx',
  FINANCIAL_APIS: 'BalanceteVerificacao, AccountStatement',
  TOUR_ANALYTICS: 'useTourAnalytics.ts',
};
```

2. **Corrigir placeholder scoring em esg-dashboard**

```typescript
// Substituir linhas 429-433 em esg-dashboard/index.ts
// DE:
// Policy compliance (30 points max) - placeholder scoring
governanceScore += 25 // 95% compliance gets 25/30 points

// Board diversity (20 points max) - placeholder scoring  
governanceScore += 12 // 40% diversity gets 12/20 points

// PARA:
// Policy compliance (30 points max) - baseado em dados reais quando disponiveis
const policyComplianceScore = Math.min(30, Math.round((complianceRate / 100) * 30));
governanceScore += policyComplianceScore;

// Board diversity (20 points max) - requer dados de diversidade
// Por enquanto, usa score neutro ate implementacao de metricas de diversidade
governanceScore += 10; // Score base ate implementacao de metricas
```

---

## Tarefa 4: Mensagens do Sistema

### Padrao de Mensagens Implementado

O sistema ja possui um padrao bem definido em `src/utils/unifiedToast.ts`:

| Tipo | Duracao | Formato Recomendado |
|------|---------|---------------------|
| Success | 4000ms | "[Acao] realizado(a) com sucesso!" |
| Error | 6000ms | "Erro ao [acao]. [Sugestao]." |
| Warning | 5000ms | "Atencao: [situacao]. [Acao recomendada]." |
| Info | 4000ms | "[Informacao contextual]." |
| Loading | Promise | "[Acao]..." |

### Melhorias Propostas

1. **Criar constantes de mensagens padronizadas**

```typescript
// src/constants/messages.ts
export const MESSAGES = {
  // Sucesso
  SAVE_SUCCESS: 'Dados salvos com sucesso!',
  CREATE_SUCCESS: (item: string) => `${item} criado(a) com sucesso!`,
  UPDATE_SUCCESS: (item: string) => `${item} atualizado(a) com sucesso!`,
  DELETE_SUCCESS: (item: string) => `${item} excluido(a) com sucesso!`,
  
  // Erro
  SAVE_ERROR: 'Erro ao salvar. Tente novamente.',
  CREATE_ERROR: (item: string) => `Erro ao criar ${item}. Verifique os dados e tente novamente.`,
  UPDATE_ERROR: (item: string) => `Erro ao atualizar ${item}. Tente novamente.`,
  DELETE_ERROR: (item: string) => `Erro ao excluir ${item}. Tente novamente.`,
  LOAD_ERROR: 'Erro ao carregar dados. Atualize a pagina.',
  NETWORK_ERROR: 'Erro de conexao. Verifique sua internet.',
  
  // Confirmacao
  DELETE_CONFIRM: (item: string) => `Tem certeza que deseja excluir este(a) ${item}? Esta acao nao pode ser desfeita.`,
  UNSAVED_CHANGES: 'Voce tem alteracoes nao salvas. Deseja sair mesmo assim?',
  
  // Vazio
  NO_RESULTS: 'Nenhum resultado encontrado.',
  NO_DATA: (item: string) => `Nenhum(a) ${item} cadastrado(a).`,
  
  // Loading
  LOADING: 'Carregando...',
  SAVING: 'Salvando...',
  PROCESSING: 'Processando...',
  
  // Validacao
  REQUIRED_FIELD: 'Campo obrigatorio',
  INVALID_EMAIL: 'Email invalido',
  INVALID_CNPJ: 'CNPJ invalido. Digite 14 digitos.',
  PASSWORD_MISMATCH: 'As senhas nao coincidem',
};
```

---

## Tarefa 5: Help Text

### Campos que Necessitam Help Text

| Campo | Arquivo | Help Text Sugerido |
|-------|---------|-------------------|
| CNPJ | Auth.tsx | "Apenas numeros, 14 digitos" |
| Email | Auth.tsx | "Use seu email corporativo" |
| Senha | Auth.tsx | "Min 8 caracteres, 1 maiuscula, 1 numero, 1 especial" (ja implementado) |
| CEP | BranchFormModal.tsx | "Digite o CEP para preenchimento automatico" |
| Fator de Emissao | EmissionFactorModal | "Valor em kgCO2e por unidade de atividade" |
| Data de Vencimento | LicenseModal | "Data limite para renovacao da licenca" |

### Implementacao de Help Text Padronizado

O sistema ja usa `FormDescription` para help text. Criar componente auxiliar:

```typescript
// src/components/ui/form-hint.tsx
import { cn } from '@/lib/utils';

interface FormHintProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function FormHint({ id, children, className }: FormHintProps) {
  return (
    <small 
      id={id}
      className={cn("text-xs text-muted-foreground mt-1", className)}
    >
      {children}
    </small>
  );
}

// Uso:
<Input aria-describedby="cnpj-hint" />
<FormHint id="cnpj-hint">Apenas numeros, 14 digitos</FormHint>
```

---

## Tarefa 6: Onboarding

### Estado Atual

O sistema possui onboarding robusto:
- `CleanOnboardingMain.tsx`: Fluxo principal de onboarding
- `EnhancedDataCreationStep.tsx`: Criacao de dados iniciais
- `UnifiedTourSystem.tsx`: Tour guiado
- `SmartContentGenerator.tsx`: Geracao de conteudo inteligente

### Melhorias Propostas

1. **Link de ajuda em cada pagina**

Adicionar ao layout principal um link contextual de ajuda:

```typescript
// src/components/ContextualHelp.tsx
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocation } from 'react-router-dom';

const HELP_LINKS: Record<string, string> = {
  '/dashboard': '/documentacao#dashboard',
  '/inventario-gee': '/documentacao#inventario',
  '/gestao-licencas': '/documentacao#licencas',
  '/nao-conformidades': '/documentacao#qualidade',
  // ... mapear todas as rotas
};

export function ContextualHelp() {
  const location = useLocation();
  const helpLink = HELP_LINKS[location.pathname] || '/documentacao';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(helpLink, '_blank')}
            aria-label="Ajuda"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Acessar documentacao</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/constants/messages.ts` | Mensagens padronizadas do sistema |
| `src/components/ui/form-hint.tsx` | Componente de help text |
| `src/components/ContextualHelp.tsx` | Link de ajuda contextual |
| `src/utils/todoRegistry.ts` | Documentacao de funcionalidades pendentes |

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `supabase/functions/esg-dashboard/index.ts` | Remover comentarios placeholder |
| `src/pages/Auth.tsx` | Adicionar help text em CNPJ |
| `src/components/MainLayout.tsx` | Adicionar ContextualHelp no header |

---

## Checklist de Validacao

### Ortografia e Gramatica
- [x] Verificado - Nenhum erro encontrado

### Consistencia Terminologica
- [x] Glossario definido
- [ ] Padronizar uso de Excluir/Remover
- [ ] Manter Dashboard como termo padrao

### Placeholders
- [x] Zero Lorem Ipsum encontrado
- [ ] Documentar TODOs existentes
- [ ] Remover placeholder scoring de edge function

### Mensagens do Sistema
- [x] Toast system padronizado
- [ ] Criar constantes de mensagens

### Help Text
- [x] FormDescription em formularios complexos
- [ ] Adicionar FormHint em campos criticos

### Onboarding
- [x] Sistema de tour implementado
- [ ] Adicionar link de ajuda contextual

---

## Ordem de Execucao

1. **Fase 1:** Criar constantes de mensagens (`messages.ts`)
2. **Fase 2:** Criar componente FormHint e aplicar em Auth.tsx
3. **Fase 3:** Criar ContextualHelp e adicionar ao layout
4. **Fase 4:** Documentar TODOs em todoRegistry.ts
5. **Fase 5:** Corrigir placeholder scoring em esg-dashboard
6. **Validacao:** Revisar todos os textos da interface

---

## Metricas de Sucesso

| Metrica | Antes | Depois |
|---------|-------|--------|
| Erros ortograficos | 0 | 0 |
| TODOs documentados | 0% | 100% |
| Mensagens padronizadas | Parcial | 100% |
| Campos com help text | 50% | 90% |
| Paginas com link de ajuda | 0% | 100% |

---

## Secao Tecnica

### Validacao de Conteudo

```bash
# Buscar Lorem Ipsum
grep -r "Lorem ipsum" src --include="*.tsx"
# Resultado: 0 matches

# Buscar TODOs
grep -rn "// TODO\|// FIXME" src --include="*.tsx" --include="*.ts"
# Resultado: 13 matches

# Verificar placeholders genericos
grep -r "Inserir aqui\|EXAMPLE\|SAMPLE" src --include="*.tsx"
# Resultado: 0 placeholders problematicos
```

### Ferramentas de Revisao

1. **LanguageTool**: Verificacao gramatical em portugues
2. **Hunspell pt-BR**: Verificacao ortografica
3. **ESLint**: Verificacao de comentarios TODO/FIXME

### Scripts de Auditoria

```bash
# Contar termos inconsistentes
grep -rc "Excluir\|Deletar\|Remover" src/components | sort -t: -k2 -rn | head -10

# Verificar toasts nao padronizados
grep -rn "toast\." src --include="*.tsx" | grep -v "toast\.success\|toast\.error\|toast\.warning\|toast\.info"
```
