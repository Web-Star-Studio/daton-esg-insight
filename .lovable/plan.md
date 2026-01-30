
# Plano de Validacao e Melhorias - Edicao de Perfil e Preferencias

## Resumo Executivo

A analise do codigo revelou que o sistema possui uma base solida para edicao de perfil e alteracao de senha, mas apresenta **lacunas significativas** em areas criticas de seguranca e preferencias do usuario.

---

## Analise do Estado Atual

### O que JA existe

| Funcionalidade | Arquivo | Status |
|----------------|---------|--------|
| Edicao de Nome/Cargo | `src/pages/Configuracao.tsx` | OK |
| Alteracao de Senha | `src/pages/Configuracao.tsx` | Parcial (sem validacao de forca) |
| Reset de Senha | `src/pages/ResetPassword.tsx` | OK (com indicadores visuais) |
| Tema (dark/light) | `src/App.tsx` via `ThemeProvider` | OK (next-themes) |
| Exclusao de Conta | `src/components/settings/DeleteAccountSection.tsx` | OK |
| Dashboard Preferences | `src/hooks/data/useDashboardPreferences.ts` | OK (salvo no BD) |

### O que NAO existe (Lacunas Identificadas)

| Funcionalidade | Criticidade |
|----------------|-------------|
| Validacao de email unico (server-side) | ALTA |
| Campo de username com validacao | MEDIA |
| Upload de avatar com preview/crop | MEDIA |
| Campo avatar_url na tabela profiles | ALTA (nao existe no schema) |
| Listagem de sessoes ativas | ALTA (seguranca) |
| Logout remoto de dispositivos | ALTA (seguranca) |
| Historico de login | MEDIA |
| Preferencias de notificacoes | BAIXA |
| Configuracao de timezone | BAIXA |
| Validacao de forca de senha no Configuracao.tsx | ALTA |

---

## Bugs Identificados

### BUG-004: Senha sem validacao de forca no Configuracao.tsx

**Arquivo:** `src/pages/Configuracao.tsx` (linhas 34-41)

**Problema:** O schema `senhaSchema` exige apenas 6 caracteres minimos, enquanto o padrao do sistema (`passwordValidation.ts`) exige 8 caracteres com maiuscula, minuscula, numero e caractere especial.

```typescript
// Atual (linha 36-37)
novaSenha: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),

// Deveria usar:
import { passwordSchema } from '@/utils/passwordValidation';
```

**Impacto:** Usuarios podem definir senhas fracas na secao "Alterar Senha" do perfil.

### BUG-005: Email desabilitado mas sem validacao de unicidade

**Arquivo:** `src/pages/Configuracao.tsx` (linha 393)

O campo de email esta desabilitado (`disabled`), o que e correto para evitar edicao direta. Porem, se futuramente for habilitado, nao ha validacao server-side de unicidade.

---

## Plano de Implementacao

### Fase 1: Correcoes de Seguranca (Prioridade ALTA)

#### 1.1 Aplicar validacao de forca de senha no Configuracao.tsx

**Arquivo:** `src/pages/Configuracao.tsx`

- Importar `passwordSchema` e `getPasswordRequirementChecks` de `@/utils/passwordValidation`
- Substituir validacao inline por schema robusto
- Adicionar indicadores visuais de requisitos (igual ao ResetPassword.tsx)

```typescript
// Schema atualizado
const senhaSchema = z.object({
  senhaAtual: z.string().min(1, "Senha atual e obrigatoria"),
  novaSenha: passwordSchema, // Usa o schema padrao com 8 chars + complexidade
  confirmarSenha: z.string().min(1, "Confirme sua nova senha"),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: "As senhas nao coincidem",
  path: ["confirmarSenha"],
});
```

#### 1.2 Adicionar indicadores visuais de requisitos de senha

Adicionar abaixo do campo "Nova Senha" os indicadores visuais (checkmarks) mostrando quais requisitos foram atendidos, igual ao que ja existe em `ResetPassword.tsx`.

---

### Fase 2: Melhorias de Perfil (Prioridade MEDIA)

#### 2.1 Adicionar coluna avatar_url na tabela profiles

**Migracao SQL:**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

#### 2.2 Implementar upload de avatar

**Novos arquivos:**
- `src/components/settings/AvatarUpload.tsx` - Componente de upload com preview

**Funcionalidades:**
- Aceitar apenas JPG, PNG, WEBP
- Limite de 5MB
- Preview antes de salvar
- Crop opcional (usar canvas nativo)
- Upload para Supabase Storage (bucket `avatars`)

#### 2.3 Adicionar campo username (opcional)

**Migracao SQL:**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;
```

**Validacao:**
- Regex: `/^[a-zA-Z0-9_-]{3,30}$/`
- Verificacao de unicidade via query antes de salvar

---

### Fase 3: Seguranca Avancada (Prioridade ALTA)

#### 3.1 Implementar listagem de sessoes ativas

**Nova tabela:**
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  device_info JSONB, -- {browser, os, ip}
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  is_current BOOLEAN DEFAULT false
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
```

**Novo componente:**
- `src/components/settings/SessionsManager.tsx`
- Listar dispositivos conectados
- Botao "Encerrar sessao" por dispositivo
- Botao "Encerrar todas as outras sessoes"

#### 3.2 Implementar historico de login

**Nova tabela:**
```sql
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  location_info JSONB, -- {city, country} via IP lookup
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_login_history_user ON login_history(user_id, created_at DESC);
```

**Novo componente:**
- `src/components/settings/LoginHistoryTable.tsx`
- Mostrar ultimos 10-20 logins
- Data/hora, IP (mascarado parcialmente), browser/OS, sucesso/falha

---

### Fase 4: Preferencias do Sistema (Prioridade BAIXA)

#### 4.1 Seletor de tema persistente

O tema ja funciona via `next-themes` que usa localStorage. Adicionar:
- Toggle explicito na pagina de configuracoes
- Sincronizar com `dashboard_preferences` no banco

#### 4.2 Preferencias de notificacoes

**Novo componente:** `src/components/settings/NotificationPreferences.tsx`

Toggles para:
- Notificacoes por email (vencimento licencas, NCs)
- Notificacoes in-app (alertas do sistema)
- Resumo semanal

Salvar em `dashboard_preferences` JSONB.

#### 4.3 Configuracao de timezone

Adicionar campo no formulario de perfil para selecionar timezone (dropdown com timezones BR mais comuns).

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Configuracao.tsx` | Validacao de senha forte + indicadores visuais |
| `src/utils/passwordValidation.ts` | Nenhuma (ja esta correto) |
| `src/components/settings/AvatarUpload.tsx` | **CRIAR** |
| `src/components/settings/SessionsManager.tsx` | **CRIAR** |
| `src/components/settings/LoginHistoryTable.tsx` | **CRIAR** |
| `src/components/settings/NotificationPreferences.tsx` | **CRIAR** |
| `src/components/settings/ThemeSelector.tsx` | **CRIAR** |

---

## Migracao de Banco de Dados

```sql
-- Fase 2: Avatar e Username
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- Fase 3: Sessoes e Historico
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  is_current BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  location_info JSONB,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Storage bucket para avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

---

## Verificacao de Credenciais Hardcoded

A busca por credenciais hardcoded **nao encontrou problemas**:
- Nenhuma senha literal no codigo
- Senhas temporarias sao geradas dinamicamente (`generateTemporaryPassword()`)
- Nenhum secret hardcoded encontrado

---

## Ordem de Execucao Recomendada

1. **Imediato (Fase 1):** Corrigir validacao de senha no Configuracao.tsx
2. **Curto prazo (Fase 2):** Avatar upload + username
3. **Medio prazo (Fase 3):** Sessoes e historico de login
4. **Longo prazo (Fase 4):** Preferencias de notificacoes e timezone

---

## Entregaveis

- Formularios de edicao com validacoes completas
- Upload de avatar funcional com preview
- Listagem de sessoes com logout remoto
- Historico de logins visivel ao usuario
- Testes passando para todas as funcionalidades
- Documentacao de preferencias suportadas
