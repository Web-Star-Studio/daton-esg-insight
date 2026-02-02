# Guia de Operações - Daton ESG Insight

## Ambientes

| Ambiente | URL | Branch |
|----------|-----|--------|
| Produção | https://daton-esg-insight.lovable.app | main |
| Preview | https://id-preview--*.lovable.app | feature/* |
| Local | http://localhost:8080 | - |

---

## Deploy

### Produção (Lovable)

1. Merge PR para branch `main`
2. Deploy automático via Lovable
3. Verificar em https://daton-esg-insight.lovable.app

### Edge Functions

- Deploy automático ao fazer push
- Verificar logs: Supabase Dashboard > Edge Functions > Logs

---

## Monitoramento

### Dashboard de Produção

- **URL:** `/production-monitoring`
- **Tabs:** Status, Logs, Performance

### Health Check

- Acesso: Via ProductionHealthWidget no dashboard
- Métricas: Score 0-100, status healthy/warning/critical

### Logs

- Nível: `error` (produção), `debug` (desenvolvimento)
- Acesso: `/production-monitoring` > Logs
- Export: JSON para análise

### Performance

- Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Métricas custom via `performanceMonitor.ts`

---

## Database

### Acesso

- **Dashboard:** https://supabase.com/dashboard/project/dqlvioijqzlvnvvajmft
- **SQL Editor:** Dashboard > SQL Editor

### Backup

- Automático diário (Supabase)
- Point-in-time recovery disponível

### Migrations

- Via Lovable (automático)
- Ou via Dashboard > SQL Editor

---

## Troubleshooting

### Problema: Página em branco

1. Verificar console do browser (F12)
2. Checar erros de JavaScript
3. Verificar se Supabase está acessível
4. Limpar cache do browser

### Problema: Erro 401 (Unauthorized)

1. Verificar se usuário está logado
2. Token expirado? Fazer logout/login
3. Verificar AuthContext

### Problema: Erro 500 em Edge Function

1. Acessar Supabase Dashboard > Edge Functions > Logs
2. Identificar erro específico
3. Verificar parâmetros enviados
4. Checar secrets configurados

### Problema: Dados não aparecem

1. Verificar RLS policies
2. Checar `company_id` do usuário
3. Verificar cache do TanStack Query
4. Limpar cache: `window.queryClient.clear()`

### Problema: Performance lenta

1. Verificar Network tab (chamadas lentas)
2. Checar `/production-monitoring` > Performance
3. Verificar queries no Supabase Dashboard
4. Considerar adicionar índices

---

## Rollback

### Código (via Git)

```bash
# Identificar commit anterior
git log --oneline -10

# Reverter para commit específico
git revert <commit_hash>
git push origin main
```

### Edge Functions

```bash
# Via Supabase CLI
supabase functions deploy <function_name> --version <previous_version>
```

---

## Escalação

### Nível 1 - Desenvolvedor
- Erros de código
- Bugs de UI
- Problemas de configuração

### Nível 2 - Tech Lead
- Problemas de arquitetura
- Performance crítica
- Segurança

### Nível 3 - Supabase/Lovable Support
- Infraestrutura
- Outages
- Problemas de plataforma

---

## Comandos Úteis

### Limpar Cache (Browser Console)

```javascript
// Limpar cache do React Query
window.queryClient.clear();

// Limpar localStorage
localStorage.clear();

// Reload forçado
location.reload(true);
```

### Verificar Versão

```javascript
// Ver versão do sistema
console.log(PRODUCTION_CONFIG.VERSION);
```

### Debug Mode

```javascript
// Ativar logs de debug (dev only)
localStorage.setItem('DEBUG', 'true');
```

---

## Checklist Pré-Deploy

- [ ] Testes passando (`npm run test`)
- [ ] Build sem erros (`npm run build`)
- [ ] Lint sem erros (`npm run lint`)
- [ ] TypeScript sem erros (`npx tsc --noEmit`)
- [ ] Variáveis de ambiente configuradas
- [ ] Edge Functions testadas
- [ ] RLS policies verificadas

---

## Links Importantes

| Recurso | URL |
|---------|-----|
| Supabase Dashboard | https://supabase.com/dashboard/project/dqlvioijqzlvnvvajmft |
| Edge Functions Logs | https://supabase.com/dashboard/project/dqlvioijqzlvnvvajmft/functions |
| SQL Editor | https://supabase.com/dashboard/project/dqlvioijqzlvnvvajmft/sql/new |
| Lovable Support | https://lovable.dev/support |
| Supabase Support | https://supabase.com/support |

---

## Contatos

- **Suporte Lovable:** https://lovable.dev/support
- **Suporte Supabase:** https://supabase.com/support
- **Documentação:** `/documentacao` ou `/faq`

---

## Recursos Adicionais

- [Guia de Desenvolvimento](./development.md)
- [Arquitetura do Sistema](./architecture.md)
- [Documentação de API](./api.md)
- [Guia de Performance](../PERFORMANCE.md)
