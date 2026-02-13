

## Problema

O modal de detalhes do usuario em `/platform-admin` mostra "Onboarding nao iniciado" para todos os usuarios porque a tabela `onboarding_selections` tem uma politica RLS que so permite cada usuario ver seus proprios dados (`user_id = auth.uid()`). O administrador da plataforma nao consegue ler as selecoes de onboarding de outros usuarios.

## Solucao

Adicionar uma politica RLS na tabela `onboarding_selections` que permita platform admins lerem os dados de onboarding de qualquer usuario.

## Etapas

1. **Criar nova politica RLS** na tabela `onboarding_selections` que permita SELECT para usuarios que sao `platform_admin`. A verificacao sera feita consultando a tabela `platform_admins` (mesmo padrao ja usado em outras tabelas do sistema).

```sql
CREATE POLICY "Platform admins can view all onboarding selections"
  ON public.onboarding_selections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  );
```

2. **Nenhuma alteracao de codigo necessaria** - o componente `UserDetailsModal.tsx` ja implementa toda a logica de exibicao dos dados de onboarding (modulos selecionados, perfil da empresa, configuracoes, progresso). O problema e exclusivamente de permissao no banco de dados.

## Detalhes Tecnicos

- Tabela afetada: `onboarding_selections`
- Politica atual: `Users can manage their own onboarding selections` (ALL, `user_id = auth.uid()`)
- Nova politica: SELECT apenas, restrita a platform admins via lookup na tabela `platform_admins`
- Nenhum arquivo de codigo sera alterado
- A migracao SQL sera criada em `supabase/migrations/`

