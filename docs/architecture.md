# Arquitetura do Sistema - Daton ESG Insight

## Visão Geral

```
+-------------+     +----------------+     +------------------+
|   Browser   | --> |  React SPA     | --> |  Supabase        |
|   (Client)  |     |  (Vite/TS)     |     |  (PostgreSQL)    |
+-------------+     +----------------+     +------------------+
                           |                       |
                           v                       v
                    +----------------+     +------------------+
                    |  TanStack      |     |  Edge Functions  |
                    |  Query Cache   |     |  (Deno/TS)       |
                    +----------------+     +------------------+
```

---

## Camadas da Aplicação

### 1. Apresentação (Frontend)

```
src/pages/         # Páginas (routes)
src/components/    # Componentes UI
src/contexts/      # Estado global (React Context)
```

- React 18 com Suspense e Lazy Loading
- Tailwind CSS para estilização
- shadcn/ui para componentes base

### 2. Lógica de Negócios

```
src/hooks/         # Custom hooks (dados + lógica)
src/services/      # Camada de serviços (API calls)
src/utils/         # Funções utilitárias
```

- TanStack Query para cache e sincronização
- React Hook Form para formulários
- Zod para validação de schemas

### 3. Persistência (Backend)

```
supabase/functions/   # Edge Functions
Supabase Database     # PostgreSQL com RLS
Supabase Storage      # Arquivos e documentos
```

---

## Fluxo de Autenticação

```
+--------+    +----------+    +----------+    +----------+
| Login  | -> | Supabase | -> | Session  | -> | Protected|
| Page   |    | Auth     |    | Storage  |    | Routes   |
+--------+    +----------+    +----------+    +----------+
                   |
                   v
            +----------+
            | profiles |
            | table    |
            +----------+
```

### Passos:

1. Usuário submete credenciais em `/auth`
2. Supabase Auth valida e retorna JWT
3. JWT armazenado em localStorage
4. AuthContext gerencia estado global
5. ProtectedRoute verifica sessão

---

## Fluxo de Dados

```
+-----------+     +-------------+     +-----------+
| Component | --> | useQuery    | --> | Service   |
|           |     | (TanStack)  |     | Function  |
+-----------+     +-------------+     +-----------+
                        |                   |
                        v                   v
                  +----------+       +-----------+
                  | Cache    |       | Supabase  |
                  | (5 min)  |       | Client    |
                  +----------+       +-----------+
```

---

## Módulos Principais

### ESG Ambiental
- Inventário GEE (Escopos 1, 2, 3)
- Gestão de Licenças
- Monitoramento (Água, Energia, Resíduos)
- Biodiversidade

### ESG Social
- Gestão de Funcionários
- Treinamentos (LMS)
- Segurança do Trabalho
- Saúde Ocupacional

### Qualidade (SGQ)
- Não Conformidades
- Ações Corretivas (CAPA)
- Controle de Documentos
- Auditorias

### Fornecedores
- Cadastro e Avaliação
- Portal do Fornecedor
- Monitoramento de Riscos
- Gestão de Contratos

---

## Edge Functions (60+)

### Categorias:

| Categoria | Exemplos |
|-----------|----------|
| AI/ML | `ai-chat-assistant`, `ai-insights-engine` |
| Documentos | `universal-document-processor`, `document-ai-processor` |
| ESG | `esg-dashboard`, `ghg-recalculate` |
| Qualidade | `compliance-management`, `audit-management` |
| Fornecedores | `supplier-auth`, `supplier-notifications` |

---

## Decisões de Arquitetura (ADR)

### ADR-001: Supabase como Backend

- **Decisão:** Usar Supabase em vez de backend custom
- **Motivo:** Time-to-market, custos, escalabilidade
- **Consequências:** Depende de RLS para segurança

### ADR-002: TanStack Query para Cache

- **Decisão:** Usar TanStack Query v5
- **Motivo:** Cache automático, revalidação, devtools
- **Consequências:** Complexidade em mutations

### ADR-003: Edge Functions para Lógica Complexa

- **Decisão:** Deno Edge Functions para IA/processamento
- **Motivo:** Timeout maior, acesso a APIs externas
- **Consequências:** Deploy separado, cold starts

### ADR-004: Lazy Loading de Rotas

- **Decisão:** Code splitting por rota
- **Motivo:** Bundle inicial menor (~200KB)
- **Consequências:** Loading states necessários

### ADR-005: Design System Centralizado

- **Decisão:** Tokens de design em CSS variables + Tailwind
- **Motivo:** Consistência visual, manutenção facilitada
- **Consequências:** Usar apenas tokens semânticos

---

## Segurança

### Row Level Security (RLS)

- Todas tabelas têm policies
- `company_id` usado para isolamento
- Roles: `admin`, `manager`, `user`, `viewer`

### Validação de Entrada

- Zod schemas no frontend
- Validação em Edge Functions
- Sanitização HTML (DOMPurify)

### Rate Limiting

- 100 req/min por IP
- Rate limiter em `utils/securityUtils.ts`

---

## Monitoramento

| Componente | Arquivo |
|------------|---------|
| Performance | `src/utils/performanceMonitor.ts` |
| Logs | `src/utils/logger.ts` |
| Health | `src/utils/healthCheck.ts` |
| Dashboard | `/production-monitoring` |

---

## Diagrama de Componentes

```
                    +------------------+
                    |   App.tsx        |
                    +------------------+
                           |
          +----------------+----------------+
          |                |                |
    +----------+    +----------+    +----------+
    | Auth     |    | Company  |    | Theme    |
    | Provider |    | Provider |    | Provider |
    +----------+    +----------+    +----------+
          |
    +----------+
    | Router   |
    +----------+
          |
    +------------------+
    | Lazy Routes      |
    | (130+ páginas)   |
    +------------------+
```

---

## Estrutura de Banco de Dados

### Tabelas Principais

```
companies ─────┬───> profiles
               ├───> employees
               ├───> emission_sources ───> activity_data
               ├───> goals
               ├───> non_conformities ───> corrective_actions
               ├───> suppliers
               ├───> licenses
               ├───> documents
               └───> audits
```

### Relacionamentos

- Todos os dados são isolados por `company_id`
- Usuários pertencem a uma empresa via `profiles.company_id`
- RLS garante isolamento entre empresas

---

## Performance

### Otimizações Implementadas

1. **Code Splitting:** Lazy loading por rota
2. **Virtualização:** React Window para listas grandes
3. **Cache:** TanStack Query com staleTime de 5 min
4. **Imagens:** Lazy loading com Intersection Observer
5. **Bundle:** Vite com tree-shaking otimizado

### Métricas Target

| Métrica | Target |
|---------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Bundle | < 500KB (gzip) |

---

## Recursos Adicionais

- [Guia de Desenvolvimento](./development.md)
- [Guia de Operações](./operations.md)
- [Documentação de API](./api.md)
- [Guia de Performance](../PERFORMANCE.md)
