
## Correção: Build Error + Lista de Colaboradores Incompleta

### Problema Principal
A correção anterior (`.range(0, 4999)`) ja esta no codigo, mas **nunca foi implantada** porque existe um erro de build bloqueando tudo:

```
Could not find a matching package for 'npm:openai@^4.52.5'
```

Esse erro vem da tipagem interna do `@supabase/functions-js` tentando resolver o pacote `openai`. A solucao e criar um arquivo `deno.json` na pasta de edge functions para satisfazer essa dependencia.

### Solucao

**Arquivo 1 - Criar `supabase/functions/deno.json`**

Adicionar um arquivo de configuracao Deno com o mapeamento do pacote openai para resolver o erro de tipos:

```json
{
  "imports": {
    "npm:openai@^4.52.5": "https://esm.sh/openai@4.52.5"
  }
}
```

Isso resolve o erro de build sem alterar nenhuma funcionalidade. As edge functions continuam usando `fetch()` diretamente para chamar a API da OpenAI.

### Resultado Esperado

Com o build funcionando novamente:
- A correcao `.range(0, 4999)` que ja esta no `TrainingProgramModal.tsx` entra em vigor
- Todos os 1898+ colaboradores aparecerao na lista de participantes (letras A ate Z)
- O modal de treinamento funcionara corretamente

### Impacto
- Nenhuma mudanca funcional
- Apenas desbloqueio do build e ativacao da correcao ja existente
