

## Formatar dados de onboarding no modal de detalhes do usuario

### Problema
O modal exibe dados de onboarding de forma crua:
- Perfil da empresa mostra chaves em ingles sem traducao (ex: "Size", "MaturityLevel", "CurrentChallenges")
- Configuracoes de modulos exibidas como JSON bruto (`JSON.stringify`)

### Solucao

Reformatar a exibicao no arquivo `src/components/platform/UserDetailsModal.tsx`:

**1. Perfil da empresa - Mapeamento de labels**

Criar um dicionario para traduzir as chaves do company profile:

| Chave original | Label formatado |
|---|---|
| size | Porte da empresa |
| sector | Setor de atuacao |
| goals | Objetivos ESG |
| maturity_level / MaturityLevel | Nivel de maturidade |
| current_challenges / CurrentChallenges | Desafios atuais |
| employees_count | Numero de funcionarios |

Os valores tambem serao traduzidos quando aplicavel (ex: "small" -> "Pequena", "intermediate" -> "Intermediario", "water_management" -> "Gestao de agua").

Valores que sao arrays serao exibidos como badges em vez de texto simples.

**2. Configuracoes de modulos - Exibicao estruturada**

Substituir o `JSON.stringify` por uma lista organizada por modulo:

- Cada modulo vira um bloco com o nome traduzido como titulo
- As sub-configuracoes serao exibidas como itens com indicadores visuais (check verde para ativado, X cinza para desativado)

Exemplo visual:
```
Residuos
  [check] Segregacao
  [check] Manifestos digitais

Qualidade
  [check] Agendamento de auditorias
  [check] Gestao de procedimentos
```

**3. Dicionarios de traducao para modulos e features**

Criar mapeamentos para nomes de modulos e sub-features:

| Chave | Label |
|---|---|
| residuos | Residuos |
| qualidade | Qualidade |
| gestao_pessoas | Gestao de Pessoas |
| saude_seguranca | Saude e Seguranca |
| segregacao | Segregacao |
| manifestos_digitais | Manifestos digitais |
| audit_scheduling | Agendamento de auditorias |
| procedure_management | Gestao de procedimentos |
| training_tracking | Acompanhamento de treinamentos |

### Detalhes tecnicos

- Arquivo: `src/components/platform/UserDetailsModal.tsx`
- Alteracoes nas linhas 190-223 (secao company profile e module configurations)
- Adicionar dicionarios de mapeamento no topo do arquivo (constantes)
- Usar `Badge` para valores de array e `CheckCircle2`/`XCircle` para configuracoes booleanas
- Importar icones adicionais de `lucide-react`: `CheckCircle2`, `XCircle`

