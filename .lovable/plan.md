

# Fix: Titulo da unidade LAIA mostrando nome generico em vez do codigo

## Problema

Todas as 18 filiais da empresa possuem o mesmo `name` ("TRANSPORTES GABARDO LTDA") e se diferenciam pelo campo `code` (SJP, DUQUE, CAMACARI, EUSEBIO, etc.). A pagina `/laia/unidade/:branchId` exibe `branch.name` no titulo e no breadcrumb, tornando impossivel distinguir as unidades.

## Solucao

### Arquivo: `src/pages/LAIAUnidadePage.tsx`

Criar uma funcao helper para exibir o nome legivel da unidade, priorizando o `code` quando disponivel:

```text
Logica de exibicao:
- Se tem code: mostrar code (ex: "SJP", "DUQUE", "CAMACARI")  
- Se nao tem code: mostrar name (fallback)
- Subtitulo: mostrar name completo quando code esta presente
```

Pontos de alteracao:

1. **Breadcrumb** (linha ~101): trocar `branch.name` pelo codigo/nome legivel
2. **Titulo h1** (linha ~113): trocar `branch.name` pelo codigo/nome legivel
3. **Helmet title** (linha ~91): usar o codigo no titulo da aba do navegador

Exemplo visual apos a correcao:

```text
ANTES:
  LAIA > TRANSPORTES GABARDO LTDA
  TRANSPORTES GABARDO LTDA [Matriz]

DEPOIS (para filial com code "SJP"):
  LAIA > SJP
  SJP - TRANSPORTES GABARDO LTDA

DEPOIS (para matriz com code "MATRIZ"):
  LAIA > MATRIZ
  MATRIZ - TRANSPORTES GABARDO LTDA [Matriz]
```

### Detalhes tecnicos

- Usar `branch.code || branch.name` para o texto principal
- No breadcrumb e titulo, exibir `branch.code ? \`${branch.code} - ${branch.name}\` : branch.name` para contexto completo no titulo, e apenas `branch.code || branch.name` no breadcrumb
- Sem alteracoes em servicos ou banco de dados
- Alteracao limitada a 1 arquivo

