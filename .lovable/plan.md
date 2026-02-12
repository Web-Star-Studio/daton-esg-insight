

## Reorganizar links do Footer em categorias

Atualmente todos os 7 links estao sob uma unica coluna "Navegacao". A proposta e separa-los em 3 colunas tematicas, criando um footer mais organizado e profissional.

### Nova estrutura

O grid passara de `md:grid-cols-3` para `md:grid-cols-4`, com a seguinte distribuicao:

| Coluna 1 (span 1) | Coluna 2 | Coluna 3 | Coluna 4 |
|---|---|---|---|
| Logo + descricao | **Plataforma** | **Empresa** | **Legal** |
| | Solucoes | Sobre Nos | Privacidade |
| | Tecnologia | Contato | Termos de Uso |
| | Documentacao | | |

### Detalhes tecnicos

**Arquivo: `src/components/landing/heimdall/PublicFooter.tsx`**

1. Alterar o grid de `md:grid-cols-3` para `md:grid-cols-4`, e a coluna do logo de `md:col-span-2` para manter apenas `md:col-span-1`.
2. Substituir a coluna unica "Navegacao" por 3 colunas:
   - **Plataforma**: Solucoes (`/funcionalidades`), Tecnologia (`/tecnologia`), Documentacao (`/documentacao`)
   - **Empresa**: Sobre Nos (`/sobre-nos`), Contato (`/contato`)
   - **Legal**: Privacidade (`/privacidade`), Termos de Uso (`/termos`)
3. Manter o estilo visual identico (mesmas classes de tipografia, cores e espacamento).

Nenhum outro arquivo precisa ser alterado.

