# Publicação da landing no Lovable Cloud

A landing usa o Cloud integrado ao Lovable, projeto `bzlcdnvgzgvtaoegmcte`.
Não é necessário reconectar o antigo projeto Supabase externo. O cliente gerado
pelo Lovable ainda usa os nomes `VITE_SUPABASE_URL` e
`VITE_SUPABASE_PUBLISHABLE_KEY`.

## Falha corrigida

Em 27/10/2026, Publish falhou em `vite.config.ts` com
`Lovable Cloud configuration missing`. A prévia tinha os valores em um `.env`
local ignorado e no processo, mas o build publicado não os recebeu. A publicação
anterior também continha URL e chave indefinidas no bundle do cliente.

O arquivo versionado `.env.production` passa a incluir somente a URL e a chave
publicável do Cloud atual. Os dois valores foram confirmados na configuração do
Cloud; `GET /auth/v1/settings` com a chave retornou 200. Não houve mudança de
backend, banco, permissões ou função comercial.

A chave `sb_publishable_` identifica o navegador e é destinada a código público.
Nunca adicionar `sb_secret_`, `service_role`, Resend, senha de banco ou
`LOVABLE_API_KEY` nesse arquivo. As regras de acesso do backend continuam valendo.
Segredos de servidor permanecem no Cloud.

O Vite carrega `.env.production` no build de produção. Variáveis explícitas do
ambiente de hospedagem continuam tendo prioridade. A checagem em `vite.config.ts`
permanece: se todas as fontes de configuração estiverem ausentes, o build falha.
O CI deixa de usar placeholders e compila a mesma configuração pública do site.

## Verificação

- Antes: `env -u VITE_SUPABASE_URL -u VITE_SUPABASE_PUBLISHABLE_KEY npm run build`
  terminava com exit 1 e o mesmo erro do painel Publish.
- Depois: o mesmo comando deve compilar a partir de um checkout sem `.env` local.
- Testes verificam a lista restrita de valores públicos, o vínculo com
  `supabase/config.toml` e o carregamento sem injeção pelo processo.
- Após publicar, conferir o novo bundle no domínio, a abertura de Contato e
  Documentação, Soluções abrindo `/ambiental` e o retorno ao topo.
- Validar a requisição do formulário com POST interceptado; não reenviar teste
  comercial à caixa de Felipe. O envio real exclusivo a João já foi realizado
  e a função temporária foi removida.

## Referências

- [Backend integrado do Lovable](https://docs.lovable.dev/features/cloud)
- [Variáveis e modos do Vite](https://vite.dev/guide/env-and-mode)
- [Chaves públicas e secretas](https://supabase.com/docs/guides/getting-started/api-keys)
