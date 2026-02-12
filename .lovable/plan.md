

## Corrigir tamanho dos cards "Seguranca enterprise" e "Conformidade sem complicacao"

### Problema

Os cards "Conformidade sem complicacao" e "Seguranca enterprise" estao com `lg:col-span-1` no grid de 6 colunas, ficando muito estreitos comparados aos demais.

### Solucao

Redistribuir os spans para que todos os cards tenham tamanho adequado. Nova distribuicao:

```text
Linha 1:
+------------------+------------------+
|  Card 1 (3col)   |  Card 2 (3col)   |
+----------+-------+------+-----------+
Linha 2:
+----------+----------+----------+
| Card 3   | Card 4   | Card 5   |
| (2col)   | (2col)   | (2col)   |
+----------+----------+----------+
Linha 3 (card 6 sozinho, centralizado):
      +------------------+
      | Card 6 (2col)    |  -- ou col-span-6 para largura total
      +------------------+
```

**Alternativa mais equilibrada** (6 cards em 2 linhas de 3):
- Linha 1: Card 1 (2col), Card 2 (2col), Card 3 (2col)
- Linha 2: Card 4 (2col), Card 5 (2col), Card 6 (2col)

Todos iguais com `lg:col-span-2`, preenchendo as 6 colunas uniformemente mas mantendo o efeito hover.

### Detalhe tecnico

**Arquivo**: `src/pages/SobreNos.tsx`, linhas 442-447

Alterar os spans:
- "Conformidade sem complicacao": de `lg:col-span-1` para `lg:col-span-2`
- "Seguranca enterprise": de `lg:col-span-1` para `lg:col-span-2`
- "Tudo em um so lugar": de `lg:col-span-3` para `lg:col-span-2`
- "Suporte humano": de `lg:col-span-3` para `lg:col-span-2`

Resultado: todos os 6 cards com `lg:col-span-2`, formando 2 linhas equilibradas de 3 cards cada, mantendo o efeito bento hover intacto.

