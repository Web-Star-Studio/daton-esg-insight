

# Plano: PRD LAIA - User Stories e Fluxos de Uso (PDF)

## Resumo

Gerar um PDF profissional com o PRD do modulo LAIA focado em User Stories e fluxos de uso, baseado na analise completa de 11 componentes, 4 services, 3 hooks e tipos do modulo.

## Estrutura do Documento

1. **Visao Geral do Modulo** - LAIA (Levantamento e Avaliacao dos Aspectos e Impactos Ambientais), alinhado a ISO 14001. 4 abas: Metodologia, Unidades, Revisoes, Configuracoes.

2. **Personas** - Gestor Ambiental (principal), Analista Ambiental, Administrador.

3. **Epicos e User Stories** organizados por fluxo:

   **Epico 1: Configuracao de Unidades**
   - US01: Configurar status de levantamento por unidade (Nao Levantado / Em Levantamento / Levantado)
   - US02: Alterar status em lote (selecao multipla + barra de acoes)
   - US03: Filtrar unidades visiveis (somente com status mapeado)

   **Epico 2: Gestao de Setores**
   - US04: Criar setor com codigo e nome (uniqueness: company_id + branch_id + code)
   - US05: Editar/desativar setor
   - US06: Excluir setores em lote (bulk delete)

   **Epico 3: Avaliacao de Aspectos Ambientais**
   - US07: Criar avaliacao via formulario multi-step (identificacao → caracterizacao → verificacao de importancia → significancia → controles → ciclo de vida)
   - US08: Calculo automatico de scores (Consequencia = Abrangencia x Severidade, FreqProb, Total, Categoria, Significancia)
   - US09: Geracao automatica de codigo de aspecto (setor.code + sequencial)
   - US10: Editar avaliacao existente (initialData prop, recalculo de scores)
   - US11: Excluir avaliacoes individuais e em lote
   - US12: Filtrar avaliacoes por setor, categoria, significancia, status, atividade

   **Epico 4: Importacao Excel (Wizard 5 etapas)**
   - US13: Upload de arquivo Excel (drag-and-drop, .xlsx/.xls, max 10MB)
   - US14: Selecao de filial destino (ou importar sem filial)
   - US15: Preview dos dados parseados (mapeamento automatico de colunas Gabardo)
   - US16: Validacao pre-importacao (campos obrigatorios, setores existentes vs novos, duplicatas)
   - US17: Importacao com criacao automatica de setores inexistentes (retry-query strategy)
   - US18: Download de template padrao

   **Epico 5: Dashboard e KPIs**
   - US19: Visualizar KPIs (Total, Significativos, Criticos, Nao Significativos) com click-to-filter
   - US20: Graficos de caracterizacao (Temporalidade, Situacao Operacional, Incidencia, Classe de Impacto)
   - US21: Estatisticas por unidade (branch stats)

   **Epico 6: Controle de Revisoes**
   - US22: Criar rascunho de revisao automaticamente ao modificar dados
   - US23: Rastrear mudancas como diffs (entity_type, field_name, old/new value)
   - US24: Validar revisao (usuario validador)
   - US25: Finalizar revisao com titulo e descricao (numero sequencial)
   - US26: Descartar revisao (remove log sem reverter dados)
   - US27: Visualizar historico de revisoes com detalhes enriquecidos

   **Epico 7: Metodologia**
   - US28: Consultar documento metodologico FPLAN-002
   - US29: Visualizar tabelas de scoring (Consequencia, FreqProb, Categoria, Significancia)

4. **Regras de Negocio** - Tabela de scoring, fluxo de significancia, constraint de unicidade de setores, isolamento multi-tenant.

5. **Fluxos de Uso** - Diagramas textuais dos fluxos principais (criacao de avaliacao, importacao Excel, ciclo de revisao).

6. **Modelo de Dados** - Tabelas: laia_sectors, laia_assessments, laia_revisions, laia_revision_changes, laia_branch_config.

## Implementacao

- Script Python com reportlab
- User stories no formato "Como [persona], quero [acao], para que [beneficio]"
- Criterios de aceite para cada user story
- Diagramas de fluxo em formato textual
- Saida: `/mnt/documents/PRD_LAIA_UserStories.pdf`
- QA visual obrigatorio

