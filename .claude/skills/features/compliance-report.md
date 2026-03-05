# Skill: compliance-report
# Trigger: /compliance-report
# Descrição: Gerar relatório de conformidade normativa (ISO/NBR/etc.) analisando o sistema Daton ESG ou documentos organizacionais fornecidos

## Contexto

O usuário irá fornecer:
- **Requisito normativo** (ex: ISO 9001:2015 item 7.5)
- **Descrição** do que deve ser verificado
- **Documento(s) de validação** da empresa cliente (planilhas FPLAN, PSG-DOC, etc.) — podem ser anexados ou descritos

Você deve produzir um relatório de conformidade completo com score de 0 a 5 e salvá-lo em `docs/compliance-reports/`.

---

## PASSO 0 — Identificar o tipo de análise

Antes de tudo, determine qual dos dois tipos de análise se aplica:

### Tipo A — Conformidade Documental (organizacional)
Aplicável quando o requisito é atendido por **processos e documentos da organização** (não por software).
- Exemplos: ISO 4.1 (contexto), 4.2 (partes interessadas), 6.1 (riscos), 6.2 (objetivos)
- A análise verifica se os **documentos fornecidos (FPLAN, PSG, xlsx)** evidenciam o requisito
- O codebase é mencionado marginalmente ou não é o foco

### Tipo B — Conformidade do Sistema (codebase)
Aplicável quando o requisito pode ser implementado por **funcionalidades de software**.
- Exemplos: ISO 7.2 (competência), 7.4 (comunicação), 7.5 (informação documentada)
- A análise verifica como o **sistema Daton ESG Insight** implementa o requisito
- Requer exploração profunda do codebase + cruzamento com o documento fornecido

**Regra prática:** Se o requisito fala sobre gerenciar dados, registros, documentos, processos, comunicações, treinamentos, auditorias — é Tipo B. Se fala sobre estratégia, contexto organizacional, planejamento de alto nível — é Tipo A.

---

## PASSO 1 — Nomear e criar o arquivo de saída

Convenção de nome:
```
docs/compliance-reports/req-normativo-[NORMA]-item-[X-Y].md
```

Exemplos:
- ISO 9001:2015 item 7.5 → `req-normativo-ISO-9001-2015-item-7-5.md`
- ISO 14001:2015 item 6.1 → `req-normativo-ISO-14001-2015-item-6-1.md`
- NBR ISO 45001 item 8.2 → `req-normativo-NBR-ISO-45001-item-8-2.md`

Verificar se já existe arquivo para este item:
```bash
ls docs/compliance-reports/ | grep [item]
```

Se existir, perguntar ao usuário se deve atualizar ou criar novo.

---

## PASSO 2 (Tipo B apenas) — Exploração do codebase

Para análise de sistema, realize busca abrangente antes de escrever qualquer coisa.

### 2a. Identificar módulos relevantes

Mapeamento padrão de módulos Daton ESG por domínio:

| Domínio ISO | Módulos do sistema a verificar |
|-------------|-------------------------------|
| Competência / RH | `src/pages/GestaoFuncionarios*`, `src/pages/GestaoTreinamentos*`, `src/pages/DesenvolvimentoCarreira*`, hooks `useEmployees*`, `useTraining*`, `useCompetency*` |
| Comunicação | `src/components/StakeholderCommunicationHub*`, `src/pages/GestaoStakeholders*`, hooks `useStakeholders*` |
| Informação Documentada | `src/pages/Documentos*`, `src/components/*Document*`, hooks `useDocuments*`, `src/services/documents*` |
| Auditoria | `src/pages/Auditoria*`, `src/components/audit/*`, hooks `useAudit*` |
| Não Conformidades | `src/pages/NaoConformidades*`, `src/components/quality/*` |
| Riscos | `src/pages/GestaoRiscos*`, hooks `useRisks*` |
| Fornecedores | `src/pages/Supplier*`, `src/components/supplier*` |
| Ambiental | `src/pages/InventarioGEE*`, `src/pages/Residuos*`, `src/pages/Monitoramento*` |
| Qualidade SGQ | `src/pages/Quality*`, `src/pages/Gestao*Indicadores*` |
| Compliance | `src/pages/Compliance*`, `src/components/gri/*` |

### 2b. Comandos de busca padrão

```bash
# Buscar por domínio no codebase
grep -r "[palavra-chave]" src/ --include="*.tsx" --include="*.ts" -l

# Verificar schema Supabase
find src/ -name "*.ts" | xargs grep -l "supabase\|schema\|table"

# Verificar hooks relevantes
ls src/hooks/ | grep -i [dominio]

# Verificar serviços
ls src/services/ | grep -i [dominio]

# Verificar componentes
find src/components -name "*[dominio]*" -type f

# Verificar páginas
ls src/pages/ | grep -i [dominio]
```

### 2c. Para cada módulo identificado, verificar:
1. **Existe na UI?** (componente/página acessível)
2. **Tem CRUD completo?** (create/read/update/delete)
3. **Schema de banco?** (tabelas Supabase com campos relevantes)
4. **Hooks de dados?** (useQuery, useMutation)
5. **Relatórios/exports?** (PDF, Excel, filtros)
6. **Trilha de auditoria?** (logs, histórico de alterações)
7. **Integração com outros módulos?**

---

## PASSO 3 — Escala de pontuação

### Score por módulo (0–5)

| Score | Classificação | Critério |
|-------|--------------|----------|
| 4.5–5.0 | **Maduro** | Funcionalidade completa, todos os campos ISO presentes, trilha de auditoria, relatórios, integração entre módulos |
| 4.0–4.4 | **Maduro** | Funcionalidade completa com lacunas menores não críticas |
| 3.5–3.9 | **Funcional** | Funcionalidade presente e operacional, faltam algumas features avançadas |
| 3.0–3.4 | **Funcional** | Cobre os requisitos mínimos com lacunas funcionais notáveis |
| 2.5–2.9 | **Parcial** | Implementação existe mas incompleta — falta estrutura para uso real |
| 2.0–2.4 | **Parcial** | Apenas estrutura básica, sem cobertura adequada do requisito |
| 1.5–1.9 | **Mínimo** | Elementos isolados, sem integração ou fluxo funcional |
| 1.0–1.4 | **Mínimo** | Vestígios de implementação, majoritariamente ausente |
| 0–0.9 | **Ausente** | Requisito não implementado |

### Nota global
Média aritmética das notas dos módulos avaliados.

---

## PASSO 4 — Escrever o relatório

### FORMATO TIPO A (Conformidade Documental)

```markdown
# Relatório Centralizado de Conformidade do Sistema

Data da última atualização: [YYYY-MM-DD]

## Item [N]

**Validação solicitada**: [descrição da tarefa]

**Requisito Normativo**: [Norma], item [X.Y] — [Nome do item]

**Documento(s) de validação**: `[Nome do arquivo]`

### Evidências encontradas

[Lista de bullet points com evidências concretas encontradas nos documentos:
- O documento X possui aba Y com estrutura Z
- Foram identificados N registros com campos A, B, C
- Existe histórico de revisões com datas: YYYY-MM-DD, ...
- A metodologia define: critério 1, critério 2]

### Pontos de atenção

[Lista de bullet points com lacunas, inconsistências ou pontos de risco:
- O documento mostra X mas não consolida Y
- A periodicidade de revisão está implícita, não declarada formalmente
- N de M itens não têm rastreabilidade completa]

### Score de implementação (0 a 5)

**[X.X] / 5.0**

### Justificativa do score

[Parágrafo conciso: o que está bem implementado, por que não é máximo]

### Guia de validação E2E (auditoria prática)

[Numerado, passos concretos para um auditor verificar:
1. Abrir documento X, aba Y, filtrar coluna Z
2. Amostrar N itens e rastrear até evidência em documento complementar
3. Verificar frequência de revisão vs. histórico
4. Critério de aceite:
   - PASSA: [condição]
   - FALHA: [condição]]

---

## Próximos Itens

As próximas validações devem manter esta convenção de arquivo em `docs/compliance-reports`.
```

---

### FORMATO TIPO B (Conformidade do Sistema)

```markdown
# Resumo Executivo — Análise [Norma] Item [X.Y]

**Data da análise:** [YYYY-MM-DD]
**Sistema:** Daton ESG Insight
**Requisito normativo:** [Norma], item [X.Y] — [Nome do item]
**Documento de validação:** [Nome do documento Rev.XX]

---

## Nota Global de Confiança: [X.X]/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | [Nome] | **[X.X]/5** | [Maduro/Funcional/Parcial/Mínimo] |
...
| | **Média aritmética** | **[X.X]/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | N | [lista] |
| Funcional (3-3.9) | N | [lista] |
| Parcial (2-2.9) | N | [lista] |
| Mínimo/Ausente (0-1.9) | N | [lista ou —] |

---

## Top 5 Pontos Fortes

[5 itens com: **Módulo** (nota) — descrição técnica específica, mencionando nomes de componentes, tabelas, hooks, funções reais encontradas no codebase]

---

## Top 5 Lacunas Críticas

### 1. [Título da lacuna] (Severidade: ALTA/MÉDIA/BAIXA)
**Impacto:** [Seção do doc validação], [sub-requisito ISO]
**Situação:** [O que existe vs. o que falta — citar arquivos/tabelas reais]
**Recomendação:** [Ação específica e implementável]

[Repetir para 5 lacunas, ordenadas por severidade]

---

## Cobertura por Sub-requisito [X.Y]

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| [X.Y.Z] [Nome] | [descrição do que cobre] | [Maduro/Funcional/Parcial/Ausente] |

---

## Cobertura [Nome do Documento]

| # | Requisito | Status | Nota |
|---|-----------|--------|------|
| P1 | [requisito] | ✅/⚠️/❌ | [justificativa breve] |

**Resumo:** N/Total implementados (✅), N/Total parciais (⚠️), N/Total ausentes (❌)

---

## Plano de Ação Priorizado

### Quick Wins (1-2 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
[Ações pequenas, sem impacto arquitetural]

### Melhorias Estruturais (2-4 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
[Ações que envolvem novos campos, workflows, integrações entre módulos]

### Mudanças Arquiteturais (1-2 meses)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
[Novos módulos, integrações externas, redesenhos]

---

## Guia de Validação E2E

[Numerado, passos para testar manualmente no sistema:
1. Navegar para [rota]
2. Executar ação X
3. Verificar que resultado Y aparece
4. Testar edge case Z]

---

## Conclusão

[3 parágrafos:
1. Nota global + classificação + julgamento geral ("base sólida", "cobertura limitada", etc.)
2. Principais forças (os módulos maduros e o que eles cobrem)
3. Principais lacunas + resumo do documento de validação (X/Total ✅, Y/Total ⚠️, Z/Total ❌) + potencial de melhoria com plano de ação]
```

---

## PASSO 5 — Salvar e confirmar

```bash
# Verificar que o arquivo foi criado corretamente
ls -la docs/compliance-reports/

# Contar linhas para confirmar relatório completo
wc -l docs/compliance-reports/req-normativo-[...].md
```

Informar ao usuário:
- Caminho do arquivo gerado
- Nota global obtida
- Classificação global (Maduro/Funcional/Parcial/Mínimo)
- Top 3 lacunas críticas (resumo de 1 linha cada)
- Próximos passos sugeridos do plano de ação

---

## Regras de qualidade do relatório

1. **Evidências reais** — Citar nomes de arquivos, componentes, tabelas, hooks, funções que realmente existem no codebase. Nunca inventar.
2. **Nota honesta** — Não inflar scores. Se não encontrou implementação, marcar como Ausente (0-1).
3. **Especificidade** — "Campo `sensitivity_level` ausente na tabela `positions`" é melhor que "falta campo de sensibilidade".
4. **Acionabilidade** — Cada lacuna crítica deve ter uma recomendação implementável e específica.
5. **Consistência com relatórios anteriores** — Verificar relatórios existentes em `docs/compliance-reports/` para manter linguagem e nível de detalhe coerentes.
6. **Data correta** — Usar a data atual do sistema (`date +%Y-%m-%d`).
7. **Profundidade proporcional** — Módulos mais relevantes para o requisito recebem mais análise. Não forçar módulos irrelevantes.

---

## Exemplos de uso

```
/compliance-report
ISO 9001:2015 item 8.5 — Produção e Provisão de Serviço
Documento: PSG-OPE Rev.12
```

```
/compliance-report
ISO 14001:2015 item 6.1.2 — Aspectos Ambientais
Documentos: FPLAN 010, FPLAN 011
```

```
/compliance-report
ISO 9001:2015 item 9.1 — Monitoramento, Medição, Análise e Avaliação
Documento: FPLAN 007 Rev.3
```
