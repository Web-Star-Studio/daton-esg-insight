

# Redesign do Email de Convite — Profissional e Minimalista

## Problema

O template atual do email de convite (`supabase/functions/invite-user/index.ts`, função `buildEmailHtml`) tem visual excessivamente decorativo: gradientes coloridos, emojis (🔑, ⚠️), caixas coloridas com bordas laterais, sombras. O usuário quer algo mais profissional e minimalista, incluindo a logo do sistema.

## Design proposto

Layout limpo, fundo branco, tipografia sóbria, sem emojis, sem gradientes, sem caixas coloridas:

```text
┌─────────────────────────────────────┐
│                                     │
│           [Logo Daton]              │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Olá, Douglas Araújo.               │
│                                     │
│  Você foi convidado(a) por [nome]   │
│  para a equipe da [empresa] na      │
│  plataforma Daton.                  │
│                                     │
│  Papel: Visualizador                │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Email: douglas@email.com           │
│  Senha temporária: Aeep9t$y7IMs     │
│                                     │
│  Altere sua senha após o primeiro   │
│  acesso em Configurações >          │
│  Segurança.                         │
│                                     │
│         [ Acessar Plataforma ]      │
│                                     │
├─────────────────────────────────────┤
│  © 2026 Daton                       │
└─────────────────────────────────────┘
```

Características:
- Fundo externo `#f9fafb`, card branco sem sombra pesada
- Logo do sistema no topo (usando URL pública do asset publicado)
- Sem emojis, sem gradientes, sem bordas laterais coloridas
- Botão CTA com cor sólida `#059669` (verde Daton), sem gradiente
- Tipografia limpa, cores neutras (`#111827`, `#6b7280`)
- Senha em bloco monospace com fundo cinza claro sutil
- Aviso de troca de senha em texto simples, sem ícone

## Logo no email

A logo está em `src/assets/daton-logo-header.png`. Para emails HTML, precisa de URL absoluta. Usaremos a URL do app publicado: `https://daton-esg-insight.lovable.app/assets/...` — porém como assets do Vite têm hash, a abordagem mais confiável é copiar a logo para a pasta `public/` (ex: `public/logo-email.png`) para ter URL estável, ou fazer upload para o storage do Supabase.

A solução mais simples: copiar `daton-logo-header.png` para `public/logo-email.png` e referenciar como `${siteUrl}/logo-email.png`.

## Arquivo a modificar

### 1. `supabase/functions/invite-user/index.ts`

Reescrever a função `buildEmailHtml` (linhas ~424-535) com template minimalista:
- Remover gradientes do header
- Remover emojis
- Remover caixas coloridas (azul, verde, amarela)
- Adicionar `<img>` da logo no topo
- Botão CTA com background sólido
- Cores neutras e tipografia limpa

### 2. Copiar logo para `public/`

Copiar `src/assets/daton-logo-header.png` → `public/logo-email.png` para URL estável no email.

