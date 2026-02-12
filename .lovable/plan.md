
## Acesso condicional na pagina de Documentacao

### Comportamento desejado

| Usuario | Secoes visiveis |
|---|---|
| Nao logado | Central de Ajuda (FAQ) + card "Precisa de ajuda?" |
| Logado | Todas as secoes (Visao Geral, Modulos, Beneficios, Seguranca, API, FAQ) |

### Implementacao

**Arquivo: `src/pages/Documentacao.tsx`**

1. Importar `supabase` de `@/integrations/supabase/client`
2. Adicionar estado `isAuthenticated` com `useState(false)`
3. No `useEffect`, chamar `supabase.auth.getSession()` para verificar se ha sessao ativa e escutar `onAuthStateChange` para reagir a login/logout
4. Na sidebar, mostrar apenas o item "Central de Ajuda" e o card "Precisa de ajuda?" quando nao autenticado; mostrar todos os itens quando autenticado
5. Na area de conteudo, renderizar as secoes condicionalmente:
   - `overview`, `modules`, `benefits`, `security`, `api`: apenas se `isAuthenticated`
   - `faq`: sempre visivel

### Detalhes tecnicos

- A verificacao de autenticacao sera feita diretamente via `supabase.auth.getSession()` (sem depender do AuthContext, ja que esta e uma pagina publica)
- O listener `onAuthStateChange` garante que a pagina reaja imediatamente se o usuario fizer login/logout em outra aba
- A lista `sections` (usada pela sidebar) sera filtrada com base em `isAuthenticated`
- As secoes de conteudo serao envolvidas em blocos `{isAuthenticated && (...)}` para os itens restritos
