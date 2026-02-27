

# Conteúdo da Metodologia LAIA — Seção Completa

## O que será feito

Criar o componente `src/components/laia/LAIAMetodologia.tsx` com todo o conteúdo do documento FPLAN-002 (exceto seção 7 - Histórico das Revisões), apresentado de forma moderna e minimalista usando Collapsible/Accordion para organizar as seções.

## Estrutura do conteúdo

Seções do documento a exibir:

1. **Objetivo** — Texto simples
2. **Aplicação** — Texto simples
3. **Generalidades** — "Não se aplica"
4. **Responsabilidades** — Texto simples
5. **Procedimento** — Seção principal com sub-seções:
   - 5.1) Modelo de Planilha (tabela visual)
   - 5.2) Explicativo de preenchimento — múltiplos itens expandíveis:
     - Identificação (Cod Set, Cod Asp, Atividade, Aspectos, Impactos)
     - Caracterização (Temporalidade, Situação Operacional, Incidência, Classe)
     - Verificação de Importância (Abrangência/Consequência com tabela de pontos, Frequência/Probabilidade com tabelas, Soma, Categoria/Enquadramento)
     - Avaliação de Significância (Requisitos Legais, DPI, OE, Enquadramento final com tabela)
     - Observações Adicionais (Tipos de Controle, Controles Existentes, Link Legislação)
     - Perspectiva do Ciclo de Vida (Controle/Influência, Estágios, Saídas)
   - 5.3) Situações pertinentes a alteração/revisão
6. **Tratativas aos Registros** — "Não aplicável"

## Layout e Design

- Header com badge do código do documento (FPLAN-002) e metadados (elaboração, aprovação, data, revisão)
- Accordion principal com cada seção numerada como item
- Tabelas estilizadas com Tailwind para critérios de pontuação
- Cards coloridos para escalas (Desprezível/Moderado/Crítico)
- Tudo responsivo e colapsável para não sobrecarregar a tela

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/laia/LAIAMetodologia.tsx` | Novo — componente completo |
| `src/pages/LAIAUnidades.tsx` | Substituir placeholder na tab "metodologia" |

