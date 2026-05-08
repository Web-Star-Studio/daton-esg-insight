# Secrets necessários para edge functions

Documenta as variáveis de ambiente que as edge functions deste projeto
esperam encontrar. Tudo é configurado no dashboard do Supabase em
`Project Settings → Edge Functions → Secrets`.

## Built-in (preenchidos automaticamente pela plataforma)

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL pública do projeto (ex.: `https://<ref>.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role JWT — usado pelo `createClient` de dentro das functions para bypassar RLS. **Nunca expor pra cliente.** |
| `SUPABASE_ANON_KEY` | Anon JWT do projeto. Usado por functions que precisam contatar a própria API REST em nome do usuário. |

## Configurados manualmente

| Variável | Onde é usada | Como obter |
|---|---|---|
| `PERPLEXITY_API_KEY` | `legislation-monthly-radar`, `legislation-suggestions-from-profile`, `compliance-update-letter-generator`, `laia-legislation-suggester` | <https://www.perplexity.ai/settings/api> |
| `LOVABLE_API_KEY` | `daton-ai-chat` e (futuro) agente runtime via `_shared/ai-logger.ts::aiCall` | Lovable platform — solicitar com a equipe |

## Vault (secrets internos do Postgres, não do Edge Runtime)

| Nome | Onde é usado | Como popular |
|---|---|---|
| `cron_invoke_jwt` | `pg_cron` lê via `vault.decrypted_secrets` para chamar edge functions internas (cron mensal da carta) | Ver bloco abaixo |

### Setup do `cron_invoke_jwt` (necessário em DBs novos)

```sql
SELECT vault.create_secret(
  '<anon-jwt-do-projeto>',
  'cron_invoke_jwt',
  'JWT anon usado pelo pg_cron para invocar edge functions internas'
);
```

O anon JWT está em `Project Settings → API → Project API keys → anon public`.
A migration `20260507120000_compliance_update_letters.sql` tenta ler esse
secret em runtime ao agendar o cron — sem o secret, o cron dispara mas
falha 401 na edge function (visível em `cron.job_run_details`).

### Rotação do anon key

Quando rotacionar o anon key (recomendado periodicamente, e **obrigatório**
após qualquer commit que tenha vazado o JWT no histórico):

```sql
-- Atualiza o secret no vault com o novo JWT
SELECT vault.update_secret(
  (SELECT id FROM vault.secrets WHERE name = 'cron_invoke_jwt'),
  '<novo-anon-jwt>'
);
```

E em paralelo, atualizar a env var do front (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
ou `VITE_SUPABASE_PUBLISHABLE_KEY` dependendo do app) e redeployar.

## Adicionando um novo secret

1. Adicionar no dashboard do Supabase.
2. Documentar nesta tabela.
3. Não logar o valor em `console.log` — Supabase indexa logs e o secret
   pode vazar.
4. Se o secret é usado em pg_cron / DB-side, considerar guardar no `vault`
   em vez do Edge Runtime — o vault tem auditoria nativa e RLS.
