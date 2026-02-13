

## Plano: Alterar card "Gestão Fornecedores" para "ESG Governanca" na pagina /ambiental

### O que sera feito

No arquivo `src/pages/ESGAmbiental.tsx`, o card de indice "004" (atualmente "Gestão Fornecedores") sera atualizado:

1. **Titulo**: De "Gestão Fornecedores" para "ESG Governanca"
2. **Categoria**: De "Cadeia de Suprimentos / Compras" para algo como "Governanca Corporativa"
3. **Descricao**: Texto atualizado para refletir governanca (ex: "Centralize politicas, auditorias, riscos e compliance para elevar transparencia e confianca institucional.")
4. **Bullet points**: Substituir os 3 itens atuais por itens de governanca, como:
   - Politicas e compliance corporativo
   - Gestao de riscos e auditorias
   - Transparencia e etica empresarial
5. **ID**: De "fornecedores" para "governanca"

### Detalhes tecnicos

Arquivo: `src/pages/ESGAmbiental.tsx`, linhas 90-105.

Alteracao pontual no objeto do array `INFRASTRUCTURE_CARDS`:

```typescript
{
  id: "governanca",
  index: "004",
  title: "ESG Governança",
  category: "Governança Corporativa",
  description:
    "Centralize políticas, auditorias, riscos e compliance para elevar transparência e confiança institucional.",
  icon: TrendingUp,
  image: esgSuppliersCardImg,
  color: "#fff7ed",
  features: [
    "Políticas e compliance corporativo",
    "Gestão de riscos e auditorias",
    "Transparência e ética empresarial",
  ],
},
```

A imagem e o icone serao mantidos, pois nao foi solicitada alteracao visual alem do texto.

