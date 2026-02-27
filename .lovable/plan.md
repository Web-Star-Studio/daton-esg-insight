

# Bypass de restrições individuais para `super_admin` e `platform_admin`

## Alteração

**Arquivo:** `src/hooks/useModuleSettings.ts`

1. Criar uma nova constante `BYPASS_ROLES` com apenas `['platform_admin', 'super_admin']`
2. Criar flag `isBypassRole` baseada nessa constante
3. Na verificação de `user_module_access` (linha 92-96), pular o check se o usuário for `platform_admin` ou `super_admin`
4. Manter `ADMIN_ROLES` (com `admin`) para o check de toggle global por ambiente (linhas 80-83)

Resultado: `admin` terá restrições individuais aplicadas normalmente; `super_admin` e `platform_admin` ignoram restrições individuais (apenas módulos globalmente desativados continuam ocultos).

