

# Loading Screen com Icone de Arvore Minimalista (fill animation)

## O que sera feito
Criar uma tela de loading centralizada com um icone SVG de arvore minimalista que preenche progressivamente com cor verde musgo (#5A6E4B) enquanto as paginas carregam. Esse loading substituira o fallback atual do `LazyPageWrapper` e do `EnhancedLoading`.

## Detalhes visuais
- Fundo escuro (seguindo o padrao Carbon Emerald do projeto: #0B1210)
- Icone SVG de arvore minimalista centralizado na tela (~80px)
- Animacao de preenchimento de baixo para cima com cor verde musgo (#5A6E4B)
- Efeito suave e elegante, sem texto "Carregando..."

## Arquivos editados

### 1. `src/components/TreeLoadingScreen.tsx` (novo)
- Componente com SVG de arvore minimalista (silhueta simples)
- Animacao CSS de clip-path ou mask que preenche o icone de baixo para cima com verde musgo
- Centralizado vertical e horizontalmente na tela (h-screen, flex center)
- Fundo escuro semi-transparente

### 2. `src/components/EnhancedLoading.tsx`
- Substituir o conteudo do loading padrao pelo novo `TreeLoadingScreen`
- Manter a interface de props para compatibilidade

### 3. `src/components/LazyPageWrapper.tsx`
- Atualizar o fallback do Suspense para usar `TreeLoadingScreen` em vez do `EnhancedLoading`

### 4. `src/components/LoadingFallback.tsx`
- Atualizar o componente principal para tambem usar o `TreeLoadingScreen`

## Detalhes tecnicos
- SVG inline customizado (arvore minimalista com tronco e copa)
- Animacao via CSS `@keyframes` com `clip-path: inset(X% 0 0 0)` para efeito de preenchimento vertical
- Duracao da animacao: ~1.5s em loop
- Sem dependencias externas, apenas CSS + SVG inline

