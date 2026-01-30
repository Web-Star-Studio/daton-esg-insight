
# Plano de Validacao Funcional - Modulos do Painel de Usuario

## Resumo Executivo

Com base na analise detalhada do codebase, irei validar sistematicamente os modulos **ESG > SOCIAL**, **QUALIDADE** e **FORNECEDORES** conforme a diretiva do CTO.

---

## Estrutura dos Modulos Identificados

### 1. ESG > SOCIAL (`/social-esg`)

**Componente Principal:** `src/pages/SocialESG.tsx`

**Sub-funcionalidades:**
- **Visao Geral:** Metricas de funcionarios, seguranca, treinamentos
- **Impacto Social:** Projetos sociais (CRUD completo)
- **Navegacao para modulos:** Gestao Funcionarios, Seguranca do Trabalho, Treinamentos

**Servicos:**
- `src/services/socialProjects.ts` - CRUD de projetos sociais
- `src/services/employees.ts` - Gestao de funcionarios
- `src/services/safetyIncidents.ts` - Metricas de seguranca
- `src/services/trainingPrograms.ts` - Programas de treinamento
- `src/services/socialDashboard.ts` - Filtros e metricas

**Modais/Forms:**
- `SocialProjectModal.tsx` - Criacao/edicao de projetos sociais
- `QuickActionModal.tsx` - Acoes rapidas

---

### 2. QUALIDADE (`/qualidade-dashboard`, `/nao-conformidades`)

**Componentes Principais:**
- `src/pages/QualityDashboard.tsx` > `UnifiedQualityDashboard.tsx`
- `src/pages/NaoConformidades.tsx`

**Sub-funcionalidades:**
- **Dashboard SGQ:** Metricas de qualidade, NCs, planos de acao
- **Nao Conformidades:** CRUD completo com workflow de aprovacao
- **Planos de Acao 5W2H:** Gerenciamento de acoes corretivas
- **Insights IA:** Analises preditivas
- **Gestao de Indicadores:** KPIs de qualidade

**Servicos:**
- `src/services/unifiedQualityService.ts`
- Supabase table: `non_conformities`

---

### 3. FORNECEDORES (`/gestao-fornecedores`, `/fornecedores`)

**Componentes Principais:**
- `src/pages/SupplierManagementDashboard.tsx`
- `src/pages/Fornecedores.tsx`
- `src/pages/SupplierRegistration.tsx`

**Sub-funcionalidades:**
- **Dashboard:** Estatisticas de fornecedores
- **Cadastro:** CRUD de fornecedores (PF/PJ)
- **Documentacao Obrigatoria:** Gestao de documentos
- **Tipos de Fornecedor:** Categorias
- **Conexoes:** Logistica reversa
- **Avaliacoes:** Avaliacao de fornecedores

**Servicos:**
- `src/services/supplierManagementService.ts`
- Supabase table: `supplier_management`

---

## Metodologia de Validacao

Para cada funcionalidade, validarei:

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CHECKLIST POR FUNCIONALIDADE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. HAPPY PATH                                                   │
│     [ ] Fluxo normal funciona sem erros                         │
│     [ ] Dados sao carregados corretamente                       │
│     [ ] Operacoes CRUD completam com sucesso                    │
│                                                                  │
│  2. VALIDACAO DE INPUTS                                          │
│     [ ] Campos obrigatorios sao verificados                     │
│     [ ] Formatos invalidos sao rejeitados (email, CPF, CNPJ)    │
│     [ ] Limites de caracteres sao aplicados                     │
│     [ ] Ranges numericos sao validados                          │
│                                                                  │
│  3. ERROR HANDLING                                               │
│     [ ] Mensagens de erro sao claras e em portugues             │
│     [ ] Erros de rede sao tratados graciosamente                │
│     [ ] Erros de autenticacao redirecionam para login           │
│                                                                  │
│  4. FEEDBACK VISUAL                                              │
│     [ ] Loading spinners durante requisicoes                    │
│     [ ] Toast notifications para sucesso/erro                   │
│     [ ] Botoes desabilitados durante operacoes                  │
│     [ ] Estados vazios bem comunicados                          │
│                                                                  │
│  5. PERSISTENCIA                                                 │
│     [ ] Dados salvos aparecem apos reload                       │
│     [ ] Alteracoes refletem imediatamente na UI                 │
│                                                                  │
│  6. PERMISSOES (RLS)                                             │
│     [ ] Usuario so ve dados da propria empresa                  │
│     [ ] RLS policies estao ativas e funcionando                 │
│                                                                  │
│  7. EDICAO/DELECAO                                               │
│     [ ] Edicao reflete imediatamente                            │
│     [ ] Delecao tem confirmacao                                 │
│     [ ] Cascade de dados relacionados funciona                  │
│                                                                  │
│  8. NAVEGACAO                                                    │
│     [ ] Deep linking funciona                                   │
│     [ ] Back button funciona corretamente                       │
│     [ ] URLs sao compartilhaveis                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Validacao ESG > SOCIAL

### 1.1 Projetos Sociais (SocialProjectModal)

**Validacoes a Realizar:**

| Aspecto | Teste | Validacao |
|---------|-------|-----------|
| Happy Path | Criar projeto com dados validos | Nome, data inicio, valor investido |
| Validacao | Nome < 3 caracteres | Erro Zod esperado |
| Validacao | Valor investido negativo | Rejeitar |
| Feedback | isSubmitting + Loader2 | Botao desabilitado durante submit |
| Persistencia | Reload apos criar | Projeto aparece na lista |
| Edicao | Alterar status | Refletir imediatamente |
| Delecao | Excluir projeto | Confirmacao? Cascade? |

**Codigo Relevante (SocialProjectModal.tsx:17-31):**
```typescript
const projectSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  budget: z.number().min(0, "Orçamento deve ser positivo").optional(),
  invested_amount: z.number().min(0, "Valor investido deve ser positivo"),
  // ...
});
```

**RLS Policy Verificada:**
```sql
Users can manage their company social projects
qual: (company_id = get_user_company_id())
```

### 1.2 Gestao de Funcionarios

**Validacoes a Realizar:**

| Aspecto | Teste |
|---------|-------|
| Happy Path | Listar funcionarios da empresa |
| Paginacao | Navegar entre paginas |
| Busca | Filtrar por nome/CPF |
| CRUD | Criar, editar, excluir funcionario |
| Validacao CPF | CPF invalido rejeitado |
| Cascade | Deletar com trainings/benefits relacionados |

**Codigo Relevante (employees.ts:221-262):**
- Implementa cascade manual para tabelas relacionadas

---

## Fase 2: Validacao QUALIDADE

### 2.1 Dashboard de Qualidade

**Validacoes a Realizar:**

| Aspecto | Teste |
|---------|-------|
| Happy Path | Dashboard carrega metricas |
| Loading | Skeleton durante fetch |
| Error | Mensagem clara + botao retry |
| Navegacao | Cards clicaveis levam para detalhe |
| Tabs | Todas as 8 tabs funcionam |

**Codigo Relevante (UnifiedQualityDashboard.tsx:59-77):**
```typescript
if (error) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h3>Erro ao carregar dashboard</h3>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </CardContent>
    </Card>
  );
}
```

### 2.2 Nao Conformidades

**Validacoes a Realizar:**

| Aspecto | Teste |
|---------|-------|
| Happy Path | Criar NC com dados validos |
| Validacao | Titulo < 5 chars, descricao < 10 chars |
| Feedback | Toast success/error, Loader2 |
| Workflow | Status transitions (Aberta -> Em Tratamento -> Encerrada) |
| Delete | Confirmacao AlertDialog |
| Prefetch | Hover prefetch de detalhes |

**Codigo Relevante (NaoConformidades.tsx:247-270):**
```typescript
const handleCreateNC = () => {
  if (!newNCData.title.trim()) {
    toast.error("Por favor, preencha o título");
    return;
  }
  if (newNCData.title.trim().length < 5) {
    toast.error("O título deve ter pelo menos 5 caracteres");
    return;
  }
  // ...
};
```

---

## Fase 3: Validacao FORNECEDORES

### 3.1 Dashboard de Gestao

**Validacoes a Realizar:**

| Aspecto | Teste |
|---------|-------|
| Happy Path | Stats carregam corretamente |
| Loading | LoadingState component |
| Error | Retry funcional |
| Quick Actions | Navegacao para sub-paginas |

### 3.2 Cadastro de Fornecedores

**Validacoes a Realizar:**

| Aspecto | Teste |
|---------|-------|
| Happy Path | Criar fornecedor PJ/PF |
| Validacao | CNPJ/CPF invalido rejeitado |
| Busca | Filtro por nome/categoria |
| CRUD | Criar, editar, excluir |
| Confirmacao | confirm() antes de deletar |

**Codigo Relevante (Fornecedores.tsx:52-76):**
```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;
  // ...
};
```

---

## Problemas Conhecidos Identificados

### Severidade ALTA

1. **Security Definer View** - Linter detectou view com SECURITY DEFINER que pode ignorar RLS
2. **Function Search Path Mutable** - 14 funcoes sem `search_path` definido (risco de hijacking)

### Severidade MEDIA

3. **console.log em producao** - `UnifiedQualityDashboard.tsx:45-49` ainda tem logs
4. **any types** - `Fornecedores.tsx:21` usa `any[]` para suppliers

### Severidade BAIXA

5. **Confirmacao nativa** - `Fornecedores.tsx:53` usa `confirm()` nativo em vez de AlertDialog

---

## Checklist Tecnico Transversal

| Check | Status | Notas |
|-------|--------|-------|
| Inputs validam client-side | PARCIAL | Zod em forms, mas nem todos |
| Mensagens de validacao claras | SIM | Em portugues |
| API responses tratadas | SIM | formErrorHandler implementado |
| Dados sincronizam | SIM | React Query invalidation |
| Historico navegacao | SIM | React Router com PageTransition |
| Deep linking | SIM | Rotas configuradas |
| Console errors | VERIFICAR | Testar em browser |
| Toast notifications | SIM | Sonner + useToast |
| Loading spinners | SIM | Loader2 padronizado |
| Botoes desabilitados | SIM | `disabled={isPending}` |
| Formatos consistentes | VERIFICAR | Datas ISO 8601? |

---

## Plano de Execucao

### Ordem de Validacao

1. **ESG > SOCIAL** (30min)
   - Abrir `/social-esg`
   - Testar criacao de projeto social
   - Testar edicao e delecao
   - Verificar filtros de dashboard
   - Navegar para sub-modulos

2. **QUALIDADE** (45min)
   - Abrir `/qualidade-dashboard`
   - Testar todas as 8 tabs
   - Criar NC via dialog
   - Testar workflow de status
   - Verificar insights IA

3. **FORNECEDORES** (30min)
   - Abrir `/gestao-fornecedores`
   - Verificar estatisticas
   - Criar fornecedor PJ
   - Criar fornecedor PF
   - Testar busca e filtros
   - Testar delecao

### Ferramentas de Teste

- **Browser Tool** - Para interacao real com a UI
- **Console Logs** - Para detectar erros JS
- **Network Requests** - Para verificar chamadas API
- **Supabase Queries** - Para validar persistencia

---

## Entrega Esperada

1. **Relatorio de Validacao** - Checklist preenchido por funcionalidade
2. **Screenshots** - Captura de cada fluxo testado
3. **Lista de Bugs** - Com severidade e steps to reproduce
4. **Recomendacoes** - Melhorias identificadas durante validacao

---

## Proximos Passos

Apos aprovacao deste plano, executarei a validacao usando o browser tool para:
1. Navegar pelas paginas reais
2. Interagir com formularios
3. Capturar screenshots
4. Documentar bugs encontrados
5. Gerar relatorio final
