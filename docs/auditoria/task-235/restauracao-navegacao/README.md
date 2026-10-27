# Task 235 - restauração da navegação pública

A limpeza da landing de 22/10 (5d5ada6a, incorporada em bc3e4219) mudou a página aberta por Soluções e removeu o retorno ao topo. Esta correção recupera esses comportamentos sem redesenhar as páginas nem alterar a copy.

- Os quatro menus rápidos e o rodapé público levam Soluções a `/ambiental`, com os cinco cartões em cascata. O catálogo continua em `/funcionalidades`.
- `ScrollToTop`, dentro do Suspense, aplica a rolagem depois que a página de destino está disponível. Respeita âncoras, trata fragmentos inválidos e conserva a posição quando só a query muda.
- CI de build usa configuração pública fictícia apenas para compilar; não publica. A proteção que recusa publicação sem configuração real do Lovable permanece no Vite.
- O arquivo `.lovable/plan.md`, criado automaticamente pela consulta em modo plano, é removido. Nenhum conteúdo de aplicação foi alterado por esse plano.

## Reprodução e resultado

Playwright headless, contextos novos em 1440×1000 e 375×812. O teste abre o menu da home e escolhe Soluções; confere cinco cartões sticky; faz Sobre Nós → Termos de Uso → Sobre Nós pelo rodapé com a página já carregada; confere o catálogo diretamente.

| Verificação | Antes desktop / celular | Depois desktop / celular |
| --- | --- | --- |
| Destino de Soluções | /funcionalidades / /funcionalidades | /ambiental / /ambiental |
| Cartões em cascata no destino | 0 / 0 | 5 / 5 |
| Posição após voltar a Sobre Nós | 1330 / 2798 px | 0 / 0 px |
| Catálogo acessível | sim / sim | sim / sim |

Resultados brutos: [antes](antes.json) e [depois](depois.json). Capturas headless examinadas na sessão. O teste foi executado antes da alteração e saiu com código 1; depois da correção saiu com código 0.

## Validação

- TypeScript e ESLint aprovados (quatro avisos herdados nos componentes UI).
- 13 testes com cobertura aprovados; quatro novos cobrem o comportamento real do roteador com rolagem, query, âncora codificada e âncora inválida.
- Build de produção aprovado com valores públicos fictícios, como no CI; build sem configuração continua sendo recusado.
- Publicação e envio comercial exigem verificação no domínio real. O teste de e-mail foi autorizado exclusivamente para `joao@webstar.studio`, sem cópia à caixa comercial. Este PR não muda destinatário, código ou configuração da função comercial.
