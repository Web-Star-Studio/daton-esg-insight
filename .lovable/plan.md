
# Adicionar destaque "Uma empresa Worton" na pagina /sobre-nos

## O que sera feito

Adicionar uma secao de destaque entre a secao "Privacy" (Seus dados, sua soberania) e o Footer, informando que a Daton e uma empresa do grupo Worton. A secao tera um design elegante e minimalista, com o logo do Worton (imagem enviada) e um texto curto.

## Design da secao

- Fundo escuro (`bg-[#1a2421]`) para contrastar com a secao clara acima e o footer
- Layout centralizado com o logo Worton (filtro `brightness(0) invert(1)` para ficar branco) ao lado do texto "Daton e uma empresa"
- Texto em branco/cinza claro, tipografia elegante
- Padding generoso (`py-16`) para dar respiro

## Detalhes tecnicos

**Arquivo modificado:** `src/pages/SobreNos.tsx`

1. Copiar a imagem do logo Worton para `src/assets/worton-logo.png`
2. Importar o logo no componente
3. Inserir nova secao entre a secao "Privacy" (linha 487) e o `<PublicFooter />` (linha 492):

```tsx
{/* --- WORTON --- */}
<section className="py-16 px-6 bg-[#1a2421]">
  <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center gap-4">
    <p className="text-white/60 text-sm uppercase tracking-widest font-mono">Uma empresa</p>
    <img
      src={wortonLogo}
      alt="Worton"
      className="h-10"
      style={{ filter: "brightness(0) invert(1)" }}
    />
  </div>
</section>
```
