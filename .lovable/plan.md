

## Barra de Progresso de Etapas na Lista de NCs

### O que sera feito

Adicionar uma nova coluna **"Progresso"** na tabela de listagem de Nao Conformidades, exibindo uma barra de progresso visual baseada no campo `current_stage` (1 a 6) de cada NC.

A barra mostrara visualmente em qual das 6 etapas a NC se encontra, com cores semanticas:
- **Vermelho/Laranja** (etapas 1-2): NC no inicio, precisa de atencao
- **Amarelo** (etapas 3-4): NC em andamento
- **Verde** (etapas 5-6): NC avancada, sob controle

### Visual proposto

Cada linha da tabela tera:

```text
[====------] 2/6  Acao Imediata
```

- Barra de progresso fina (height 6px, rounded) preenchida proporcionalmente
- Fracao "X/6" pequena
- Nome da etapa atual em texto pequeno

### Exemplo pratico com as NCs do usuario

| NC | current_stage | Progresso Visual |
|----|---------------|------------------|
| NC-9995 | 1 (Registro) | [==========] 1/6 - barra vermelha, "preciso focar nela" |
| NC-0902 | 5 (Implementacao) | [========--] 5/6 - barra verde, "nao preciso me preocupar" |

---

### Detalhes tecnicos

**Arquivo modificado**: `src/pages/NaoConformidades.tsx`

1. Adicionar uma coluna "Progresso" no `TableHeader`, entre "Status" e "Data"
2. Adicionar a celula correspondente no `TableBody` com:
   - Componente `Progress` do Radix (ja instalado) ou uma `div` com width dinamico
   - Texto auxiliar com nome da etapa e fracao
   - Cor da barra baseada no `current_stage`:
     - Etapas 1-2: vermelho/laranja (`bg-red-500` / `bg-orange-500`)
     - Etapas 3-4: amarelo (`bg-yellow-500`)
     - Etapas 5-6: verde (`bg-green-500`)

**Mapa de etapas** (reutilizando labels existentes do `NCStageWizard`):

```
1 = Registro
2 = Acao Imediata
3 = Analise de Causa
4 = Planejamento
5 = Implementacao
6 = Eficacia
```

**Calculo do progresso**: `(current_stage / 6) * 100`

Nenhuma query, rota, endpoint ou copy existente sera alterada. Apenas uma coluna visual nova na tabela.

