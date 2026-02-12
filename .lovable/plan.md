

## Redirecionar botoes para /auth e proteger rota /demo

### 1. Botoes "INICIAR AGORA" e "EXPLORAR DEMONSTRACAO" devem levar para /auth

Atualmente esses botoes navegam para rotas erradas:

| Arquivo | Botao | Destino atual | Novo destino |
|---|---|---|---|
| `HeroSection.tsx` (linha 319) | INICIAR AGORA | `/ambiental` | `/auth` |
| `ESGAmbiental.tsx` (linha 520) | EXPLORAR DEMONSTRACAO | `/demo` | `/auth` |
| `Technology.tsx` (linha 462) | EXPLORAR DEMONSTRACAO | `/demo` | `/auth` |
| `SobreNos.tsx` (linha 269) | EXPLORAR DEMONSTRACAO | `/demo` | `/auth` |

Todos terao o `onClick` alterado para `navigate('/auth')`.

### 2. Proteger a rota /demo para usuarios logados nao aprovados

Atualmente a rota `/demo` em `App.tsx` e publica (qualquer visitante acessa). Ela deve ser acessivel apenas por usuarios autenticados que ainda nao foram aprovados pelo admin.

Sera criado um wrapper `DemoRoute` que:
- Verifica se o usuario esta autenticado (senao, redireciona para `/auth`)
- Verifica se o usuario **nao** esta aprovado (se ja estiver aprovado, redireciona para `/` pois ja tem acesso completo)
- Se autenticado e nao aprovado, renderiza o `DemoProvider` + `DemoLayout` normalmente

Isso sera feito diretamente no `App.tsx`, envolvendo a rota `/demo` com um componente de guarda que usa o `useAuth` do contexto existente.

### Arquivos modificados

- `src/components/landing/heimdall/HeroSection.tsx` -- alterar navigate de `/ambiental` para `/auth`
- `src/pages/ESGAmbiental.tsx` -- alterar navigate de `/demo` para `/auth`
- `src/pages/Technology.tsx` -- alterar navigate de `/demo` para `/auth`
- `src/pages/SobreNos.tsx` -- alterar navigate de `/demo` para `/auth`
- `src/App.tsx` -- envolver rota `/demo` com guarda de autenticacao (usuario logado + nao aprovado)

