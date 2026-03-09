# Resumo Executivo — Análise ISO 9001:2015 Item 5.2

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 5.2 — Política
**Documento(s) de validação:** `MSG-01 - Manual do SGI.docx` (assumido pelas diretrizes do contexto)

---

## Nota Global de Confiança: 3.5/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Controle de Documentos (`/controle-documentos`) | **4.0/5** | Maduro |
| 02 | Módulo GRI e Transparência (`CommunicationTransparencyDataModule`) | **3.5/5** | Funcional |
| 03 | Comunicação Interna e Externa da Política SGI | **3.0/5** | Funcional |
| | **Média aritmética** | **3.5/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 1 | Controle de Documentos |
| Funcional (3-3.9) | 2 | GRI / Transparência, Comunicação |
| Parcial (2-2.9) | 0 | - |
| Mínimo/Ausente (0-1.9) | 0 | - |

---

## Top 5 Pontos Fortes

1. **Gestor Eletrônico de Documentos (GED) Estruturado** (4.0/5) — Módulo base para manutenção da "Política de gestão formalmente definida" (ISO 5.2.1), retendo o controle de versionamento, aprovação e disponibilidade para as partes interessadas.

2. **GRI Transparência Sustentando 5.2** (3.5/5) — Interface aborda a Política Estratégica formal do negócio englobando Inclusividade, Responsividade e Materialidade avaliados no `CommunicationTransparencyDataModule`.

3. **Auditoria Transacional e Histórico** (4.0/5) — Permite provar documentalmente que a política está mantida como informação documentada (ISO 5.2.2 a).

---

## Top 2 Lacunas Críticas

### 1. Ausência de Check de Aceite Eletrônico da Política (Severidade: ALTA)
**Impacto:** ISO 5.2.2 b) "ser comunicada, entendida e aplicada na organização"
**Situação:** A organização pode subir o FPLAN/Manual SGI com a Política, porém não existe um workflow nativo para disparar a Política SGI atualizada para os colaboradores (stakeholders internos) coletando um "li e aceito".
**Recomendação:** Incluir no hub de comunicação ou no módulo de treinamentos um motor para exigir ciência formal das atualizações na Política de Gestão (assinatura eletrônica simples ou log de aceite in-app).

### 2. Painel Consolidado de Diretrizes Estratégicas SGI (Severidade: MÉDIA)
**Impacto:** ISO 5.2.1 e 5.2.2 c) "estar disponível para partes interessadas pertinentes"
**Situação:** O sistema trata a Política como um "documento em PDF/Docx qualquer" no meio de Procedimentos em `/controle-documentos`. 
**Recomendação:** Criar uma aba ou destaque visual permanente para a "Política do SGI Vingente" (`is_core_policy=true`), garantindo que tanto colaboradores quanto auditores vejam as premissas sempre que acessarem o painel de Qualidade e Compliance.

---

## Cobertura por Sub-requisito ISO 5.2

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| 5.2.1 Estabelecendo a Política | Base via módulo de Manuais/SGI, alavancando as metas rastreadas em SDGs e objetivos ESG. | Funcional |
| 5.2.2 a) Mantida como informação documentada | GED interno de Controle de Documentos resolve a manutenção e proteção. | Maduro |
| 5.2.2 b) Comunicada e compreendida | Restrita aos usuários do sistema que engajam na leitura; falta comprovação automática e em escala do entendimento. | Parcial |
| 5.2.2 c) Disponível as partes interessadas | Stakeholders mapeados no Communication Hub; o administrador pode engajar ativamente encaminhando, mas não há um "portal do fornecedor/comunitário" público por default para disponibilizá-la. | Funcional |

---

## Plano de Ação Priorizado

### Quick Wins (1-2 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Adicionar flag "Política do SGI" no Banco de Dados para dar destaque visual ao documento na listagem principal e na home | 01 | Visibilidade 5.2.1 |
| 2 | Envio da nova política via Stakeholder Communication Hub com template padronizado e com aviso de recebimento ativo | 02 | ISO 5.2.2 b, c |

---

## Conclusão

A plataforma cumpre satisfatoriamente com os requisitos de retenção, atualização e distribuição estruturada, suportando assim a comprovação exigida pelo item 5.2 da ISO 9001:2015 com pontuação **3.5/5 (Funcional)**. 

Os desafios prioritários referem-se à efetiva coleta de evidências de compreensão pelos funcionários e fornecedores. Ao plugar a gestão de documentos com um fluxo nativo de "assinatura de ciência", o item 5.2 da ISO passará imediatamente para classificação "Madura".
