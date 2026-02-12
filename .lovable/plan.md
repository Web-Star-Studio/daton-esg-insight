

## Atualizar links do Footer para espelhar o menu hamburger

### O que muda

O footer atual (`PublicFooter.tsx`) tem duas colunas de links:
- "Areas ESG": Ambiental, Social, Governanca
- "Empresa": Sobre Nos, Contato, Privacidade, Termos

O menu hamburger (action bar) tem estes links:
- Solucoes (/funcionalidades)
- Tecnologia (/tecnologia)
- Documentacao (/documentacao)
- Sobre Nos (/sobre-nos)
- Contato (/contato)

### Correcao

**Arquivo: `src/components/landing/heimdall/PublicFooter.tsx`**

Substituir as duas colunas de links atuais por uma unica coluna "Navegacao" com exatamente os mesmos links do menu hamburger:

| Link | Rota |
|---|---|
| Solucoes | /funcionalidades |
| Tecnologia | /tecnologia |
| Documentacao | /documentacao |
| Sobre Nos | /sobre-nos |
| Contato | /contato |

A estrutura do footer permanece com o logo e descricao a esquerda, e a coluna de links a direita. O grid passara de 4 colunas para 3 (logo ocupa 2, links ocupa 1).

### Detalhes tecnicos

- Remover a coluna "Areas ESG" (Ambiental, Social, Governanca)
- Remover a coluna "Empresa" (Sobre Nos, Contato, Privacidade, Termos)
- Adicionar uma coluna "Navegacao" com os 5 links do menu hamburger
- Ajustar o grid de `md:grid-cols-4` para `md:grid-cols-3`

