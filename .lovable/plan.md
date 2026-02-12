

## Expansao dos cards "por dentro" do container

### Problema atual

Os cards usam `scale-[1.02]` e `scale-[0.97]` para o efeito hover. Isso faz os cards expandirem **para fora** do container (overflow), em vez de redistribuir o espaco internamente.

### Solucao

Trocar a abordagem de `scale` por uma redistribuicao real do grid usando `col-span` e `row-span` dinamicos via Framer Motion `layout`. O card ativo ocupa mais colunas/linhas do grid, enquanto os outros encolhem proporcionalmente -- tudo dentro do container.

**Abordagem**: usar CSS Grid com `grid-template-columns` e `grid-template-rows` controlados por estado, em vez de transforms.

### Detalhes tecnicos

**Arquivo**: `src/pages/SobreNos.tsx`, linhas 440-481

1. **Remover scale transforms**: eliminar `scale-[1.02]` e `scale-[0.97]` dos cards
2. **Container com altura fixa**: definir uma altura minima fixa no container do grid para que ele nao "pule" ao expandir/contrair cards
3. **Grid dinamico**: quando um card e hovered, ele ganha `lg:col-span-3` (ou `lg:col-span-4`) e os cards da mesma linha encolhem para `lg:col-span-1`. Isso e feito condicionalmente:
   - Card ativo: span maior (ex: `col-span-4`) 
   - Cards na mesma linha: span menor (ex: `col-span-1`)
   - Cards na outra linha: mantem `col-span-2`
4. **Alternativa mais simples (recomendada)**: manter todos com `col-span-2` mas usar `flex-grow` dentro de um container flex por linha, onde o card hovered recebe `flex-grow: 2` e os outros `flex-grow: 0.5`, redistribuindo espaco organicamente
5. **Framer Motion `layout`**: ja esta presente, garante animacao suave na redistribuicao
6. **Overflow hidden** no container pai para garantir que nada vaze
7. **Efeito nos inativos**: em vez de scale, reduzir apenas opacidade (`opacity-60`) e padding interno

### Implementacao concreta (abordagem flex por linha)

Dividir os 6 cards em 2 linhas de 3. Cada linha e um `div flex`. O card hovered ganha `flex: 2`, os demais `flex: 0.7`. Transicao via `transition-all duration-300`. Resultado: o card expande preenchendo mais espaco horizontal dentro da linha, empurrando os vizinhos -- tudo contido.

```text
Sem hover:
[====Card 1====] [====Card 2====] [====Card 3====]
[====Card 4====] [====Card 5====] [====Card 6====]

Com hover no Card 2:
[==C1==] [========Card 2 (expandido)========] [==C3==]
[====Card 4====] [====Card 5====] [====Card 6====]
```

### Responsividade

- Mobile: stack vertical, sem efeito de redistribuicao (apenas reveal do details)
- Tablet: 2 colunas com flex
- Desktop: 3 colunas por linha com flex dinamico

