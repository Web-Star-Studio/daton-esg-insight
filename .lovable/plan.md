

# Adicionar Revisões Legadas na aba Revisões

## Abordagem
Adicionar um array estático de revisões legadas no componente `LAIARevisoes.tsx`, renderizado em uma seção separada "Histórico Legado" abaixo das revisões do sistema. São 13 registros (Rev 00 a Rev 12) que servem apenas como registro histórico — sem ações, sem detalhes clicáveis.

## Dados a inserir

| # | Título | Data |
|---|--------|------|
| 00 | Emissão inicial do documento | 25/08/2020 |
| 01 | Alteração item 5 e 5.3 | 04/12/2020 |
| 02 | Detalhamento controles operacionais | 17/12/2020 |
| 03 | Alteração FPLAN-003 para LIRA | 18/10/2021 |
| 04 | Inclusão Carregamento e Heliponto (PIR) e alteração Construção Civil (atual) (POA e PIR) | 30/05/2022 |
| 05 | Inclusão Museu (PIR) e Posto Abastecimento (POA) | 30/08/2022 |
| 06 | Inclusão Espaço Saúde (PIR); Central do Motorista (POA) e Elaboração LAIA SBC e Porto Real | 05/09/2023 |
| 07 | Revisão geral - análise crítica do documento | 03/10/2023 |
| 08 | Inclusão aspectos: ruído, odor, tonner e possibilidade de incêndio - POA, PIR | 23/10/2022 |
| 09 | Revisão Geral e análise crítica de POA e PIR; Elaboração LAIA de Duque de Caxias, Anápolis e São José dos Pinhais | 15/04/2024 |
| 10 | Revisão Geral (Queimadas Excessivas) | 24/09/2024 |
| 11 | Troca de Classificação dos Resíduos de acordo com NBR 10.004-2024, inclusão de Sala de Descanso em GO-CARREGAMENTO, Inclusão das Unidades ES, IRA e CHUÍ | 30/06/2025 |
| 12 | Perspectiva de estágio (ajustes) | — |

## Alteração

**Arquivo:** `src/components/laia/LAIARevisoes.tsx`
- Adicionar constante `LEGACY_REVISIONS` com os 13 registros
- Após a seção "Histórico de Revisões", renderizar um Card "Histórico Legado (FPLAN-002)" com os registros em lista estática
- Cada item mostra número, título e data — sem botões de ação
- Badge "Legado" em cada item para distinguir dos registros do sistema

