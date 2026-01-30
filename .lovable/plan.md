

# Fase 4: Preferencias do Sistema - Plano de Implementacao

## Resumo

Esta fase adiciona recursos de personalizacao de preferencias do usuario na pagina de Configuracoes, incluindo seletor de tema, preferencias de notificacoes e configuracao de timezone.

---

## Componentes a Criar

### 1. ThemeSelector.tsx

**Arquivo:** `src/components/settings/ThemeSelector.tsx`

**Funcionalidade:**
- Toggle entre tema Claro, Escuro e Automatico (sistema)
- Usa `useTheme` do `next-themes` (ja configurado no App.tsx)
- Sincroniza com `dashboard_preferences` no banco via `useDashboardPreferences`
- Design com botoes estilizados mostrando icone de sol/lua/sistema

**Tecnologia:**
```typescript
import { useTheme } from "next-themes";
// Opcoes: "light" | "dark" | "system"
```

---

### 2. NotificationPreferences.tsx

**Arquivo:** `src/components/settings/NotificationPreferences.tsx`

**Funcionalidade:**
- Toggles individuais para:
  - Notificacoes In-app (ativado por padrao)
  - Notificacoes por Email (licencas, NCs, alertas criticos)
  - Resumo Semanal por Email
  - Notificacoes de Sistema (atualizacoes de versao)
- Salva em `dashboard_preferences.notifications` (JSONB)
- Usa `useDashboardPreferences` existente (estendido)

**Estrutura de dados:**
```typescript
interface NotificationPrefs {
  inApp: boolean;
  email: boolean;
  emailWeeklySummary: boolean;
  systemUpdates: boolean;
}
```

---

### 3. TimezoneSelector.tsx

**Arquivo:** `src/components/settings/TimezoneSelector.tsx`

**Funcionalidade:**
- Dropdown com timezones relevantes para Brasil:
  - America/Sao_Paulo (Brasilia - UTC-3)
  - America/Manaus (Amazonas - UTC-4)
  - America/Recife (Nordeste - UTC-3)
  - America/Belem (Para - UTC-3)
  - America/Cuiaba (Mato Grosso - UTC-4)
  - America/Rio_Branco (Acre - UTC-5)
  - America/Noronha (Fernando de Noronha - UTC-2)
- Salva em `dashboard_preferences.timezone`
- Usado para formatacao de datas em toda a aplicacao

---

## Modificacoes em Arquivos Existentes

### 1. useDashboardPreferences.ts

**Alteracao:** Estender interface para incluir novos campos

```typescript
export interface DashboardPreferences {
  widgets: string[];
  layout: 'default' | 'compact' | 'expanded';
  pinnedModules?: string[];
  // NOVOS CAMPOS:
  theme?: 'light' | 'dark' | 'system';
  timezone?: string;
  notifications?: {
    inApp: boolean;
    email: boolean;
    emailWeeklySummary: boolean;
    systemUpdates: boolean;
  };
}
```

---

### 2. Configuracao.tsx

**Alteracao:** Adicionar nova secao "Preferencias" no perfil

**Local:** Apos a secao "Alterar Senha" e antes de "Guia de Configuracao Inicial"

**Conteudo:**
- Card com titulo "Preferencias do Sistema"
- Inclui os 3 novos componentes:
  1. ThemeSelector
  2. TimezoneSelector
  3. NotificationPreferences

---

## Estrutura Visual da Nova Secao

```
+---------------------------------------------------+
| Preferencias do Sistema                           |
+---------------------------------------------------+
| Tema                                              |
| [Claro] [Escuro] [Automatico]                     |
+---------------------------------------------------+
| Fuso Horario                                      |
| [Select: America/Sao_Paulo ▼]                     |
+---------------------------------------------------+
| Notificacoes                                      |
| [x] Notificacoes in-app                           |
| [x] Notificacoes por e-mail                       |
| [ ] Resumo semanal por e-mail                     |
| [x] Atualizacoes do sistema                       |
+---------------------------------------------------+
```

---

## Ordem de Implementacao

1. **Criar ThemeSelector.tsx** - Componente mais simples, usa hook existente
2. **Criar TimezoneSelector.tsx** - Select com lista estatica de timezones
3. **Criar NotificationPreferences.tsx** - Toggles com Switch
4. **Estender useDashboardPreferences.ts** - Adicionar novos campos na interface
5. **Integrar em Configuracao.tsx** - Adicionar nova secao com os 3 componentes

---

## Detalhes de Implementacao

### ThemeSelector.tsx

```typescript
// Usa next-themes useTheme hook
const { theme, setTheme } = useTheme();

// Opcoes de botao toggle com icones
// Sun = light, Moon = dark, MonitorSmartphone = system

// Sincroniza com banco ao mudar
updatePreferences({ theme: selectedTheme });
```

### TimezoneSelector.tsx

```typescript
const timezones = [
  { value: "America/Sao_Paulo", label: "Brasilia (UTC-3)" },
  { value: "America/Manaus", label: "Manaus (UTC-4)" },
  // ...
];

// Usa Select do shadcn/ui
// Salva em dashboard_preferences.timezone
```

### NotificationPreferences.tsx

```typescript
// Usa Switch do shadcn/ui para cada toggle
// Estrutura de cada item:
<div className="flex items-center justify-between">
  <div>
    <Label>Titulo</Label>
    <p className="text-sm text-muted-foreground">Descricao</p>
  </div>
  <Switch checked={value} onCheckedChange={handler} />
</div>
```

---

## Arquivos Finais

| Arquivo | Acao |
|---------|------|
| `src/components/settings/ThemeSelector.tsx` | CRIAR |
| `src/components/settings/TimezoneSelector.tsx` | CRIAR |
| `src/components/settings/NotificationPreferences.tsx` | CRIAR |
| `src/hooks/data/useDashboardPreferences.ts` | MODIFICAR (interface) |
| `src/pages/Configuracao.tsx` | MODIFICAR (nova secao) |

---

## Nao Requer Migracao de Banco

Os novos campos serao armazenados no campo JSONB `dashboard_preferences` que ja existe na tabela `profiles`. Nao e necessaria nenhuma migracao SQL.

---

## Resumo Tecnico

- **Tema:** Controlado pelo `next-themes`, persistido em localStorage + banco
- **Timezone:** Armazenado no banco, usado para formatacao de datas
- **Notificacoes:** Armazenado no banco, respeitado pelo servico de notificacoes

