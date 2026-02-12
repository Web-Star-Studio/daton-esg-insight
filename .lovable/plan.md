

# Grid de Socios na Secao Worton

## O que muda
A secao "Uma empresa Worton" sera reorganizada em um layout lado a lado: o conjunto texto + logo Worton ficara a esquerda (30% da largura) e um grid 2x2 com as fotos dos 4 socios ficara a direita (70% da largura).

## Layout

```text
+----------- max-w-7xl -----------+
|  30%          |      70%        |
| "Uma empresa" |  [foto] [foto]  |
|  [Worton logo] |  [foto] [foto]  |
|               |                 |
+---------------------------------+
```

- As 4 fotos serao exibidas em um grid 2x2 com gap entre elas
- Todas as imagens terao filtro CSS `grayscale(100%)` para preto e branco
- As fotos terao bordas arredondadas e aspect-ratio quadrado com `object-cover`
- Em telas menores (mobile), o layout empilhara verticalmente: logo em cima, grid embaixo

## Detalhes Tecnicos

### Assets
- Copiar as 4 imagens dos socios para `src/assets/`:
  - `socio-1.jpeg` (WhatsApp_Image_2026-02-12_at_18.26.57.jpeg)
  - `socio-2.jpeg` (WhatsApp_Image_2026-02-12_at_18.21.21.jpeg)
  - `socio-3.jpeg` (WhatsApp_Image_2026-02-12_at_18.21.21_1.jpeg)
  - `socio-4.jpeg` (WhatsApp_Image_2026-02-12_at_18.21.03.jpeg)

### Arquivo editado
- `src/pages/SobreNos.tsx`

### Mudancas no JSX
- Substituir o `flex justify-center` atual por `flex flex-col md:flex-row items-center`
- Lado esquerdo (30%): manter o bloco "Uma empresa" + logo Worton com `md:w-[30%]`
- Lado direito (70%): novo `md:w-[70%]` contendo um `grid grid-cols-2 gap-4`
- Cada celula do grid tera a foto do socio com `className="grayscale"` do Tailwind, `rounded-xl`, e `object-cover` com aspect-ratio quadrado

### O que nao muda
- O fundo `bg-[#1a2421]` da secao
- O link da Worton para `https://www.worton.com.br/`
- O texto "Uma empresa" com seu posicionamento
- O filtro de inversao do logo Worton
