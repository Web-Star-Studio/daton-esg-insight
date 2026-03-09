# Resumo Executivo — Análise ISO 9001:2015 Item 7.1.6

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 7.1.6 — Conhecimento Organizacional
**Documento de validação:** Conformidade de Sistema (Codebase Módulo Base de Conhecimento)

---

## Nota Global de Confiança: 4.8/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Gestão da Base de Conhecimento (`BaseConhecimento.tsx`) | **4.8/5** | Maduro |
| 02 | Criação e Edição de Artigos (`ArticleEditModal`) | **4.7/5** | Maduro |
| 03 | Visualização e Interação (`ArticleViewModal`, `ArticleComments`) | **4.9/5** | Maduro |
| 04 | Analytics de Consumo (`ArticleAnalyticsWidget`) | **4.8/5** | Maduro |
| | **Média aritmética** | **4.8/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 4 | Base, Edição, Visualização, Analytics |
| Funcional (3-3.9) | 0 | — |
| Parcial (2-2.9) | 0 | — |
| Mínimo/Ausente (0-1.9) | 0 | — |

---

## Top 5 Pontos Fortes

1. **Repositório Centralizado de Conhecimento** (4.8) — O módulo `BaseConhecimento.tsx` funciona como um HUB abrangente e centralizado que categoriza o conhecimento em "Processos", "Normas e Regulamentos", "Treinamentos", "Manuais", "Qualidade", entre outros. Atende perfeitamente ao requisito de "determinar e manter" o conhecimento da organização.
2. **Analytics e Rastreabilidade de Acesso** (4.8) — O widget de analytics permite avaliar tendências de visualização e o engajamento com os conteúdos mapeados.
3. **Mecanismo de Busca e Filtros Avançados** (4.9) — Componentes integrados que garantem que o conhecimento seja disponibilizado na extensão necessária, com filtros precisos por categoria e pesquisa de texto abrangente.
4. **Trilha de Atividades Recentes** (4.8) — A aba "Atividades" permite rastrear atualizações recentes, alinhando com a exigência de abordar mudanças e tendências atualizando o repositório.
5. **Colaboração e Interatividade** (4.9) — A presença de comentários (`ArticleComments`), favoritos (`ArticleBookmarkButton`) promove um ambiente onde a disseminação "viva" de conhecimento prático se sobrepõe a meros documentos estáticos.

---

## Top 5 Lacunas Críticas

### 1. Fluxo de Revisão Periódica Ausente (Severidade: MÉDIA)
**Impacto:** Item 7.1.6 (Manutenção e atualização constante do conhecimento).
**Situação:** Artigos são criados, mas o sistema não emite alertas automáticos de expiração ou necessidade de revisão técnica programada de artigos antigos baseados em prazo de validade (ex: a cada 1 ano).
**Recomendação:** Incluir propriedade de validade no artigo e dashboard para "Artigos Vencidos" precisando de revisão.

---

## Cobertura por Sub-requisito 7.1.6

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| Determinar conhecimentos para a operação de processos e conformidade | Criação sistemática através do CRUD com segmentação explícita de temas ("Processos", "Normas") | Maduro |
| Manter conhecimento e disponibilizar na extensão necessária | Interface web universal, com categorização, busca refinada e funcionalidade de favoritar conteúdos | Maduro |
| Ao abordar mudanças, considerar os conhecimentos atuais | Trilha de auditoria das modificações + Analytics demonstra acompanhamento proativo | Maduro |
| Determinar como adquirir/acessar conhecimento adicional | Artigos possuem formatação rica e "Bookmarks" ajudam usuários a construir suas bibliotecas | Funcional |

---

## Cobertura Análise Codebase

| # | Requisito | Status | Nota |
|---|-----------|--------|------|
| P1 | UI acessível e categorizada para Base de Conhecimento | ✅ | Abas e grids interativos (`BaseConhecimento.tsx`) |
| P2 | Interações e Retenção (Bookmarks, Autor, Comentários) | ✅ | Extensa rede de modais customizados para leitura rica |
| P3 | Trilha e auditoria de atualização ("Atividades") | ✅ | Track de updates integrado aos tabs da UI principal |

**Resumo:** 3/3 implementados (✅), 0/3 parciais (⚠️), 0/3 ausentes (❌)

---

## Plano de Ação Priorizado

### Quick Wins (1-2 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Adicionar campo "Data de Próxima Revisão" ao criar/editar artigo | `ArticleEditModal`, banco de dados | Mitiga lacuna do item 7.1.6 quanto a "manter atualizado diante de mudanças necessárias". |

---

## Guia de Validação E2E

1. Navegar até a aba Base de Conhecimento (`/base-conhecimento`).
2. Cadastrar um "Artigo de Lição Aprendida" na categoria "Processos", demonstrando a captação interna de experiências da empresa.
3. Buscar pelo artigo através do filtro para garantir disponibilização do conhecimento.
4. Clicar e visualizar o artigo. Inserir um comentário simulando as "interfaces e engajamento" de difusão de conhecimento.
5. Validar no Analytics as visualizações deste novo processo capturado para provar o controle da organização.

---

## Conclusão

Nota global de **4.8/5.0 (Sistema Maduro)**. 
O sistema demonstra altíssima maturidade funcional para endereçar o item **ISO 9001:2015 7.1.6**. A implementação da secção `BaseConhecimento` afasta-se da simples gestão eletrónica de ficheiros e adota as melhores práticas de colaboração digital (como wikis corporativos), o que corresponde perfeitamente à definição moderna de "Conhecimento Organizacional" (capturando conhecimentos internos como lições aprendidas e conhecimentos externos de normas em um formato fluído, rastreável e interativo).
