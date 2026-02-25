

# Corrigir senha temporária corrompida no email de convite

## Causa raiz

A função `generateRandomPassword()` usa caracteres especiais incluindo `&` (e outros como `<`, que não estão presentes, mas `&` é suficiente para causar o problema). Quando a senha é inserida diretamente no template HTML do email **sem escape**, o caractere `&` é interpretado pelo cliente de email como início de uma entidade HTML (ex: `&amp;`, `&#123;`), corrompendo a senha exibida.

O usuário vê uma senha diferente da que foi realmente configurada no Supabase Auth, resultando em "Email ou senha incorretos".

## Solução

**`supabase/functions/invite-user/index.ts`**:

1. Adicionar uma função `escapeHtml()` para escapar caracteres especiais antes de inserir no HTML:
```typescript
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

2. Na linha 485, onde a senha é inserida no template HTML, aplicar o escape:
```
// Antes:
${password}

// Depois:
${escapeHtml(password)}
```

3. Fazer o mesmo no fluxo de reenvio (resend), onde a senha também é passada para `buildEmailHtml`.

## Alternativa complementar

Simplificar os caracteres especiais do gerador para evitar `&` completamente:
- Trocar `"!@#$%&*?"` por `"!@#$%*?"` (remover o `&`)
- Isso evita o problema na raiz, mas o escape HTML é necessário de qualquer forma como defesa em profundidade.

## Resultado esperado

A senha exibida no email será idêntica à configurada no Supabase Auth, permitindo o login com a senha temporária.

