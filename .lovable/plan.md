

## Bento Grid interativo para "Por que empresas escolhem a Daton"

### O que sera feito

Transformar o grid atual de 6 cards uniformes em um **bento grid** com layout assimetrico. Ao fazer hover em um card, ele **expande** mostrando mais detalhes, enquanto os outros **encolhem** suavemente, criando um efeito de foco interativo.

### Layout do Bento Grid

```text
Desktop (sem hover):
+------------------+----------+----------+
|                  |          |          |
|   Card 1 (2col) | Card 2   | Card 3   |
|                  |          |          |
+----------+------+----------+----------+
|          |                  |          |
| Card 4   |   Card 5 (2col) | Card 6   |
|          |                  |          |
+----------+------------------+----------+
```

Ao hover em qualquer card:
- O card ativo expande (escala sutil + mais conteudo visivel)
- Os outros cards reduzem opacidade e escala levemente
- Transicao suave com CSS transitions (~300ms)

### Detalhes tecnicos

**Arquivo**: `src/pages/SobreNos.tsx` (linhas 432-454)

1. **Adicionar estado** `hoveredIdx` com `useState<number | null>(null)`
2. **Expandir os dados** dos cards com um campo extra `details` para conteudo adicional exibido no hover
3. **Substituir o grid uniforme** por um layout bento usando `grid-cols-6` com spans variaveis:
   - Cards 1 e 5: `col-span-3` (maiores)
   - Cards 2, 3, 4, 6: `col-span-2` (menores) -- ajustado para preencher 6 colunas por linha
   - Alternativa: cards 1 e 5 com `col-span-2`, outros com `col-span-1` em grid de 4 colunas
4. **Efeito hover**:
   - Card ativo: `scale-[1.02]`, `shadow-lg`, exibe paragrafo `details`
   - Cards inativos: `opacity-60`, `scale-[0.97]`
   - Sem hover ativo: todos normais
5. **Responsividade**:
   - Mobile: stack vertical (`col-span-full`)
   - Tablet: 2 colunas
   - Desktop: bento grid completo

### Resultado esperado

Um grid visualmente dinamico onde o usuario "explora" cada diferencial passando o mouse, com transicoes fluidas e conteudo extra revelado sob demanda.

