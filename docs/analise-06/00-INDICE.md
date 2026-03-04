# Análise de Conformidade — ISO 9001:2015 Item 7.5: Informação Documentada

**Data da análise:** 2026-03-04
**Sistema:** Daton ESG Insight
**Documento de validação:** PSG-DOC Rev.17 (Gabardo — Controle de Documentos e Registros)
**Requisito normativo:** ISO 9001:2015, item 7.5 (Informação Documentada)

---

## Objetivo

Verificar se a organização possui metodologia para controle da informação documentada que deve ser mantida e retida com foco em dar suporte aos processos, conforme ISO 9001:2015 item 7.5, confrontando a implementação no sistema Daton ESG Insight com os procedimentos definidos no PSG-DOC Rev.17.

## Metodologia

A análise foi conduzida por inspeção de código-fonte, schemas de banco de dados, componentes de UI e serviços da aplicação. Cada módulo foi avaliado contra:

1. **Sub-requisitos ISO 7.5**: 7.5.1 (Generalidades), 7.5.2 (Criando e Atualizando), 7.5.3 (Controle)
2. **Requisitos PSG-DOC**: Procedimentos específicos do documento de validação Gabardo
3. **Evidências no código**: Tabelas Supabase, serviços, componentes React, hooks

## Rubrica de Pontuação (0-5)

| Nota | Nível | Descrição |
|------|-------|-----------|
| 0 | Ausente | Nenhuma implementação encontrada |
| 1 | Mínimo | Estrutura de dados existe mas funcionalidade não operacional |
| 2 | Parcial | Funcionalidade básica implementada, lacunas significativas |
| 3 | Funcional | Atende requisitos principais com algumas lacunas menores |
| 4 | Maduro | Cobertura ampla dos requisitos, lacunas mínimas |
| 5 | Exemplar | Implementação completa, auditável, com rastreabilidade total |

### Critérios Ponderados

| Critério | Peso |
|----------|------|
| Cobertura funcional do requisito 7.5 | 30% |
| Aderência ao PSG-DOC | 25% |
| Maturidade do código (tipagem, tratamento de erro) | 15% |
| Rastreabilidade de evidências | 15% |
| UX/Usabilidade para o usuário final | 15% |

## Requisitos ISO 9001:2015 Item 7.5

### 7.5.1 — Generalidades
O SGQ deve incluir informação documentada requerida pela norma e informação documentada que a organização determina como necessária para a eficácia do SGQ.

### 7.5.2 — Criando e Atualizando
Ao criar e atualizar informação documentada, a organização deve assegurar apropriados:
- a) Identificação e descrição (título, data, autor, número de referência)
- b) Formato e meio (idioma, versão de software, gráficos)
- c) Análise crítica e aprovação quanto à adequação e suficiência

### 7.5.3 — Controle de Informação Documentada
#### 7.5.3.1
A informação documentada deve estar disponível e adequada para uso, onde e quando necessário, e deve ser adequadamente protegida.

#### 7.5.3.2
Para controle, a organização deve tratar das seguintes atividades, conforme aplicável:
- a) Distribuição, acesso, recuperação e uso
- b) Armazenamento e preservação, incluindo preservação da legibilidade
- c) Controle de alterações (controle de revisão)
- d) Retenção e disposição
- e) Informação documentada de origem externa, identificada e controlada

## Requisitos-Chave PSG-DOC Rev.17

| # | Requisito | Referência PSG-DOC |
|---|-----------|-------------------|
| P1 | Software de controle documental (equiv. QualityWeb) | Seção 6, §1 |
| P2 | 5 níveis de documentação (MSG, PSG, IT/PSO, RG, FPLAN) | Seção 6 — Níveis |
| P3 | Sistema de codificação (PSG-XX, IT-XX.YY, RG-XX.ZZ) | Seção 6 — Códigos |
| P4 | Assinatura eletrônica para aprovação | Seção 6, §2 |
| P5 | Rastreabilidade de revisão (número, data, resumo) | Seção 6, §2 |
| P6 | Arquivamento automático de obsoletos | Seção 6, §2 |
| P7 | Grupos de acesso baseados em função | Seção 6, §3 |
| P8 | Backup e proteção de informações | Seção 6, §4 |
| P9 | Distribuição via software/email | Seção 6 — Distribuição |
| P10 | Protocolo de implementação (RG-DOC.01) | Seção 6 — Distribuição |
| P11 | Lista Mestra para rastreamento de revisões | Seção 6 — Controle |
| P12 | Ciclo de reavaliação de 12 meses | Seção 6 — Revisão |
| P13 | Cópias controladas vs não-controladas | Seção 6 — Controle |
| P14 | Controle de documentos externos (SOGI) | Seção 6 — Externos |
| P15 | Retenção com períodos definidos e disposição | Seção 8 — Tratativa |

## Índice de Relatórios

| # | Módulo | Arquivo | Nota |
|---|--------|---------|------|
| 01 | GED / Documentos Hub | [01-ged-documentos-hub.md](01-ged-documentos-hub.md) | 3.5/5 |
| 02 | Controle de Documentos SGQ/ISO | [02-controle-documentos-sgq-iso.md](02-controle-documentos-sgq-iso.md) | 3.0/5 |
| 03 | Lista Mestra | [03-lista-mestra.md](03-lista-mestra.md) | 4.0/5 |
| 04 | Controle de Versões | [04-controle-versoes.md](04-controle-versoes.md) | 3.5/5 |
| 05 | Fluxos de Aprovação | [05-fluxos-aprovacao.md](05-fluxos-aprovacao.md) | 3.5/5 |
| 06 | Permissões e Controle de Acesso | [06-permissoes-controle-acesso.md](06-permissoes-controle-acesso.md) | 3.5/5 |
| 07 | Trilha de Auditoria | [07-trilha-auditoria.md](07-trilha-auditoria.md) | 3.0/5 |
| 08 | Extração AI de Documentos | [08-extracao-ai-documentos.md](08-extracao-ai-documentos.md) | 2.5/5 |
| 09 | Gestão de Fornecedores (Docs) | [09-gestao-fornecedores-documentos.md](09-gestao-fornecedores-documentos.md) | 2.5/5 |
| 10 | Documentos Regulatórios/Legais | [10-documentos-regulatorios-legais.md](10-documentos-regulatorios-legais.md) | 3.0/5 |
| 11 | Qualidade (SGQ) | [11-qualidade-sgq.md](11-qualidade-sgq.md) | 3.0/5 |
| 12 | Administração/Sistema | [12-administracao-sistema.md](12-administracao-sistema.md) | 2.0/5 |
| 13 | Cópias Controladas | [13-copias-controladas.md](13-copias-controladas.md) | 3.5/5 |
| — | **Resumo Executivo** | [99-RESUMO-EXECUTIVO.md](99-RESUMO-EXECUTIVO.md) | **3.1/5** |

## Matriz Cruzada: Requisitos ISO 7.5 × Módulos

| Sub-requisito | Módulos que cobrem |
|---------------|-------------------|
| 7.5.1 Generalidades | 01, 02, 03, 11 |
| 7.5.2 Criação/Atualização | 01, 02, 04, 05 |
| 7.5.3.1 Disponibilidade/Proteção | 01, 06, 08, 12 |
| 7.5.3.2a Distribuição/Acesso | 06, 09, 13 |
| 7.5.3.2b Armazenamento/Preservação | 01, 12 |
| 7.5.3.2c Controle de Alterações | 04, 05, 07 |
| 7.5.3.2d Retenção/Disposição | 07, 12 |
| 7.5.3.2e Documentos Externos | 09, 10 |
