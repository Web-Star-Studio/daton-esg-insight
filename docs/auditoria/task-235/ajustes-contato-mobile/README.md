# Contato e responsividade - Task 235

## Formulário e referência

A referência pré-isolamento `de9b7475` tinha cinco campos e um `handleSubmit`
com `TODO: integrar envio para backend/CRM`. O formulário comercial posterior
tem os mesmos dados básicos, área de interesse, mensagem e consentimento,
com validação compartilhada e envio real pelo Lovable Cloud.

Esta revisão recupera o tratamento visual da referência: campos translúcidos,
bordas arredondadas e botão verde-claro. Preserva os oito controles visíveis,
sua ordem, validação, consentimento, idempotência e integração comercial.
Por ter mais campos, continua maior que o protótipo de referência.

O painel foi escurecido e os placeholders reforçados para manter legibilidade.
No cenário conservador de imagem branca, considerando a menor opacidade do
gradiente existente, o contraste calculado é 6,92:1 para o texto digitado e
5,56:1 para placeholders. As capturas headless também foram inspecionadas.

As menções à Web Star Studio na página, título, consentimento e confirmação
foram substituídas pela equipe Daton. O destinatário comercial e as políticas
de privacidade existentes foram preservados.

## Defeitos corrigidos

- **Campos ilegíveis:** a classe `bg-background` do Input sobrepunha o estilo
  de fundo do formulário, deixando texto branco em fundo branco. Os seletores
  comerciais agora são escopados ao painel; não alteram os Inputs globais.
- **Botão:** o estilo padrão do Button também sobrepunha o verde-claro previsto
  nos tokens comerciais; o mesmo escopo garante a cor correta.
- **Sobre Nós:** a animação inicial de Nossa Visão deslocava o bloco 20 px, mas
  a margem do celular era 16 px. Apenas essa seção contém o transbordamento da
  animação com `overflow-x-clip`, sem cortar o conteúdo quando ela termina.
- **768 px:** a regra mobile até 768 px coexistia com o layout `md` a partir de
  768 px, empurrando a barra de ações para fora. O limite mobile passa a
  767,98 px, alinhado ao breakpoint já usado na interface.

## Evidências

Os JSONs antes/depois registram apenas geometria e cores, sem dados preenchidos.
Antes, a largura do documento excedia a tela em 4 px em 320/375/390 px e o campo
tinha texto e fundo `rgb(255, 255, 255)`. Depois, os sete tamanhos 320, 375, 390,
767, 768, 1024 e 1440 px passaram: documento e formulário sem rolagem horizontal,
barra do topo dentro da tela e texto visível em campo translúcido.

O fluxo de falha, nova tentativa, sucesso e reinício passou em desktop e celular
com POSTs interceptados antes da rede. Nenhum e-mail foi enviado nesta revisão.
Typecheck, lint sem erros, 18 testes e build de produção aprovados localmente.

Verificação reproduzível nesta sessão:

```sh
node tmp/auditoria-visual-20261027/ajustes-ui.cjs
node tmp/auditoria-visual-20261027/form-ui-check.cjs
npm run typecheck
npm run lint
npm run test
npm run build
```

Os scripts temporários e as capturas ficam no workspace local; o contrato do
formulário e o backend não foram modificados.
