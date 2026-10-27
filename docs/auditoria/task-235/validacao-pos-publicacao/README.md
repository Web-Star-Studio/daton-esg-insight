# Validação após o Publish do PR 110

Em 27/10/2026, o domínio `https://daton.com.br` já serve o formulário enxuto: cinco campos de dados, três obrigatórios, WhatsApp e mensagem opcionais. Bundle observado: `index-C04l_NKB.js`.

- 13 rotas públicas abertas em desktop e celular (26 aberturas), sem erro de execução, imagem quebrada, falha de recurso GET ou rolagem horizontal.
- Formulário em 320, 375, 768, 1024 e 1440 px: validação, pedido mínimo, falha, preservação de dados, retry com mesmo identificador, sucesso e reinício aprovados com respostas simuladas.
- Sete larguras para Sobre Nós e Contato: contraste, largura e botão dentro da tela aprovados.
- Soluções abre `/ambiental`, com os cinco cartões em cascata; retorno ao topo e catálogo preservados em desktop/celular.
- Busca da FAQ, resultado vazio, limpar e respostas expansíveis; 151 perguntas da Documentação; destinos externos dos CTAs e redirecionamentos aprovados.
- Cloud acessível: OPTIONS 200 e GET 405, sem POST real. Todos os POSTs do navegador foram interceptados; zero e-mails enviados.

## Pendência visual encontrada e corrigida

Os prints ampliados revelaram que a barra de contato cobria o subtítulo do hero de Social e Governança em telas menores. O teste geométrico reproduziu a sobreposição em 14 de 18 casos, incluindo tablet, celular e paisagem.

O posicionamento absoluto do texto e da barra, ambos em `bottom: 10vh`, já existia no commit de layout `c8a70d58b`, anterior à auditoria de copy. A correção coloca os dois blocos em fluxo vertical com espaçamento até 1279 px, permitindo que o hero cresça quando o menu abre. A composição ampla a partir de 1280 px mantém o posicionamento anterior. Copy, fotos, cores, destinos e conteúdo não mudaram.

Após a correção: 18/18 casos sem interseção, sem overflow e com Escape fechando o menu. Os retângulos do texto e da barra em 1440 px foram comparados com o publicado. Testes unitários (30), tipos, lint e build aprovados; quatro avisos de Fast Refresh já existentes.

| Página | Publicado antes da correção | Correção no build |
| --- | --- | --- |
| Social | ![Social antes](hero-antes-social-375.webp) | ![Social corrigido](hero-depois-social-375.webp) |
| Governança | ![Governança antes](hero-antes-governanca-375.webp) | ![Governança corrigido](hero-depois-governanca-375.webp) |

A função comercial e o formulário não foram alterados nesta correção. A publicação do ajuste visual será feita manualmente no Lovable; os testes do PR não comprovam que esse ajuste já está no domínio.
