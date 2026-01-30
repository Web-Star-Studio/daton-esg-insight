
# Auditoria de Autenticacao e Seguranca - Lovable

## Resumo Executivo

Apos analise detalhada do codebase, identifiquei o estado atual da implementacao de seguranca e as lacunas que precisam ser corrigidas para atender aos requisitos do CTO.

---

## 1. Analise do Estado Atual

### 1.1 Armazenamento de Tokens

| Aspecto | Estado Atual | Risco |
|---------|--------------|-------|
| Storage Location | `localStorage` (linha 13, supabase/client.ts) | **ALTO** - Vulneravel a XSS |
| Access Token | Gerenciado pelo Supabase SDK | Medio |
| Refresh Token | Rotacao habilitada (config.toml:50) | OK |

**Problema Identificado:**
```typescript
// src/integrations/supabase/client.ts:11-16
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,  // VULNERAVEL - tokens acessiveis via XSS
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### 1.2 Configuracao JWT (supabase/config.toml)

```toml
[auth]
jwt_expiry = 3600  # 1 hora (recomendado: 1800 = 30min)
refresh_token_rotation_enabled = true  # OK
security_update_password_require_reauthentication = true  # OK
```

**Status:** JWT expira em 1 hora, porem o requisito e de 30 minutos.

### 1.3 Route Guards Implementados

| Componente | Arquivo | Funcionalidade |
|------------|---------|----------------|
| `ProtectedRoute` | `src/components/ProtectedRoute.tsx` | Verifica auth + role hierarquico |
| `RoleGuard` | `src/middleware/roleGuard.tsx` | Verifica roles especificas |
| `PermissionGuard` | `src/middleware/permissionGuard.tsx` | Verifica permissoes granulares |

**Pontos Fortes:**
- Hierarquia de roles bem definida (platform_admin > super_admin > admin > manager > analyst > operator > auditor > viewer)
- Redirecionamento para `/auth` quando nao autenticado
- Loading state enquanto verifica autenticacao

### 1.4 Validacao de Permissoes no Backend

| Edge Function | JWT Validation | Role Check |
|---------------|----------------|------------|
| `invite-user` | `verify_jwt = true` | Verifica admin/super_admin via user_roles |
| `manage-user` | `verify_jwt = true` | Verifica admin/super_admin via user_roles |
| `delete-account` | `verify_jwt = false` | Usa `getClaims()` manualmente |
| `license-ai-analyzer` | `verify_jwt = false` | **SEM VALIDACAO** |
| `process-intelligent-alerts` | `verify_jwt = false` | **SEM VALIDACAO** |

**Problema Critico:** 6 edge functions com `verify_jwt = false` sem validacao manual de JWT.

### 1.5 Protecao XSS/Sanitizacao

| Aspecto | Implementacao | Status |
|---------|---------------|--------|
| DOMPurify | NAO instalado | **FALTA** |
| `dangerouslySetInnerHTML` | 4 arquivos identificados | **RISCO** |
| `sanitizeString()` | `src/utils/formValidation.ts:84` | OK mas basico |
| Zod Validation | 52+ arquivos usando | OK |

**Uso de dangerouslySetInnerHTML sem sanitizacao:**
- `src/pages/supplier-portal/SupplierTrainingDetail.tsx:165`
- `src/pages/supplier-portal/SupplierReadings.tsx:180`
- `src/components/onboarding/InteractiveTutorialSystem.tsx:676`

### 1.6 Protecao CSRF

| Aspecto | Status |
|---------|--------|
| CSRF Tokens | **NAO IMPLEMENTADO** |
| SameSite Cookies | N/A (usa localStorage) |
| Origin Validation | CORS configurado com `*` |

### 1.7 Fluxo de Password Reset

**Estado Atual (src/pages/ResetPassword.tsx):**
- Verifica token de recuperacao via URL hash
- Validacao de senha minima de 6 caracteres
- Exibe mensagem de link invalido/expirado
- Redireciona apos sucesso

**Problema:** Requisitos de senha fracos (apenas 6 caracteres).

### 1.8 Logout e Limpeza de Estado

**Estado Atual (src/contexts/AuthContext.tsx:248-270):**
```typescript
const logout = async () => {
  try {
    await authService.logout();
    setUser(null);
    setSession(null);
    setShouldShowOnboarding(false);
    queryClient.clear();  // Limpa cache React Query
    ...
  }
};
```

**Sincronizacao Cross-Tab (linhas 272-287):**
```typescript
const handleStorageChange = (e: StorageEvent) => {
  if (e.key?.includes('auth-token') && !e.newValue && e.oldValue) {
    setUser(null);
    setSession(null);
    queryClient.clear();
  }
};
```

**Status:** OK - Limpa tokens E estado global.

---

## 2. Gaps de Seguranca Identificados

### Criticos (ALTO)

1. **Tokens em localStorage** - Vulneravel a ataques XSS
2. **JWT expiry de 1 hora** - Deveria ser 30 minutos
3. **6 Edge Functions sem validacao JWT** - Endpoints publicos
4. **dangerouslySetInnerHTML sem DOMPurify** - XSS potencial
5. **Sem protecao CSRF** - Vulneravel a CSRF

### Medios

6. **Requisitos de senha fracos** - Minimo 6 caracteres (deveria ser 8+)
7. **CORS muito permissivo** - `Access-Control-Allow-Origin: *`
8. **Logs de autenticacao expostos** - Emails em logs

### Baixos

9. **Timeout de sessao nao configurado** - Depende apenas do JWT
10. **Falta rate limiting em login** - Sem protecao contra brute force

---

## 3. Plano de Correcao

### Fase 1: Correcoes Criticas de Seguranca

#### 3.1 Implementar httpOnly Cookies (Limitacao Supabase)

**Nota Importante:** O Supabase JS SDK nao suporta nativamente httpOnly cookies no frontend. A unica forma de implementar isso seria:

1. Criar uma edge function de proxy para autenticacao
2. Usar o SDK server-side em todas as operacoes

**Alternativa Pratica:** Focar em protecao XSS robusta para mitigar riscos do localStorage.

#### 3.2 Reduzir JWT Expiry para 30 minutos

```toml
# supabase/config.toml
[auth]
jwt_expiry = 1800  # 30 minutos (era 3600)
```

#### 3.3 Adicionar Validacao JWT em Edge Functions Vulneraveis

**Edge Functions a Corrigir:**
- `license-ai-analyzer`
- `license-document-analyzer`
- `process-intelligent-alerts`
- `intelligent-document-classifier`
- `advanced-document-extractor`
- `smart-content-analyzer`

**Padrao de Correcao:**
```typescript
// Validar JWT manualmente quando verify_jwt = false
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
    status: 401, 
    headers: corsHeaders 
  });
}

const token = authHeader.replace('Bearer ', '');
const { data, error } = await supabase.auth.getClaims(token);
if (error || !data?.claims) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), { 
    status: 401, 
    headers: corsHeaders 
  });
}
const userId = data.claims.sub;
```

### Fase 2: Protecao XSS

#### 3.4 Instalar e Configurar DOMPurify

```bash
npm install dompurify @types/dompurify
```

**Criar utilitario de sanitizacao:**
```typescript
// src/utils/sanitize.ts
import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};

export const sanitizeText = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};
```

**Corrigir usos de dangerouslySetInnerHTML:**
```typescript
// ANTES
<div dangerouslySetInnerHTML={{ __html: training.content_text }} />

// DEPOIS
import { sanitizeHTML } from '@/utils/sanitize';
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(training.content_text) }} />
```

### Fase 3: Fortalecer Requisitos de Senha

#### 3.5 Atualizar Validacao de Senha

```typescript
// src/utils/passwordValidation.ts
import { z } from 'zod';

export const passwordSchema = z.string()
  .min(8, 'Senha deve ter no minimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiuscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minuscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um numero')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial');

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const result = passwordSchema.safeParse(password);
  return {
    valid: result.success,
    errors: result.success ? [] : result.error.errors.map(e => e.message)
  };
};
```

### Fase 4: Implementar CSRF Protection

#### 3.6 Token CSRF para Mutacoes

**Nota:** Como o Supabase usa JWT Bearer tokens, CSRF e mitigado naturalmente para chamadas API. Porem, para formularios tradicionais:

```typescript
// src/utils/csrf.ts
const CSRF_TOKEN_KEY = 'csrf_token';

export const generateCSRFToken = (): string => {
  const token = crypto.randomUUID();
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
};

export const validateCSRFToken = (token: string): boolean => {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  return token === storedToken;
};
```

### Fase 5: Melhorar Logging de Seguranca

#### 3.7 Reduzir Exposicao de Dados em Logs

```typescript
// ANTES
logger.info('Login attempt', { email });

// DEPOIS
logger.info('Login attempt', { emailHash: hashEmail(email) });

// Utilitario
const hashEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  return `${local.charAt(0)}***@${domain}`;
};
```

---

## 4. Arquivos a Modificar

### Fase 1 - Seguranca Critica (5 arquivos)
1. `supabase/config.toml` - JWT expiry
2. `supabase/functions/license-ai-analyzer/index.ts` - JWT validation
3. `supabase/functions/license-document-analyzer/index.ts` - JWT validation
4. `supabase/functions/process-intelligent-alerts/index.ts` - JWT validation
5. `supabase/functions/intelligent-document-classifier/index.ts` - JWT validation

### Fase 2 - Protecao XSS (4 arquivos)
6. `src/utils/sanitize.ts` - NOVO
7. `src/pages/supplier-portal/SupplierTrainingDetail.tsx` - Sanitizacao
8. `src/pages/supplier-portal/SupplierReadings.tsx` - Sanitizacao
9. `src/components/onboarding/InteractiveTutorialSystem.tsx` - Sanitizacao

### Fase 3 - Senha (3 arquivos)
10. `src/utils/passwordValidation.ts` - NOVO
11. `src/pages/ResetPassword.tsx` - Usar nova validacao
12. `src/pages/Auth.tsx` - Usar nova validacao

### Fase 4 - CSRF (1 arquivo)
13. `src/utils/csrf.ts` - NOVO (opcional, JWT ja mitiga)

---

## 5. Diagrama do Fluxo de Autenticacao Atual

```text
+----------------+     +------------------+     +-------------------+
|    Usuario     |     |   Auth.tsx       |     |   Supabase Auth   |
|                |     |   (Frontend)     |     |   (Backend)       |
+-------+--------+     +--------+---------+     +---------+---------+
        |                       |                         |
        | 1. Email/Password     |                         |
        +---------------------->|                         |
        |                       |                         |
        |                       | 2. signInWithPassword   |
        |                       +------------------------>|
        |                       |                         |
        |                       |    3. JWT + Refresh     |
        |                       |<------------------------+
        |                       |                         |
        |                       | 4. Store in localStorage|
        |                       +---------+               |
        |                       |         |               |
        |                       |<--------+               |
        |                       |                         |
        | 5. Redirect Dashboard |                         |
        |<----------------------+                         |
        |                       |                         |
+-------v--------+     +--------+---------+     +---------+---------+
|   Dashboard    |     | ProtectedRoute   |     |   RLS Policies    |
|                +---->|  + RoleGuard     +---->|   (Database)      |
+----------------+     +------------------+     +-------------------+
```

---

## 6. Metricas de Sucesso

| Metrica | Antes | Depois Esperado |
|---------|-------|-----------------|
| JWT Expiry | 1 hora | 30 minutos |
| Edge Functions sem JWT check | 6 | 0 |
| Arquivos com dangerouslySetInnerHTML sem sanitize | 3 | 0 |
| Requisito minimo senha | 6 chars | 8 chars + complexidade |
| DOMPurify instalado | Nao | Sim |
| CSRF Token | Nao | Opcional (JWT mitiga) |

---

## 7. Detalhes Tecnicos

### 7.1 Limitacoes do Supabase

O Supabase SDK no frontend **nao suporta** httpOnly cookies nativamente. As opcoes sao:

1. **Aceitar localStorage** - Mitigar com XSS protection forte (DOMPurify)
2. **Server-side rendering** - Usar Supabase SSR helpers (requer Next.js/Remix)
3. **Edge Function proxy** - Criar proxy que gerencia cookies server-side

**Recomendacao:** Opcao 1 com DOMPurify rigoroso, pois migrar para SSR e invasivo.

### 7.2 Refresh Token Automatico

Ja implementado em duas camadas:
1. **Supabase SDK:** `autoRefreshToken: true` no client
2. **apiGateway:** Interceptor de 401 que tenta refresh antes de falhar

```typescript
// src/services/apiGateway.ts:97-105
if (response.status === 401 && attempt === 0) {
  const { data: { session } } = await supabase.auth.refreshSession();
  if (session) {
    continue; // Retry with new token
  }
}
```

### 7.3 Invalidacao de Refresh Token no Backend

O Supabase gerencia isso automaticamente via `refresh_token_rotation_enabled = true`. Cada refresh token so pode ser usado uma vez.

---

## 8. Testes de Seguranca Recomendados

1. **Teste de XSS:** Injetar `<script>alert('xss')</script>` em campos de texto
2. **Teste de Session Timeout:** Aguardar 31 minutos e verificar se sessao expira
3. **Teste de Password Reset:** Verificar expiracao do link (24h)
4. **Teste de Role Bypass:** Tentar acessar rota admin como viewer
5. **Teste de CSRF:** Enviar POST de dominio externo
6. **Teste de Token Replay:** Usar token antigo apos logout
