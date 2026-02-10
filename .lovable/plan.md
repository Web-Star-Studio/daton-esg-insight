
## Promover contatodoug.a@gmail.com a Platform Admin

### O que sera feito

Duas alteracoes no banco de dados para conceder acesso total ao painel master (`/platform-admin`):

1. **Atualizar role** na tabela `user_roles`: de `admin` para `platform_admin`
2. **Inserir registro** na tabela `platform_admins` para liberar o acesso ao painel

### Usuario

| Campo | Valor |
|-------|-------|
| Email | contatodoug.a@gmail.com |
| User ID | ba36f039-23cc-49ec-ae9d-aa6e5a43c7f7 |
| Role atual | admin |
| Role nova | platform_admin |

### Detalhes tecnicos

**Migracoes SQL necessarias:**

```sql
-- 1. Atualizar role para platform_admin
UPDATE user_roles 
SET role = 'platform_admin', updated_at = now()
WHERE user_id = 'ba36f039-23cc-49ec-ae9d-aa6e5a43c7f7';

-- 2. Inserir na tabela platform_admins
INSERT INTO platform_admins (user_id)
VALUES ('ba36f039-23cc-49ec-ae9d-aa6e5a43c7f7')
ON CONFLICT DO NOTHING;
```

### Resultado

O usuario podera acessar `/platform-admin` com visao completa da plataforma (KPIs globais, gestao de empresas, controle de status).
