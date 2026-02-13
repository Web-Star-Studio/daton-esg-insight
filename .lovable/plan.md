
## Correcoes de Responsividade: 3 Problemas Visuais

### Problema 1: Botao sobre o texto (Landing Hero)
**Arquivo:** `src/components/landing/heimdall/HeroSection.tsx`

Na versao mobile, o texto do subtitulo e a action bar (botao "INICIAR AGORA") estao muito proximos ou sobrepostos. O `gap-6` no container flex nao e suficiente.

**Correcao:**
- Aumentar o gap no container mobile para `gap-8`
- Adicionar `pb-4` no bloco de texto para criar mais espaco antes da action bar
- Garantir que a action bar ocupe `w-full` em mobile para nao competir por espaco horizontal

### Problema 2: Texto dos cards cortado (ESG Ambiental - Cards com scroll)
**Arquivo:** `src/pages/ESGAmbiental.tsx`

O componente `Card` usa `height: "40%"` para o painel de conteudo em mobile (linha 385). Com 40% de 90vh, ha apenas ~36vh para titulo, descricao, features e botao, insuficiente para textos longos como o do "ESG Social".

**Correcao:**
- Aumentar a altura do painel de conteudo mobile de `40%` para `55%`
- Reduzir a altura da imagem de fundo de `60%` para `45%` (linha 365)
- Adicionar `overflow-y-auto` no container de texto para permitir scroll quando necessario
- Reduzir o `pt-16` para `pt-6` em mobile para economizar espaco vertical

### Problema 3: Hamburger menu nao centralizado (Documentacao)
**Arquivo:** `src/pages/Documentacao.tsx`

A action bar esta posicionada com `position: absolute; bottom: 4vh; right: max(4vw, 2rem)`. Em mobile, deveria estar centralizada horizontalmente.

**Correcao:**
- Em mobile (< 768px), alterar o posicionamento para: `left: 50%; transform: translateX(-50%); right: auto`
- Usar classes responsivas ou media query no CSS para aplicar centralizacao
- Aplicar a mesma correcao na action bar do `SobreNos.tsx` e `HeroSection.tsx` para consistencia

### Detalhes Tecnicos

**HeroSection.tsx (linhas 164, 206-208):**
- Alterar `gap-6` para `gap-8 md:gap-6` no container flex
- Na action bar, adicionar classes `w-full md:w-fit` para expandir em mobile

**ESGAmbiental.tsx (linhas 358-431):**
- Card mobile: mudar height do content de `40%` para `55%`
- Image height: de `60%` para `45%`
- Container de texto: adicionar `overflow-y-auto` e reduzir padding top

**Documentacao.tsx (linhas 163-182):**
- Substituir posicionamento absoluto right-aligned por centralizacao em mobile
- Usar classes CSS: `left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[max(4vw,2rem)]`
- Aplicar mesma logica em SobreNos.tsx e HeroSection.tsx para a action bar

**Arquivos a editar:**
1. `src/components/landing/heimdall/HeroSection.tsx`
2. `src/pages/ESGAmbiental.tsx`
3. `src/pages/Documentacao.tsx`
4. `src/pages/SobreNos.tsx` (consistencia da action bar)
