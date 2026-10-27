# Primeiro contato comercial mais curto

Pedido adicional após o encerramento da task 235. O formulário passa de sete
campos de dados (seis obrigatórios) para cinco (três obrigatórios), além do
consentimento preservado.

- Obrigatórios: nome, e-mail e empresa.
- Opcionais: WhatsApp e mensagem. Mensagem vazia ou curta é aceita.
- Cargo e área de interesse deixam de aparecer e de ser enviados pelo novo cliente.
- Painel translúcido, contraste, botão, destinatário e proteções de envio preservados.
- Em tablet estreito, os campos ficam em uma coluna para continuarem legíveis.

## Contrato e publicação

O schema compartilhado aceita o novo pedido mínimo e a versão anterior, para
quem ainda tiver a página antiga aberta. Os campos antigos só aparecem no e-mail
se forem enviados por esse cliente anterior. Campo opcional vazio recebe uma
indicação clara; não há texto `undefined`.

A função `commercial-contact` do Lovable Cloud precisa receber os novos
`index.ts`, `schema.ts` e `message.ts` **antes da publicação do frontend novo**.
O frontend da main não é publicado automaticamente: a publicação permanece no
Lovable. Nenhuma função legada, banco, segredo ou destinatário foi alterado.

## Evidência

- 30 testes e tipos aprovados; lint sem erros (quatro avisos herdados); build aprovado.
- Interface headless em 320, 375, 768, 1024 e 1440 px: cinco campos e três
  obrigatórios, validação do pedido mínimo, falha com preservação, retry com o
  mesmo identificador, sucesso e reinício. Sem rolagem horizontal.
- Handler real executado localmente, com adaptação apenas dos imports Deno para
  os pacotes instalados e provider substituído por mock: pedido mínimo e legado
  aceitos; payloads inválidos recusados antes do provider; remetente/destinatário
  fixos, idempotência e exigência de aceite do provider preservados.
- Todos os POSTs do navegador foram interceptados. O handler usou um fetch fake
  que recusa qualquer destino inesperado. **Zero e-mails reais enviados.**

Os JSONs sanitizados e as capturas nesta pasta documentam o resultado. O ensaio
local e a revisão visual estão em `tmp/formulario-enxuto/` (ignorado pelo Git).
