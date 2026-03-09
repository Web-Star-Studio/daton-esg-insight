# Resumo Executivo — Análise ISO 9001:2015 Item 7.1.3

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 7.1.3 — Infraestrutura
**Documento de validação:** Conformidade de Sistema (Codebase Módulo de Ativos e IoT)

---

## Nota Global de Confiança: 4.5/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Gestão de Ativos (`Ativos.tsx`) | **4.7/5** | Maduro |
| 02 | Ownership e Inventário (`assetOwnership.ts`) | **4.3/5** | Funcional |
| 03 | Monitoramento Integrado (`iotConnectorService.ts`) | **4.6/5** | Maduro |
| | **Média aritmética** | **4.5/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 2 | Ativos, Monitoramento IoT |
| Funcional (3-3.9) | 1 | Ownership e Inventário |
| Parcial (2-2.9) | 0 | — |
| Mínimo/Ausente (0-1.9) | 0 | — |

---

## Top 5 Pontos Fortes

1. **Gestão de Ativos Centralizada** (4.7) — A interface `Ativos.tsx` serve como repositório mestre de infraestrutura, incluindo frota, maquinário e edifícios, garantindo o "proporcionamento" requerido pela norma.
2. **Conectividade IoT Avançada** (4.6) — O `iotConnectorService.ts` garante a "manutenção" preditiva através do monitoramento online de infraestrutura crítica.
3. **Rastreabilidade de Ownership** (4.3) — Serviços (`assetOwnership.ts`) identificam o vínculo entre processos, operadores e infraestrutura limitativa (software e hardware).

---

## Top 5 Lacunas Críticas

### 1. Manutenção Programada não Explicita (Severidade: ALTA)
**Impacto:** Item 7.1.3 (manter infraestrutura).
**Situação:** O sistema registra ativos, mas workflows automáticos de "Manutenções Preventivas / Ordens de Serviço" baseados em calendários podem carecer de painel unificado visível focado em Qualidade.
**Recomendação:** Incorporar status de "Próxima Manutenção Preventiva" no painel principal de ativos com alertas via e-mail.

---

## Cobertura por Sub-requisito 7.1.3

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| 7.1.3.a Edifícios e utilidades associadas | Coberto transversalmente no inventário de ativos e unidades físicas | Funcional |
| 7.1.3.b Equipamento (hardware e software) | Banco de dados robusto de cadastro de ativos/equipamentos e propriedade | Maduro |
| 7.1.3.c Recursos de transporte | Pode ser mapeado como ativo circulante / frota vinculada aos processos da empresa | Funcional |
| 7.1.3.d Comunicação e TI | Tratada intrinsecamente pela hospedagem em nuvem centralizada ("Daton") como plataforma validada de infraestrutura organizacional | Maduro |

---

## Cobertura Análise Codebase

| # | Requisito | Status | Nota |
|---|-----------|--------|------|
| P1 | Interface visual de gestão de frota/equipamento | ✅ | Página dedicada em `Ativos.tsx` |
| P2 | Monitoramento de manutenção de equipamentos | ⚠️ | Componentes focam mais no "cadastro", com viés futuro usando o IoT |
| P3 | Base de recursos com CRUD explícito | ✅ | Totalmente implementado |

**Resumo:** 2/3 implementados (✅), 1/3 parciais (⚠️), 0/3 ausentes (❌)

---

## Plano de Ação Priorizado

### Quick Wins (1-2 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Adicionar campo e relatório de "Próxima Revisão" dos ativos de transporte / maquinário | `Ativos.tsx` | Permite evidenciar cronograma de manutenção de recursos (SGQ) |

---

## Conclusão

Nota global de **4.5/5.0 (Sistema Maduro)**. 
O controle de infraestrutura, equipamentos tecnológicos e veículos abordado no 7.1.3 está em bom nível no Daton ESG através do Módulo de Ativos. As bases para inventário (Determinação e Provisão) são robustas. O foco posterior deverá ser o endurecimento visual do ciclo de Manutenção ("Manter").
