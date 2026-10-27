# Teste isolado do formulário comercial (somente para joao@webstar.studio)

## Diagnóstico (lido agora, sem modificações)

- Commit local: `97b22868` ("Corrigiu erro de docs na prévia"), igual à main informada.
- Backend ativo: Lovable Cloud, um único projeto que serve a prévia e o site publicado (o `project_id` em `supabase/config.toml` é o mesmo).
- Função implantada: `commercial-contact` responde ao preflight `OPTIONS` com 200 no endpoint público. A versão implantada é a desta pasta (`index.ts` + `schema.ts`), publicada na migração para o Cloud. Não dá para baixar o código implantado; a equivalência se apoia no repositório estar igual à main.
- Destinatário: fixado no servidor (`COMMERCIAL_RECIPIENT = "felipe@webstar.studio"` em `schema.ts`), remetente `Daton <contato@daton.com.br>`, `reply_to` = e-mail do visitante, sem cc/bcc. O navegador nunca escolhe o destinatário.
- Segredos disponíveis no backend (só os nomes): `LOVABLE_API_KEY`, `RESEND_API_KEY` (ligado ao Resend). Nenhum valor foi lido nem mostrado.
- Frontend chama `supabase.functions.invoke("commercial-contact", { body })` com o corpo validado pelo mesmo schema.
- **Site publicado ainda está sem as variáveis do Cloud**: no pacote `client-CWcHqT7r.js` de daton.com.br, URL e chave são `void 0`. Por isso o formulário no ar não consegue enviar.
- Nova publicação da main: o `.env` local tem `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID` preenchidos. O `vite.config.ts` da main **interrompe a geração de produção** se faltarem URL ou chave. Resultado: ou o site sai com os valores, ou a publicação falha de forma visível. Ele não sai quebrado sem aviso. Daqui não consigo confirmar quais valores a hospedagem injeta. Isso se confere depois de publicar, procurando a URL do projeto no pacote `client-*.js`.

## O que é possível

Sim, isso é possível: uma função temporária pode rodar ao lado da de produção, ser chamada por URL pública e ser apagada no fim. Nesta etapa (modo plano) não posso criar arquivos nem implantar; a execução depende da sua aprovação.

## Plano executável (após aprovação)

1. Criar `supabase/functions/commercial-contact-test/` copiando `index.ts` e `schema.ts` byte a byte. A única mudança é `COMMERCIAL_RECIPIENT = "joao@webstar.studio"` na cópia. Gerar um diff para provar que essa é a única linha diferente. A função de produção e seu `schema.ts` não mudam.
2. Implantar apenas `commercial-contact-test`, sem reimplantar `commercial-contact`.
3. URL pública: `https://<ref>.supabase.co/functions/v1/commercial-contact-test`, com o `ref` do projeto ativo e os cabeçalhos `apikey` e `Authorization: Bearer <chave publicável>`. Esses são os mesmos cabeçalhos que `functions.invoke` envia.
4. Antes de enviar, ler os logs da função. Fazer só um POST, com o mesmo corpo do frontend: todos os campos do schema, `website: ""`, `consentimento: true` e `requestId` gerado por `crypto.randomUUID()` (v4). Esperar 200 e o id do Resend.
5. Apagar `commercial-contact-test` do backend e a pasta local. Depois confirmar que a URL temporária devolve 404 e que `commercial-contact` continua respondendo ao `OPTIONS` com 200.
6. Não mexer em navegação, GitHub, commits ou publicação. Nada é enviado para felipe@webstar.studio.

## Riscos e limitações

- A pasta temporária fica no repositório por alguns minutos e pode aparecer no histórico automático do Lovable. Se o outro processo puxar ou enviar nesse intervalo, ela pode ir para a main. Por isso a remoção vem logo depois do teste.
- Isso prova o código e as credenciais, não o site publicado. O teste ponta a ponta do site só fica possível depois de uma publicação que leve as variáveis do Cloud.
