# Revisão antes do merge — PR 105

Autorização em 26/10/2026: corrigir o CI e concluir o merge. O critério editorial continua sendo a visão integral do MasterProduct como promessa comercial.

## CI

- Adicionados `test:coverage` e o provider V8, com Vitest e provider fixados na mesma versão 3.2.7.
- Lockfile sincronizado com o manifesto atual da landing; referências a dependências já removidas do manifesto deixam de ser instaladas.
- Lint bloqueante para `src/` e configurações da landing. Arquivos Deno legados de `supabase/` permanecem intactos e fora desse comando.
- Typecheck explícito dos projetos app e Node, incluindo a configuração do Vitest.
- Uma execução dos três testes existentes com cobertura e relatórios de todos os fontes; não foi acrescentada uma meta artificial de percentual.
- Relatórios JSON/LCOV/HTML publicados como artefato do próprio GitHub, com falha se o diretório não existir; substitui o uploader externo do Codecov.
- Node 22 nos dois jobs; o build depende do sucesso do job de verificação.
- PDF declarado binário no Git; a verificação de whitespace passa a avaliar conteúdo textual, preservando o PDF.

## Observações da revisão automática

| Observação | Resolução |
| --- | --- |
| Inventário deveria voltar a depender da implantação atual | Não aplicada. Contraria a direção explícita de marketing: esta resposta apresenta o ciclo final do MasterProduct. As regras de acesso são preservadas nos Termos e na ajuda de permissões. |
| Termos devem preservar escopo e autorização | Aplicada. A descrição mantém a proposta integrada e explicita o escopo contratado e as permissões de acesso. |
| Links do simulador teriam mudado neste PR | Não procede em relação à base deste PR. Essa correção entrou no PR 104. Os destinos de `Funcionalidades.tsx` são iguais aos da main `3de3f70f`. |
| Objetivos de recuperação não devem parecer comprovados | Aplicada no comparativo e nas duas FAQs. Objetivos ficam sujeitos a definição e validação na política e no contrato do ambiente, sem números ou SLA inventados. |
| SMART não deve prometer validação automática dos critérios | Aplicada nas duas FAQs. A resposta descreve o registro dos critérios e sua rastreabilidade. |
| Esclarecer a atualização dos painéis | Aplicada nas duas FAQs. A atualização acompanha os registros e a frequência definida para cada integração. |
| Espaços no final de linhas do comparativo | Corrigidos com parágrafos separados. |
| Resposta do vídeo precisa indicar disponibilidade | Aplicada nas duas FAQs. Informa que esta página ainda não disponibiliza vídeo e aponta às páginas de soluções e à ajuda. |

Os oito itens foram avaliados individualmente. As correções preservam IDs, perguntas, as 146 respostas comuns idênticas, o catálogo, a hierarquia e o comportamento. O relatório PDF de 22 páginas permanece como retrato da proposta comercial apresentada para aprovação; este complemento registra os refinamentos finais.
