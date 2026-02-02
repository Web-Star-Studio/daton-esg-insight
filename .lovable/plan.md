

# Plano de Criacao de Documentacao Tecnica Completa

## Resumo Executivo

Este plano detalha a criacao de documentacao tecnica abrangente para o sistema Daton ESG Insight, cobrindo README principal, documentacao de API, arquitetura, guia de desenvolvimento e operacoes.

---

## Analise do Estado Atual

### Documentacao Existente

| Arquivo | Status | Conteudo |
|---------|--------|----------|
| `README.md` (raiz) | BASICO | Template Lovable padrao, falta info especifica do projeto |
| `.env.example` | PARCIAL | Apenas 4 variaveis documentadas |
| `docs/EDGE_FUNCTIONS_API.md` | BOM | Documentacao de Edge Functions existente |
| `docs/PRODUCTION_SYSTEM_OVERVIEW.md` | BOM | Overview do sistema de monitoramento |
| `docs/PRODUCTION_MONITORING_GUIDE.md` | BOM | Guia de monitoramento detalhado |
| `docs/prd.md` | BOM | PRD completo do produto |
| `PERFORMANCE.md` | BOM | Guia de otimizacao de performance |
| `TESTING.md` | BOM | Guia de testes |
| `docs/architecture.md` | NAO EXISTE | Precisa ser criado |
| `docs/development.md` | NAO EXISTE | Precisa ser criado |
| `docs/operations.md` | NAO EXISTE | Precisa ser criado |

### Tech Stack Identificada

| Categoria | Tecnologia | Versao |
|-----------|------------|--------|
| Frontend | React | 18.3.1 |
| Build Tool | Vite | 5.4.19 |
| Linguagem | TypeScript | 5.8.3 |
| Styling | Tailwind CSS | 3.4.17 |
| UI Components | shadcn/ui (Radix) | Latest |
| Backend | Supabase | 2.57.4 |
| State Management | TanStack Query | 5.83.0 |
| Forms | React Hook Form + Zod | 7.61.1 / 4.1.11 |
| Charts | Recharts | 2.15.4 |
| Testing | Vitest | 3.2.4 |
| CI/CD | GitHub Actions | - |

---

## Arquivos a Criar/Atualizar

### 1. README.md (Atualizar - Raiz)

**Conteudo:**

```markdown
# Daton ESG Insight

Plataforma integrada de gestao ESG (Environmental, Social, Governance), qualidade e conformidade regulatoria.

## Tech Stack

- **Frontend:** React 18, TypeScript 5, Vite 5
- **UI:** Tailwind CSS, shadcn/ui (Radix UI)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State:** TanStack Query v5
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Testing:** Vitest + React Testing Library

## Instalacao Rapida

npm install
cp .env.example .env.local
npm run dev

## Build para Producao

npm run build
npm run preview

## Estrutura do Projeto

src/
├── components/       # Componentes React reutilizaveis (400+)
├── pages/            # Paginas/Rotas da aplicacao (130+)
├── services/         # Servicos de API e logica de negocios (170+)
├── hooks/            # Custom React hooks (90+)
├── contexts/         # Context API (Auth, Company, Compliance)
├── utils/            # Funcoes utilitarias
├── types/            # Definicoes TypeScript
├── integrations/     # Integracoes externas (Supabase)
├── constants/        # Constantes e configuracoes
└── schemas/          # Schemas de validacao Zod

supabase/
└── functions/        # Edge Functions Deno (60+)

## Scripts Disponiveis

- npm run dev - Servidor de desenvolvimento
- npm run build - Build de producao
- npm run preview - Preview do build
- npm run lint - Executar ESLint
- npm run test - Executar testes
- npm run test:ui - Interface visual de testes
- npm run test:coverage - Testes com cobertura

## Documentacao

- [Documentacao de API](./docs/api.md)
- [Arquitetura do Sistema](./docs/architecture.md)
- [Guia de Desenvolvimento](./docs/development.md)
- [Guia de Operacoes](./docs/operations.md)
- [Guia de Performance](./PERFORMANCE.md)
- [Guia de Testes](./TESTING.md)
- [PRD do Produto](./docs/prd.md)

## Modulos Principais

| Modulo | Descricao |
|--------|-----------|
| ESG Social | Gestao de funcionarios, treinamentos, seguranca |
| ESG Ambiental | Inventario GEE, licencas, agua, energia, residuos |
| Qualidade (SGQ) | Nao conformidades, acoes corretivas, documentos |
| Fornecedores | Cadastro, avaliacao, portal do fornecedor |
| Administracao | Usuarios, permissoes, configuracoes |

## Licenca

Proprietario - Daton ESG Insight
```

---

### 2. docs/api.md (Criar)

**Conteudo:**

```markdown
# Documentacao de API - Daton ESG Insight

## Visao Geral

O Daton utiliza Supabase Edge Functions como backend serverless. Todas as funcoes sao escritas em Deno/TypeScript.

## Autenticacao

Authorization: Bearer {supabase_access_token}

Tokens sao obtidos via Supabase Auth (email/senha ou OAuth).

## Endpoints Base

- Supabase URL: https://dqlvioijqzlvnvvajmft.supabase.co
- Functions: https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/{function_name}

## Padrao de Resposta

### Sucesso (200)

{
  "success": true,
  "data": { ... },
  "message": "Operacao realizada com sucesso"
}

### Erro (4xx/5xx)

{
  "success": false,
  "error": "Mensagem de erro",
  "details": {
    "function": "function_name",
    "step": "validation",
    "timestamp": "2026-02-02T10:30:00Z"
  }
}

## Edge Functions Principais

### ESG Dashboard

POST /functions/v1/esg-dashboard

Retorna dados consolidados do dashboard ESG.

Request:
{
  "company_id": "uuid"
}

Response (200):
{
  "success": true,
  "data": {
    "environmental_score": 85,
    "social_score": 78,
    "governance_score": 92,
    "emissions_total": 1500.5,
    "goals_on_track": 12,
    "goals_at_risk": 3
  }
}

### Document Processor

POST /functions/v1/universal-document-processor

Processa e analisa documentos com IA.

Request:
{
  "document_id": "uuid",
  "mode": "exploratory",
  "skip_parse": false
}

Response (200):
{
  "success": true,
  "analysis": {
    "document_category": "Emissoes",
    "relevance_score": 95,
    "extracted_entities": [...]
  }
}

### AI Chat Assistant

POST /functions/v1/ai-chat-assistant

Assistente de IA para consultas contextuais.

Request:
{
  "message": "Qual foi o total de emissoes em 2025?",
  "context_type": "emissions",
  "company_id": "uuid"
}

[... Ver docs/EDGE_FUNCTIONS_API.md para lista completa ...]

## Codigos de Erro

| Codigo | Significado | Acao |
|--------|-------------|------|
| 400 | Parametros invalidos | Verificar body da requisicao |
| 401 | Nao autenticado | Renovar token de acesso |
| 403 | Sem permissao | Verificar roles do usuario |
| 404 | Recurso nao encontrado | Verificar IDs |
| 429 | Rate limit excedido | Aguardar e tentar novamente |
| 500 | Erro interno | Verificar logs, reportar bug |

## Rate Limiting

- 100 requisicoes por minuto por IP
- 1000 requisicoes por hora por usuario

## Tabelas Principais (Database)

| Tabela | Descricao |
|--------|-----------|
| companies | Empresas cadastradas |
| profiles | Perfis de usuarios |
| employees | Funcionarios |
| emission_sources | Fontes de emissao GEE |
| activity_data | Dados de atividade (consumo) |
| goals | Metas ESG |
| non_conformities | Nao conformidades |
| suppliers | Fornecedores |
| licenses | Licencas ambientais |
| documents | Documentos do sistema |

## Exemplos de Uso

### JavaScript/TypeScript

import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('esg-dashboard', {
  body: { company_id: 'uuid' }
});

if (error) console.error(error);
console.log(data);

### cURL

curl -X POST \
  'https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/esg-dashboard' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"company_id": "uuid"}'
```

---

### 3. docs/architecture.md (Criar)

**Conteudo:**

```markdown
# Arquitetura do Sistema - Daton ESG Insight

## Visao Geral

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

## Camadas da Aplicacao

### 1. Apresentacao (Frontend)

src/pages/         # Paginas (routes)
src/components/    # Componentes UI
src/contexts/      # Estado global (React Context)

- React 18 com Suspense e Lazy Loading
- Tailwind CSS para estilizacao
- shadcn/ui para componentes base

### 2. Logica de Negocios

src/hooks/         # Custom hooks (dados + logica)
src/services/      # Camada de servicos (API calls)
src/utils/         # Funcoes utilitarias

- TanStack Query para cache e sincronizacao
- React Hook Form para formularios
- Zod para validacao de schemas

### 3. Persistencia (Backend)

supabase/functions/   # Edge Functions
Supabase Database     # PostgreSQL com RLS
Supabase Storage      # Arquivos e documentos

## Fluxo de Autenticacao

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

1. Usuario submete credenciais em /auth
2. Supabase Auth valida e retorna JWT
3. JWT armazenado em localStorage
4. AuthContext gerencia estado global
5. ProtectedRoute verifica sessao

## Fluxo de Dados

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

## Modulos Principais

### ESG Ambiental
- Inventario GEE (Escopos 1, 2, 3)
- Gestao de Licencas
- Monitoramento (Agua, Energia, Residuos)

### ESG Social
- Gestao de Funcionarios
- Treinamentos (LMS)
- Seguranca do Trabalho

### Qualidade (SGQ)
- Nao Conformidades
- Acoes Corretivas
- Controle de Documentos
- Auditorias

### Fornecedores
- Cadastro e Avaliacao
- Portal do Fornecedor
- Monitoramento de Riscos

## Edge Functions (60+)

Categorias:
- AI/ML: ai-chat-assistant, ai-insights-engine
- Documentos: universal-document-processor, document-ai-processor
- ESG: esg-dashboard, ghg-recalculate
- Qualidade: compliance-management, audit-management
- Fornecedores: supplier-auth, supplier-notifications

## Decisoes de Arquitetura (ADR)

### ADR-001: Supabase como Backend
- Decisao: Usar Supabase em vez de backend custom
- Motivo: Time-to-market, custos, escalabilidade
- Consequencias: Depende de RLS para seguranca

### ADR-002: TanStack Query para Cache
- Decisao: Usar TanStack Query v5
- Motivo: Cache automatico, revalidacao, devtools
- Consequencias: Complexidade em mutations

### ADR-003: Edge Functions para Logica Complexa
- Decisao: Deno Edge Functions para IA/processamento
- Motivo: Timeout maior, acesso a APIs externas
- Consequencias: Deploy separado, cold starts

### ADR-004: Lazy Loading de Rotas
- Decisao: Code splitting por rota
- Motivo: Bundle inicial menor (~200KB)
- Consequencias: Loading states necessarios

## Seguranca

### Row Level Security (RLS)
- Todas tabelas tem policies
- company_id usado para isolamento
- Roles: admin, manager, user, viewer

### Validacao de Entrada
- Zod schemas no frontend
- Validacao em Edge Functions
- Sanitizacao HTML (DOMPurify)

### Rate Limiting
- 100 req/min por IP
- Rate limiter em utils/securityUtils.ts

## Monitoramento

- Performance: src/utils/performanceMonitor.ts
- Logs: src/utils/logger.ts
- Health: src/utils/healthCheck.ts
- Dashboard: /production-monitoring
```

---

### 4. docs/development.md (Criar)

**Conteudo:**

```markdown
# Guia de Desenvolvimento - Daton ESG Insight

## Configuracao do Ambiente

### Requisitos
- Node.js 20+
- npm 10+
- Git

### Setup Inicial

# Clonar repositorio
git clone <repo_url>
cd daton-esg-insight

# Instalar dependencias
npm install

# Copiar variaveis de ambiente
cp .env.example .env.local

# Iniciar servidor de desenvolvimento
npm run dev

### Variaveis de Ambiente

VITE_SUPABASE_URL=https://dqlvioijqzlvnvvajmft.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=dqlvioijqzlvnvvajmft
VITE_IOT_WEBSOCKET_URL=ws://localhost:3001/iot (opcional)

## Estrutura de Pastas

src/
├── components/       # Componentes reutilizaveis
│   ├── ui/           # Componentes base (shadcn)
│   ├── forms/        # Componentes de formulario
│   └── [modulo]/     # Componentes por modulo
├── pages/            # Paginas (1 arquivo = 1 rota)
├── services/         # Chamadas de API
├── hooks/            # Custom hooks
├── contexts/         # React Context
├── utils/            # Funcoes utilitarias
├── types/            # Tipos TypeScript
├── constants/        # Constantes
└── schemas/          # Zod schemas

## Scripts NPM

npm run dev          # Servidor desenvolvimento
npm run build        # Build producao
npm run preview      # Preview do build
npm run lint         # ESLint
npm run test         # Vitest
npm run test:ui      # Vitest UI
npm run test:coverage # Cobertura de testes

## Padroes de Codigo

### Componentes React

// Estrutura padrao
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={onAction}>Acao</Button>
    </div>
  );
}

### Hooks com TanStack Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItems, createItem } from '@/services/items';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: getItems,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

### Servicos (API Layer)

import { supabase } from '@/integrations/supabase/client';

export async function getItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function createItem(item: CreateItemInput) {
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

## Convencoes de Nomenclatura

| Tipo | Convencao | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | UserProfile.tsx |
| Hooks | camelCase (use*) | useUserData.ts |
| Servicos | camelCase | userService.ts |
| Constantes | SCREAMING_SNAKE | MAX_FILE_SIZE |
| Tipos/Interfaces | PascalCase | UserProfile |

## Git Workflow

### Branches
- main - Producao
- develop - Desenvolvimento
- feature/* - Novas features
- fix/* - Bug fixes
- hotfix/* - Correcoes urgentes

### Commit Messages

Formato: type(scope): descricao

Tipos:
- feat: Nova funcionalidade
- fix: Correcao de bug
- docs: Documentacao
- style: Formatacao
- refactor: Refatoracao
- test: Testes
- chore: Tarefas gerais

Exemplos:
feat(emissions): adicionar calculo de escopo 3
fix(auth): corrigir logout em mobile
docs(readme): atualizar instrucoes de setup

### Pull Request Checklist

- [ ] Codigo segue padroes do projeto
- [ ] Testes adicionados/atualizados
- [ ] Tipos TypeScript corretos
- [ ] Sem erros de lint
- [ ] Build passa sem erros
- [ ] Documentacao atualizada (se necessario)

## Debugging

### Console Logs (Dev Only)

import { logger } from '@/utils/logger';

logger.info('Acao executada', { userId, action });
logger.error('Erro ao salvar', error);
logger.debug('Debug info', data); // Apenas em dev

### React Query DevTools
- Abre automaticamente em desenvolvimento
- Inspecionar cache, queries, mutations

### Performance
- Chrome DevTools > Performance
- Ver performanceMonitor.ts para metricas

## Recursos Adicionais

- [React Docs](https://react.dev)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)
```

---

### 5. docs/operations.md (Criar)

**Conteudo:**

```markdown
# Guia de Operacoes - Daton ESG Insight

## Ambientes

| Ambiente | URL | Branch |
|----------|-----|--------|
| Producao | https://daton-esg-insight.lovable.app | main |
| Preview | https://id-preview--*.lovable.app | feature/* |
| Local | http://localhost:8080 | - |

## Deploy

### Producao (Lovable)
1. Merge PR para branch main
2. Deploy automatico via Lovable
3. Verificar em https://daton-esg-insight.lovable.app

### Edge Functions
- Deploy automatico ao fazer push
- Verificar logs: Supabase Dashboard > Edge Functions > Logs

## Monitoramento

### Dashboard de Producao
- URL: /production-monitoring
- Tabs: Status, Logs, Performance

### Health Check
- Acesso: Via ProductionHealthWidget no dashboard
- Metricas: Score 0-100, status healthy/warning/critical

### Logs
- Nivel: error (producao), debug (desenvolvimento)
- Acesso: /production-monitoring > Logs
- Export: JSON para analise

### Performance
- Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Metricas custom via performanceMonitor.ts

## Database

### Acesso
- Dashboard: https://supabase.com/dashboard/project/dqlvioijqzlvnvvajmft
- SQL Editor: Dashboard > SQL Editor

### Backup
- Automatico diario (Supabase)
- Point-in-time recovery disponivel

### Migrations
- Via Lovable (automatico)
- Ou via Dashboard > SQL Editor

## Troubleshooting

### Problema: Pagina em branco

1. Verificar console do browser (F12)
2. Checar erros de JavaScript
3. Verificar se Supabase esta acessivel
4. Limpar cache do browser

### Problema: Erro 401 (Unauthorized)

1. Verificar se usuario esta logado
2. Token expirado? Fazer logout/login
3. Verificar AuthContext

### Problema: Erro 500 em Edge Function

1. Acessar Supabase Dashboard > Edge Functions > Logs
2. Identificar erro especifico
3. Verificar parametros enviados
4. Checar secrets configurados

### Problema: Dados nao aparecem

1. Verificar RLS policies
2. Checar company_id do usuario
3. Verificar cache do TanStack Query
4. Limpar cache: window.queryClient.clear()

### Problema: Performance lenta

1. Verificar Network tab (chamadas lentas)
2. Checar /production-monitoring > Performance
3. Verificar queries no Supabase Dashboard
4. Considerar adicionar indices

## Rollback

### Codigo (via Git)

# Identificar commit anterior
git log --oneline -10

# Reverter para commit especifico
git revert <commit_hash>
git push origin main

### Edge Functions

# Via Supabase CLI
supabase functions deploy <function_name> --version <previous_version>

## Escalacao

### Nivel 1 - Desenvolvedor
- Erros de codigo
- Bugs de UI
- Problemas de configuracao

### Nivel 2 - Tech Lead
- Problemas de arquitetura
- Performance critica
- Seguranca

### Nivel 3 - Supabase/Lovable Support
- Infraestrutura
- Outages
- Problemas de plataforma

## Comandos Uteis

### Limpar Cache (Browser Console)

// Limpar cache do React Query
window.queryClient.clear();

// Limpar localStorage
localStorage.clear();

// Reload forcado
location.reload(true);

### Verificar Versao

// Ver versao do sistema
console.log(PRODUCTION_CONFIG.VERSION);

### Debug Mode

// Ativar logs de debug (dev only)
localStorage.setItem('DEBUG', 'true');

## Checklist Pre-Deploy

- [ ] Testes passando (npm run test)
- [ ] Build sem erros (npm run build)
- [ ] Lint sem erros (npm run lint)
- [ ] TypeScript sem erros (npx tsc --noEmit)
- [ ] Variaveis de ambiente configuradas
- [ ] Edge Functions testadas
- [ ] RLS policies verificadas

## Contatos

- Suporte Lovable: https://lovable.dev/support
- Suporte Supabase: https://supabase.com/support
- Documentacao: /documentacao ou /faq
```

---

### 6. .env.example (Atualizar)

**Conteudo:**

```
# ===========================================
# Daton ESG Management System
# Environment Variables
# ===========================================

# OBRIGATORIO - Supabase Configuration
# Obter em: https://supabase.com/dashboard/project/[id]/settings/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id

# OPCIONAL - IoT Integration
# WebSocket URL para dados de sensores em tempo real
VITE_IOT_WEBSOCKET_URL=ws://localhost:3001/iot

# ===========================================
# NOTAS:
# - Nunca commitar .env com valores reais
# - Usar .env.local para desenvolvimento local
# - Variaveis VITE_* sao expostas ao client
# ===========================================
```

---

## Resumo de Arquivos

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `README.md` | Atualizar | README completo com tech stack e estrutura |
| `docs/api.md` | Criar | Documentacao de API e Edge Functions |
| `docs/architecture.md` | Criar | Arquitetura e decisoes de design |
| `docs/development.md` | Criar | Guia para desenvolvedores |
| `docs/operations.md` | Criar | Guia de operacoes e troubleshooting |
| `.env.example` | Atualizar | Template de variaveis com comentarios |

---

## Secao Tecnica

### Estrutura Final /docs

docs/
├── api.md                          # Documentacao de API
├── architecture.md                 # Arquitetura do sistema
├── development.md                  # Guia de desenvolvimento
├── operations.md                   # Guia de operacoes
├── prd.md                          # PRD (existente)
├── EDGE_FUNCTIONS_API.md           # API Edge Functions (existente)
├── PRODUCTION_MONITORING_GUIDE.md  # Monitoramento (existente)
├── PRODUCTION_SYSTEM_OVERVIEW.md   # Overview producao (existente)
└── [outros docs existentes...]

### Diagramas ASCII

Os diagramas sao criados em formato ASCII para compatibilidade com Markdown:
- Blocos com +---+
- Setas com --> ou |
- Formatacao monospace

### Links Internos

Todos os documentos referenciam uns aos outros para navegacao facil.

