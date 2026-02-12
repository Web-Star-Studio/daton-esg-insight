

## Adicionar links de Termos e Privacidade ao Footer

### Mudanca

Adicionar dois links ao final da coluna "Navegacao" no footer:
- Privacidade (`/privacidade`)
- Termos de Uso (`/termos`)

### Arquivo

**`src/components/landing/heimdall/PublicFooter.tsx`**

Inserir apos o link "Contato":

```tsx
<Link to="/privacidade" className="block hover:text-white">
  Privacidade
</Link>
<Link to="/termos" className="block hover:text-white">
  Termos de Uso
</Link>
```

Nenhum outro arquivo precisa ser alterado -- as rotas `/privacidade` e `/termos` ja existem no projeto.

