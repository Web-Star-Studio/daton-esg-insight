

## Resposta: Sim, admins ignoram restrições individuais de módulo

O código atual em `useModuleSettings.ts` (linhas 72-87) confirma que **roles administrativas (`platform_admin`, `super_admin`, `admin`) fazem bypass das restrições de acesso por usuário**. Ou seja:

- Se você desativar um módulo específico para um usuário na gestão de acesso (`user_module_access`), mas esse usuário tiver role `admin`, **ele continuará vendo todos os módulos**.
- A **única exceção** são módulos **globalmente desativados** na plataforma (quando `enabled_live` e `enabled_demo` são ambos `false`) — esses ficam ocultos para todos, inclusive admins.

```text
Fluxo atual:
┌─────────────────────────────┐
│ isModuleVisible(moduleKey)  │
├─────────────────────────────┤
│ É admin/super_admin?        │
│   SIM → módulo globalmente  │
│         desativado?         │
│     SIM → oculto            │
│     NÃO → VISÍVEL (ignora   │
│           user_module_access)│
│   NÃO → checa global +     │
│          user_module_access │
└─────────────────────────────┘
```

## Opção de correção

Se você quiser que restrições individuais de módulo se apliquem **mesmo a admins**, a alteração seria em `src/hooks/useModuleSettings.ts`:

- Na função `isModuleVisible`, após o check global para admins, adicionar a verificação de `userAccess` também para roles administrativas
- Isso faria com que a configuração individual de acesso prevalecesse sobre a role, permitindo restringir módulos específicos para qualquer usuário

**Arquivo afetado:** `src/hooks/useModuleSettings.ts` (função `isModuleVisible`, linhas 72-87)

