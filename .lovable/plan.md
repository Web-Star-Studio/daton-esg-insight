

## Substituir imagem na secao "Uma plataforma, todos os pilares"

### O que sera feito

Substituir o visual placeholder atual (grid de cards com fundo escuro e icones) pela imagem enviada (cubos de madeira com icones ESG verdes).

### Passos

1. **Copiar a imagem** enviada para `src/assets/pilares-esg.png`
2. **Importar a imagem** no componente `SobreNos.tsx`
3. **Substituir o bloco visual** (linhas 400-432 aproximadamente) - remover o `div` com grid de cards escuros e colocar um `img` com a nova imagem, mantendo o `rounded-3xl` e aspect ratio adequado

### Detalhe tecnico

O bloco atual (linhas 400-432) contem um grid de 4 cards com icones dentro de um container escuro. Sera substituido por:

```tsx
<div className="relative">
  <img 
    src={pilaresImg} 
    alt="Pilares ESG" 
    className="w-full rounded-3xl object-cover shadow-lg"
  />
</div>
```

### Arquivos afetados

- `src/assets/pilares-esg.png` (novo - copia da imagem enviada)
- `src/pages/SobreNos.tsx` (editar import + substituir bloco visual)

