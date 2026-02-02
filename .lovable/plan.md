
# Plano de Auditoria de Validacao de Inputs

## Resumo Executivo

Este plano aborda uma auditoria completa de validacao de inputs no sistema Daton ESG Insight, cobrindo validacao client-side, server-side, seguranca de input e UX de validacao conforme a diretiva do CTO.

---

## Diagnostico do Estado Atual

### Pontos Fortes Identificados

| Categoria | Status | Detalhes |
|-----------|--------|----------|
| Zod Schema Validation | OK | 68+ arquivos usam Zod para validacao |
| Password Schema | OK | `passwordSchema` com requisitos completos (8 chars, maiuscula, minuscula, numero, especial) |
| Password Confirmation | OK | `validatePasswordMatch()` implementado |
| CPF/CNPJ Validation | OK | Validadores com algoritmo de digitos verificadores |
| Email Regex | OK | Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` implementado |
| Phone Formatting | OK | `formatPhone()` e `validatePhone()` implementados |
| URL Validation | OK | `new URL()` parsing em `sanitizeUrl()` |
| XSS Protection | OK | DOMPurify com sanitizeHTML, sanitizeRichText, sanitizeText |
| Rate Limiting Client | OK | `RateLimiter` class em securityUtils.ts |
| File Size Limits | OK | MAX_FILE_SIZE = 20MB, validacao em useAttachments |
| FormMessage Component | OK | Usado em 145 arquivos com indicador visual |
| Required Field Messages | OK | Pattern `.min(1, "X e obrigatorio")` em 39+ arquivos |

### Problemas Identificados

| Problema | Severidade | Localizacao | Impacto |
|----------|------------|-------------|---------|
| Inputs de telefone sem `type="tel"` | MEDIA | 30+ formularios | UX mobile degradada |
| Server-side password validation incompleta | ALTA | supplier-auth | Apenas verifica length >= 8, sem requisitos de complexidade |
| Falta de rate limiting em edge functions criticas | ALTA | invite-user, supplier-auth | Vulneravel a brute force |
| Auth.tsx sem validacao Zod | MEDIA | src/pages/Auth.tsx | Validacao manual inconsistente |
| Mensagens de erro tecnicas no servidor | BAIXA | Edge functions | Potencial leak de informacao |
| Validacao de confirm password apenas no submit | BAIXA | Auth.tsx | UX pode ser melhorada com real-time |

---

## Matriz de Conformidade por Checklist

### Validacao Client-Side

| Requisito | Status | Implementacao |
|-----------|--------|---------------|
| Campo obrigatorio | OK | `.min(1, "Campo obrigatorio")` padronizado |
| Email regex | OK | `z.string().email()` + regex customizado |
| Phone regex | PARCIAL | `validatePhone()` existe, mas inputs sem `type="tel"` |
| URL parsing | OK | `sanitizeUrl()` com `new URL()` |
| Date parsing | OK | `parseDateSafe()` em dateUtils.ts |
| Password requisitos comunicados | OK | `getPasswordRequirementChecks()` no Auth.tsx |
| Confirm password match | OK | `validatePasswordMatch()` implementado |
| Min/max length | OK | Zod `.min()` e `.max()` com mensagens |
| Min/max value | OK | Zod `.min()` e `.max()` para numeros |
| Custom regex | OK | CEP, CNPJ, CPF patterns implementados |

### Validacao Server-Side

| Requisito | Status | Implementacao |
|-----------|--------|---------------|
| Inputs revalidados no servidor | PARCIAL | `validateRequestBody()` basico, sem Zod |
| Rate limiting em endpoints criticos | A IMPLEMENTAR | Nao existe em edge functions |
| Mensagens de erro genericas | PARCIAL | Algumas mensagens especificas demais |
| Never trust frontend | PARCIAL | Alguns endpoints sem validacao completa |

### Seguranca de Input

| Requisito | Status | Implementacao |
|-----------|--------|---------------|
| XSS protection | OK | DOMPurify em sanitize.ts |
| SQL injection | OK | Supabase client usa prepared statements |
| CSRF | OK | Token em auth header, CORS configurado |
| Path traversal | OK | Nao permite paths customizados |
| File size limits | OK | MAX_FILE_SIZE = 20MB |
| File type validation | OK | ALLOWED_TYPES e ALLOWED_EXTENSIONS |

### UX de Validacao

| Requisito | Status | Implementacao |
|-----------|--------|---------------|
| Error message perto do field | OK | FormMessage component |
| Red border/indicador visual | OK | `border-destructive` classes |
| Mensagens claras | OK | Portugues, nao tecnicas |
| Exemplos de formato | PARCIAL | Placeholders ajudam, mas podem melhorar |
| Real-time validation nao agressivo | OK | `mode: "onBlur"` em forms |

---

## Plano de Correcoes

### FASE 1: Input Types para Telefone

**Problema:** Campos de telefone nao usam `type="tel"` para melhor UX mobile

**Arquivos a modificar:**
- `src/components/EmployeeModal.tsx`
- `src/pages/SupplierRegistration.tsx`
- `src/components/StakeholderModal.tsx`
- `src/components/suppliers/SupplierManagementModal.tsx`
- `src/components/NotificationPreferencesModal.tsx`
- `src/components/gri-wizard/Etapa1Planejamento.tsx`

**Exemplo de correcao:**
```tsx
// ANTES
<Input
  value={formData.phone}
  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
/>

// DEPOIS
<Input
  type="tel"
  inputMode="tel"
  value={formData.phone}
  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
  placeholder="(11) 99999-9999"
/>
```

---

### FASE 2: Validacao Server-Side com Zod

**Problema:** Edge functions nao usam Zod para validacao de schema

**Arquivo:** `supabase/functions/_shared/validation.ts`

**Correcao:** Adicionar schemas Zod para validacao server-side

```typescript
// Adicionar ao validation.ts
import { z } from 'https://esm.sh/zod@3.23.8';

// Schema de senha com requisitos completos
export const serverPasswordSchema = z.string()
  .min(8, 'Senha deve ter no minimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiuscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minuscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um numero')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial');

// Schema de email
export const serverEmailSchema = z.string()
  .email('Email invalido')
  .max(255, 'Email muito longo');

// Validar request body com schema
export function validateBodyWithSchema<T>(body: unknown, schema: z.ZodSchema<T>): { 
  success: true; data: T 
} | { 
  success: false; error: string 
} {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.issues[0]?.message || 'Dados invalidos'
  };
}
```

**Atualizar supplier-auth/index.ts:**
```typescript
// ANTES
if (newPassword.length < 8) {
  return new Response(
    JSON.stringify({ error: "Senha deve ter pelo menos 8 caracteres" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// DEPOIS
import { serverPasswordSchema, validateBodyWithSchema } from '../_shared/validation.ts';

const passwordValidation = serverPasswordSchema.safeParse(newPassword);
if (!passwordValidation.success) {
  return new Response(
    JSON.stringify({ error: passwordValidation.error.issues[0].message }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

### FASE 3: Rate Limiting em Edge Functions

**Problema:** Endpoints criticos (login, change_password, invite-user) sem rate limiting

**Arquivo:** `supabase/functions/_shared/validation.ts`

**Correcao:** Adicionar rate limiting com Deno KV ou in-memory

```typescript
// Rate limiting simples para edge functions
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): { allowed: boolean; remainingAttempts: number; resetInSeconds: number } {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  
  const key = identifier;
  const current = rateLimitCache.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitCache.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remainingAttempts: maxAttempts - 1, resetInSeconds: windowMinutes * 60 };
  }
  
  if (current.count >= maxAttempts) {
    const resetInSeconds = Math.ceil((current.resetTime - now) / 1000);
    return { allowed: false, remainingAttempts: 0, resetInSeconds };
  }
  
  current.count++;
  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - current.count,
    resetInSeconds: Math.ceil((current.resetTime - now) / 1000)
  };
}
```

**Atualizar supplier-auth/index.ts para login:**
```typescript
// No inicio do case "login":
const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
const rateLimitKey = `login:${normalizedDoc}:${clientIP}`;

const rateCheck = checkRateLimit(rateLimitKey, 5, 15); // 5 tentativas em 15 min
if (!rateCheck.allowed) {
  console.log(`⚠️ Rate limit exceeded for ${rateLimitKey}`);
  return new Response(
    JSON.stringify({ 
      error: `Muitas tentativas. Tente novamente em ${Math.ceil(rateCheck.resetInSeconds / 60)} minutos.` 
    }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

### FASE 4: Migrar Auth.tsx para Zod

**Problema:** Auth.tsx usa validacao manual em vez de Zod schema

**Arquivo:** `src/pages/Auth.tsx`

**Correcao:**
```typescript
import { z } from 'zod';
import { passwordSchema } from '@/utils/passwordValidation';

const loginSchema = z.object({
  email: z.string().trim().email('Email invalido'),
  password: z.string().min(1, 'Senha e obrigatoria')
});

const registerSchema = z.object({
  company_name: z.string().trim().min(1, 'Nome da empresa e obrigatorio').max(255),
  cnpj: z.string()
    .transform(v => v.replace(/[^\d]/g, ''))
    .refine(v => v.length === 14, 'CNPJ deve ter 14 digitos'),
  user_name: z.string().trim().min(1, 'Nome e obrigatorio').max(100),
  email: z.string().trim().email('Email invalido'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas nao coincidem',
  path: ['confirmPassword']
});
```

---

### FASE 5: Criar Schema Centralizado para Formularios

**Arquivo:** `src/schemas/formSchemas.ts` (NOVO)

```typescript
import { z } from 'zod';
import { passwordSchema } from '@/utils/passwordValidation';

// Login
export const loginSchema = z.object({
  email: z.string().trim().email('Email invalido'),
  password: z.string().min(1, 'Senha e obrigatoria')
});

// Registro
export const registerSchema = z.object({
  company_name: z.string().trim().min(1, 'Nome da empresa e obrigatorio').max(255),
  cnpj: z.string()
    .transform(v => v.replace(/[^\d]/g, ''))
    .pipe(z.string().length(14, 'CNPJ deve ter 14 digitos')),
  user_name: z.string().trim().min(1, 'Nome e obrigatorio').max(100),
  email: z.string().trim().email('Email invalido').max(255),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas nao coincidem',
  path: ['confirmPassword']
});

// Telefone
export const phoneSchema = z.string()
  .transform(v => v.replace(/[^\d]/g, ''))
  .refine(v => v.length >= 10 && v.length <= 11, {
    message: 'Telefone invalido (10 ou 11 digitos)'
  })
  .optional()
  .or(z.literal(''));

// CPF
export const cpfSchema = z.string()
  .transform(v => v.replace(/[^\d]/g, ''))
  .refine(v => {
    if (!v) return true;
    if (v.length !== 11) return false;
    if (/^(\d)\1+$/.test(v)) return false;
    // Algoritmo de validacao CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(v[i]) * (10 - i);
    let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(v[9]) !== d1) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(v[i]) * (11 - i);
    let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return parseInt(v[10]) === d2;
  }, { message: 'CPF invalido' })
  .optional()
  .or(z.literal(''));
```

---

### FASE 6: Melhorar Mensagens de Erro Server-Side

**Problema:** Algumas mensagens de erro podem revelar informacao sensivel

**Correcao em edge functions:**
```typescript
// ANTES (leak de info)
return new Response(
  JSON.stringify({ error: "Fornecedor nao encontrado" }),
  { status: 401, ... }
);

// DEPOIS (generico)
return new Response(
  JSON.stringify({ error: "Credenciais invalidas" }),
  { status: 401, ... }
);
```

**Padrao de mensagens de erro:**
- Login falhou: "Credenciais invalidas" (nao revelar se email existe)
- Rate limited: "Muitas tentativas. Tente novamente mais tarde."
- Erro interno: "Erro interno do servidor" (sem stack trace)

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/schemas/formSchemas.ts` | Schemas Zod centralizados para formularios |

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `supabase/functions/_shared/validation.ts` | Adicionar Zod schemas e rate limiting |
| `supabase/functions/supplier-auth/index.ts` | Validacao de senha com Zod, rate limiting |
| `supabase/functions/invite-user/index.ts` | Rate limiting |
| `src/pages/Auth.tsx` | Migrar para Zod validation |
| `src/components/EmployeeModal.tsx` | Adicionar type="tel" |
| `src/pages/SupplierRegistration.tsx` | Adicionar type="tel" |
| `src/components/StakeholderModal.tsx` | Adicionar type="tel" |
| `src/components/suppliers/SupplierManagementModal.tsx` | Adicionar type="tel" |

---

## Checklist de Validacao Final

### Client-Side

- [x] Campo obrigatorio com mensagem clara
- [x] Email com regex + backend validation
- [ ] Phone: adicionar type="tel" nos inputs
- [x] URL: new URL() parsing
- [x] Date: parseDateSafe implementado
- [x] Password: requisitos comunicados visualmente
- [x] Confirm password: match validation
- [x] Min/max length com mensagens
- [x] Min/max value para numeros
- [x] Custom regex (CEP, CPF, CNPJ)

### Server-Side

- [ ] Migrar validacao para Zod schemas
- [ ] Rate limiting em login/register
- [ ] Rate limiting em change_password
- [ ] Rate limiting em invite-user
- [ ] Mensagens de erro genericas

### Seguranca

- [x] XSS: DOMPurify implementado
- [x] SQL Injection: Supabase prepared statements
- [x] CSRF: Tokens via auth header
- [x] Path traversal: Nao aplicavel
- [x] File size limits: 20MB max

### UX

- [x] Error messages perto do field
- [x] Indicador visual de erro (border-destructive)
- [x] Mensagens claras em portugues
- [ ] Exemplos de formato em mais placeholders
- [x] Real-time validation onBlur

---

## Ordem de Execucao

1. **Fase 1:** Adicionar type="tel" em inputs de telefone (baixo risco)
2. **Fase 2:** Criar schemas Zod server-side em _shared/validation.ts
3. **Fase 3:** Implementar rate limiting em edge functions criticas
4. **Fase 4:** Migrar Auth.tsx para usar Zod
5. **Fase 5:** Criar formSchemas.ts centralizado
6. **Fase 6:** Revisar mensagens de erro para seguranca
7. **Testes:** Validar fluxos de login, registro, supplier-auth

---

## Metricas de Sucesso

| Metrica | Antes | Depois |
|---------|-------|--------|
| Inputs tel com type="tel" | 0 | 6+ |
| Edge functions com rate limiting | 0 | 3 |
| Validacao Zod server-side | 0% | 100% |
| Mensagens de erro seguras | 70% | 100% |

---

## Secao Tecnica

### Dependencias Necessarias para Edge Functions

Para usar Zod em edge functions, importar via esm.sh:
```typescript
import { z } from 'https://esm.sh/zod@3.23.8';
```

### Consideracoes de Performance

- Rate limiting in-memory tem limitacao: cada instancia da edge function tem seu proprio cache
- Para producao robusta, considerar usar Supabase para armazenar rate limits
- Alternativa: usar headers de rate limit do API Gateway

### Compatibilidade

- Zod v3.23.8 compativel com Deno
- Rate limiting funciona por IP + identifier
- File validation constants sincronizados entre frontend e backend
