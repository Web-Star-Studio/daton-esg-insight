

# Reorganizar seções em /ambiental e /sobre-nos

## Alteracoes

### 1. ESGAmbiental.tsx - Reordenar e adicionar secao de metricas

**Mover "Infraestrutura de classe mundial." para antes dos cards animados:**
- A secao de infraestrutura (grid 2x2 + header, linhas 732-758) sera movida para logo apos o hero e antes do `<main ref={container}>` dos scroll-stack cards.

**Adicionar secao de metricas (vinda de /sobre-nos) apos os cards animados:**
- Copiar a secao "Metrics" do SobreNos.tsx (fundo escuro `#1a2421`, grid de 4 stats: "6+ Frameworks", "12+ Modulos", "< 48h Implantacao", "99.9% Disponibilidade") para o ESGAmbiental.tsx, posicionando-a entre o fim dos scroll-stack cards e a secao "Performance".

**Aumentar espacamento entre "Performance" e Footer:**
- Adicionar um espacador (ex: `mb-24` ou `py-32`) apos a secao Performance e antes do `<PublicFooter />`.

**Ordem final das secoes em /ambiental:**
```text
Hero
Infraestrutura de classe mundial (grid 2x2)
Cards animados (scroll-stack)
Metricas (barra escura com 4 stats - movida de /sobre-nos)
Performance
[espacamento extra]
Footer
```

### 2. SobreNos.tsx - Remover secao de metricas

- Remover a secao "Metrics" (linhas 413-431) que contem o grid de 4 stats com fundo escuro.
- Aumentar o espacamento entre a secao "Pillars" e a secao "Why Daton" que ficam adjacentes apos a remocao.

## Detalhes tecnicos

**Dados da secao de metricas a copiar:**
- Array inline com 4 itens: `{ value: "6+", label: "Frameworks suportados", desc: "GRI, SASB, CDP, TCFD..." }`, etc.
- Estilo: `bg-[#1a2421]`, texto branco, valores em `text-[#c4fca1]`, grid `grid-cols-2 md:grid-cols-4` com `divide-x divide-white/10`

**Arquivos modificados:**
- `src/pages/ESGAmbiental.tsx` - reordenar secoes e adicionar metricas
- `src/pages/SobreNos.tsx` - remover secao de metricas
