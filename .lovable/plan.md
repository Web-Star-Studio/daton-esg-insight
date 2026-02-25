

# Ocultar Financeiro e Dados/Relatórios globalmente (incluindo admins)

## Situação atual

No banco de dados, ambos os módulos já estão com `enabled_live: false`, mas `enabled_demo: true`. Além disso, o hook `useModuleSettings` tem um **bypass de admin** na linha 74 que faz com que qualquer usuário com role `admin`, `super_admin` ou `platform_admin` veja **todos** os módulos, independentemente das configurações globais.

## Alterações necessárias

### 1. Atualizar banco de dados
Setar `enabled_demo: false` para `financial` e `dataReports`, garantindo que estão desabilitados em ambos os ambientes.

### 2. Ajustar lógica de bypass no `useModuleSettings.ts`
Modificar `isModuleVisible` para que o bypass de admin **não se aplique** quando o módulo está globalmente desabilitado (tanto `enabled_live` quanto `enabled_demo` são `false`). Assim, admins continuam vendo módulos que estão habilitados em pelo menos um ambiente (para poder gerenciá-los), mas módulos completamente desligados ficam ocultos para todos.

```text
Lógica atual:
  if (isAdmin) return true;  ← sempre mostra tudo

Lógica nova:
  if (isAdmin) {
    // Verificar se módulo está globalmente desabilitado
    if (settings) {
      const setting = settings.find(s => s.module_key === moduleKey);
      if (setting && !setting.enabled_live && !setting.enabled_demo) {
        return false;  ← oculto mesmo para admins
      }
    }
    return true;
  }
```

### Arquivos a modificar
- **`src/hooks/useModuleSettings.ts`** — ajustar bypass de admin
- **Banco de dados** — UPDATE em `platform_module_settings`

### Resultado
Financeiro e Dados/Relatórios desaparecem da sidebar e ficam inacessíveis por URL para **todos** os usuários. Para reativá-los, basta ligar o toggle na aba Módulos do painel admin.

