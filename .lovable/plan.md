

## Modulos dinamicos: demo com tudo + controle no painel admin

### Contexto atual

- A visibilidade dos modulos e controlada por um arquivo estatico (`src/config/enabledModules.ts`) com valores `true/false` hardcoded.
- A sidebar (`AppSidebar.tsx`) usa `DISABLED_SECTION_IDS` e `DISABLED_ESG_CATEGORY_IDS` para filtrar modulos - sem distincao entre demo e live.
- A versao demo exibe os mesmos modulos filtrados que a versao live.

### Solucao

Mover o controle de modulos para o banco de dados e criar uma UI administrativa para gerencia-los.

#### 1. Criar tabela `platform_module_settings` no Supabase

```text
platform_module_settings
- id: uuid (PK)
- module_key: text (unique) -- ex: 'financial', 'esgGovernance'
- module_name: text -- nome de exibicao
- enabled_live: boolean (default false) -- visivel na versao live
- enabled_demo: boolean (default true) -- visivel na versao demo
- updated_at: timestamptz
- updated_by_user_id: uuid (FK profiles)
```

Seed com todos os modulos atuais, migrando os valores do `enabledModules.ts`:

| module_key | enabled_live | enabled_demo |
|---|---|---|
| financial | false | true |
| dataReports | false | true |
| esgEnvironmental | true | true |
| esgGovernance | false | true |
| esgSocial | true | true |
| quality | true | true |
| suppliers | true | true |
| settings | true | true |
| help | true | true |
| esgManagement | true | true |

RLS: somente platform_admins podem ler/escrever.

#### 2. Hook `useModuleSettings`

Novo hook (`src/hooks/useModuleSettings.ts`) que:
- Busca os dados de `platform_module_settings`
- Expoe funcao `isModuleVisible(moduleKey)` que verifica:
  - Se `isDemo` === true: usa `enabled_demo`
  - Se `isDemo` === false: usa `enabled_live`
- Inclui mutation para atualizar `enabled_live` / `enabled_demo`

#### 3. Atualizar `AppSidebar.tsx`

Substituir a logica estatica de filtragem (`DISABLED_SECTION_IDS`, `DISABLED_ESG_CATEGORY_IDS`) pelo hook `useModuleSettings`:

- Em vez de importar constantes de `enabledModules.ts`, usar o hook para determinar quais secoes/categorias mostrar
- No modo demo (`isDemo === true`), todos os modulos com `enabled_demo = true` aparecem (por padrao, todos)
- No modo live, apenas modulos com `enabled_live = true` aparecem

#### 4. Atualizar `enabledModules.ts`

Manter o arquivo como fallback (caso o banco nao responda), mas a fonte primaria passa a ser o banco. As funcoes `isRouteDisabled` tambem serao atualizadas para consultar o hook.

#### 5. Nova aba "Modulos" no Platform Admin Dashboard

**Arquivo: `src/components/platform/ModuleSettingsPanel.tsx`** (novo)

Uma tabela com todos os modulos, cada linha contendo:
- Nome do modulo
- Toggle para "Live" (enabled_live)
- Toggle para "Demo" (enabled_demo)
- Indicacao de ultima atualizacao

**Arquivo: `src/pages/PlatformAdminDashboard.tsx`**

Adicionar nova aba "Modulos" ao `TabsList` existente (ao lado de "Empresas" e "Usuarios"), renderizando o `ModuleSettingsPanel`.

### Arquivos modificados

- **Migration SQL**: criar tabela `platform_module_settings` com seed
- `src/hooks/useModuleSettings.ts` -- novo hook
- `src/components/platform/ModuleSettingsPanel.tsx` -- novo painel admin
- `src/pages/PlatformAdminDashboard.tsx` -- adicionar aba "Modulos"
- `src/components/AppSidebar.tsx` -- substituir filtragem estatica por dinamica
- `src/config/enabledModules.ts` -- manter como fallback

