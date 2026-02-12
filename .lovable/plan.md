

# Exibir bio dos socios no hover

## Comportamento
Quando o hover acontece em uma imagem, alem de ela expandir, um overlay escuro semitransparente aparece sobre a imagem com o nome do socio em destaque e o texto da bio. O texto aparece com uma animacao suave (fade in). Quando nao ha hover, nenhum texto e visivel.

## Detalhes tecnicos

### Arquivo editado
- `src/pages/SobreNos.tsx`

### Mudancas

1. **Criar array de dados dos socios** com nome e bio para cada um dos 4 socios, substituindo o array simples de imagens por um array de objetos:

```tsx
const socios = [
  { src: socio1, name: "Felipe Antunes", bio: "Empreendedor multidisciplinar com mais de 15 anos..." },
  { src: socio2, name: "Cristiano Braga", bio: "Advogado Especializado em Propriedade Intelectual..." },
  { src: socio3, name: "Bruno de Rosso", bio: "Engenheiro Mecanico, Mestre em engenharia..." },
  { src: socio4, name: "Guilherme Haygert", bio: "Secretario Municipal do Meio Ambiente..." },
]
```

2. **Adicionar overlay de texto** dentro de cada div wrapper da imagem. O overlay sera um div posicionado absolutamente sobre a imagem, com fundo gradiente escuro (de baixo para cima) para legibilidade. O texto so aparece quando `hoveredIdx === idx`.

3. **Estrutura do overlay**:
   - Container com `position: relative` no wrapper
   - Overlay com `absolute inset-0` e gradiente `bg-gradient-to-t from-black/80 via-black/40 to-transparent`
   - Nome do socio em texto grande e bold
   - Bio em texto menor com scroll se necessario
   - Transicao de opacidade: `opacity-0` quando nao hovereado, `opacity-100` quando hovereado, com `transition-opacity duration-300`

4. **Textos completos** dos 4 socios conforme fornecidos pelo usuario serao incluidos integralmente.

### O que nao muda
- Logica de grid `3fr/1fr`
- Efeito grayscale nas imagens
- Tamanho do container (63%)
- Animacao de transicao do grid

