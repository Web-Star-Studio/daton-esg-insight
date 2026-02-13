

## Revisao de Responsividade - Todas as Paginas da Landing Page

### Resumo

Revisao completa de responsividade em **8 arquivos** cobrindo todas as paginas publicas: Landing (Hero), Sobre Nos, Funcionalidades, Contato, Documentacao, FAQ, Privacidade, Termos e componentes compartilhados (PublicFooter, HeimdallNavbar). O objetivo e garantir que todas funcionem perfeitamente nos 6 breakpoints obrigatorios (320px, 480px, 768px, 1024px, 1366px, 1920px).

---

### Problemas Identificados por Pagina

**1. HeroSection.tsx (Landing)**
- O bloco de titulo (bottom-left) e a action bar (bottom-right) se sobrepoem em telas menores que 768px pois ambos usam `position: absolute; bottom: 10vh`
- O `<style>` inline com media queries usa seletores CSS por atributo (`div[style*="bottom: 10vh"]`) que sao frageis e nao funcionam corretamente
- Step bar (progress indicators) no top-right pode ficar muito comprimida em mobile

**Correcao:**
- Em telas <= 768px, empilhar titulo e action bar verticalmente (bottom stacked)
- Substituir o bloco `<style>` inline por classes condicionais ou media queries mais robustas no heimdall.css
- Ajustar padding da section para `padding: 100px 1rem 2rem` em mobile
- Action bar e titulo devem usar `position: relative` em mobile para fluxo natural

**2. SobreNos.tsx**
- Hero section tem o mesmo problema de sobreposicao titulo/action bar
- Secao "Why Daton" usa `lg:grid-cols-6` com `lg:col-span-2` mas a classe e sobrescrita por `md:col-span-1`, causando layout inconsistente entre 768px-1024px
- Grid de socios (2x2) com `aspect-square` no container `md:w-[63%]` fica muito grande/pequeno sem limites
- Secao Worton: `md:flex-row` sem wrap pode causar overflow em tablets

**Correcao:**
- Aplicar o mesmo fix do hero (empilhar em mobile)
- Corrigir grid "Why Daton" para usar breakpoints corretos: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Grid de socios: adicionar `max-w-[500px] mx-auto` em mobile, limitar aspect-ratio
- Padding das secoes: reduzir de `py-24 px-6` para `py-12 px-4` em mobile

**3. Contato.tsx**
- Layout hero usa `md:flex-row` com titulo (58%) e formulario (39%), que funciona em desktop mas em mobile o formulario pode ficar cortado
- Padding inline usa `max(4vw, 2rem)` que e ok, mas `paddingTop: 156px` e excessivo em mobile
- Inputs com `sm:grid-cols-2` estao corretos

**Correcao:**
- Reduzir paddingTop para `clamp(100px, 15vw, 156px)`
- Garantir que o formulario tenha `w-full` em mobile sem `md:max-w-[39%]` interferindo
- Ajustar min-height do hero para `min-height: auto` em mobile com `md:min-h-[100dvh]`

**4. Funcionalidades.tsx**
- Header nav com `hidden md:flex` esta ok mas falta menu hamburger para mobile
- Hero stat cards com `sm:grid-cols-3` podem ficar apertadas em 320px
- CTA section no final com `md:flex-row` esta ok
- Footer proprio (nao usa PublicFooter) com `md:grid-cols-4` precisa de ajuste para mobile

**Correcao:**
- Adicionar botao hamburger visivel em mobile no header
- HeroStat: ajustar para `grid-cols-1 sm:grid-cols-3` com padding reduzido
- Garantir que botoes no CTA tenham `w-full` em mobile

**5. Documentacao.tsx**
- Sidebar com `hidden md:block` esta ok
- Hero com `minHeight: 50vh` e padding fixo precisa de ajuste mobile
- Action bar no hero (bottom-right) pode ficar cortada em mobile
- Content area com `px-6 py-16` precisa de reducao mobile

**Correcao:**
- Reduzir padding do hero em mobile
- Action bar: reposicionar para centro/bottom em mobile
- Content: `px-4 py-8 md:px-6 md:py-16`
- FAQ items: garantir touch targets de 44px nos botoes

**6. FAQ.tsx**
- Help section com `lg:grid-cols-4` pode criar botoes muito pequenos em mobile
- Sidebar `hidden lg:block` esta ok
- Falta de padding top adequado

**Correcao:**
- Help section: `grid-cols-2 lg:grid-cols-4` para mobile ter 2 colunas
- Botoes de ajuda: garantir `min-h-[44px]`

**7. Privacidade.tsx e Termos.tsx**
- Sao simples e ja usam `px-4 sm:px-6 lg:px-8`, relativamente responsivas
- Falta HeimdallNavbar e PublicFooter para consistencia visual
- Texto pode ser muito largo em desktop (max-w-4xl e ok)

**Correcao:**
- Adicionar HeimdallNavbar e PublicFooter para manter identidade visual
- Ajustar h1 para `text-2xl sm:text-3xl`
- Adicionar `pt-24` para compensar o navbar

**8. PublicFooter.tsx**
- Grid `md:grid-cols-4` colapsa para 1 coluna em mobile, ok
- Links tem touch targets adequados com `space-y-2`
- Precisa apenas de leve ajuste de padding

**Correcao:**
- Footer grid: `grid-cols-2 md:grid-cols-4` para mobile ter 2 colunas (logo full width)
- Padding: ja usa `px-4 md:px-8`, ok

**9. HeimdallNavbar.tsx**
- Logo com `height: 52px` pode ser grande demais em mobile 320px
- Padding `2rem max(4vw, 2rem)` ok

**Correcao:**
- Logo height: `clamp(36px, 8vw, 52px)`

---

### Detalhes Tecnicos

**Arquivos a editar:**
1. `src/components/landing/heimdall/heimdall.css` - adicionar media queries para hero mobile layout
2. `src/components/landing/heimdall/HeroSection.tsx` - fix mobile layout stacking
3. `src/components/landing/heimdall/HeimdallNavbar.tsx` - responsive logo
4. `src/components/landing/heimdall/PublicFooter.tsx` - 2-col mobile grid
5. `src/pages/SobreNos.tsx` - fix hero overlap + grid corrections
6. `src/pages/Contato.tsx` - responsive padding + mobile layout
7. `src/pages/Funcionalidades.tsx` - mobile hamburger + responsive adjustments
8. `src/pages/Documentacao.tsx` - mobile hero + content padding
9. `src/pages/Privacidade.tsx` - add navbar/footer + responsive text
10. `src/pages/Termos.tsx` - add navbar/footer + responsive text
11. `src/pages/FAQ.tsx` - help section grid + touch targets

**Abordagem principal:**
- Usar classes Tailwind responsivas (nao inline styles) sempre que possivel
- Substituir `position: absolute` por layout flexbox em mobile para evitar sobreposicoes
- Touch targets minimos de 44x44px em todos os botoes
- Texto base 16px em mobile (ja e o padrao do Tailwind)
- Testar mentalmente cada breakpoint: 320, 480, 768, 1024, 1366, 1920

