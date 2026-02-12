

## Remover links de navegacao duplicados da navbar

Os links (Solucoes, Tecnologia, Documentacao, Sobre Nos, Contato) aparecem em dois lugares:

1. **HeimdallNavbar.tsx** - na barra superior fixa (o que aparece na screenshot)
2. **HeroSection.tsx** - no menu hamburguer (que deve ser mantido)

### Alteracao

**Arquivo: `src/components/landing/heimdall/HeimdallNavbar.tsx`**

Remover o bloco `<nav>` inteiro (linhas 46-68) que contem os 5 links de navegacao. A navbar ficara apenas com o logo da Daton, mantendo o layout limpo ja que a navegacao esta acessivel pelo menu hamburguer no hero.

### Correcao de build errors (edge functions)

Alem disso, os erros de build nas edge functions `company-health-score` e `daton-ai-chat` serao corrigidos:

**`company-health-score/index.ts`** (linha 197):
- Casting de `error` como `Error` para resolver `TS18046`

**`daton-ai-chat/index.ts`**:
- Linha 1693: `toolResults` -> usar a variavel correta ja declarada no escopo
- Linhas 1930/1998: `attachmentsContext` -> `attachmentContext` (typo)
- Linhas 1030/1178/1943/2011: Supabase client type mismatch -> adicionar `as any` cast

**`daton-ai-chat/report-actions.ts`** (linhas 131/216/260/330):
- Casting de `error` como `Error`

**`daton-ai-chat/intelligent-suggestions.ts`**:
- Linhas 54/57/63: Adicionar `|| []` fallback para parametros nullable
- Linha 229: Declarar variavel `daysUntilExpiry` ausente

**`daton-ai-chat/tool-executors.ts`**:
- Linha 42: Importar/declarar `getComprehensiveCompanyData`
- Linha 169: Cast de `error`
- Linhas 236/344/408/411: Tipar objetos de summary com `Record<string, number>`
- Linhas 443/447/448: Tipar parametros de callbacks com `any`

