# Revisão 2 — MasterProduct e sprints

Reauditoria em 23/10/2026, incorporando a direção completa de produto à comparação com o código. Esta revisão substitui as conclusões da primeira passagem que tratavam a ausência no código atual como ausência no produto futuro.

## Fontes e critério

- MasterProduct: `DATON_Master_Product_and_Delivery_Specification_v0.1.docx`, v0.1 de 05/09/2026, anexo da sprint **V1.0 — Data-Complete Daton** (id 5, chamada de sprint 1 na revisão).
- SHA-256 do anexo: `457550f1b1f58bd62f05e491b4cc5526ab075e6d5991c4b571141f06d8c5b219`.
- Recorte executivo e guias de novidades anexos à mesma sprint.
- Os anexos originais permanecem no backlog autenticado da sprint id 5; o hash acima identifica a versão consultada. A numeração P é um localizador desta extração, não um endereço público. O repositório da landing conserva a síntese e os critérios, sem copiar documentos internos para esse repositório.
- 43 tasks das sprints V1.0 (23) e Sprint 2 — V2.0 (20), com status, subtasks e registros de merge consultados. As 23 da V1.0 estão entregues; nenhuma das 20 da Sprint 2 tinha merge registrado nesta consulta. `Triagem`, `fazendo` e `revisão` não comprovam entrega.
- Código do sistema em `1f07bd8046e183139f8189f11c7310c8d9553ce5`, consultado sem alteração.

Os localizadores P abaixo são parágrafos não vazios do anexo, numerados durante a extração para esta auditoria; não são números de página do Word. O documento declara que não registra implantação (P0018) e diferencia estado executável e direção futura (P0041, P0073, P0101). A marca informal “Daton v2” do repositório atual não equivale ao marco futuro **V2.0 — Operational Daton**. A V1.0 cuida de dados e relações; a V2.0 de operações, cálculos, relatórios e integrações; a V3.0 de IA assistida (P0310).

Classificações: **atual** (implementado, sujeito a habilitação e acesso), **planejado** (compromisso futuro, ainda indisponível), **em revisão** (sem merge), **não objetivo** (limite explícito do produto) e **sem evidência específica** (não anunciar; ausência de evidência não significa exclusão definitiva).

## Capacidades reclassificadas

| Tema | Hoje | Direção no MasterProduct / sprint | Referência e status | Decisão editorial |
| --- | --- | --- | --- | --- |
| PDI | Competências, lacunas e treinamentos; sem fluxo PDI auditado | Planos de desenvolvimento individuais na Sprint 2 | Task #198, `triagem`; F19/F20; P8093–P8115, especialmente P8113 | Dizer “planejado para V2.0”; retirar a conclusão de que PDI é estranho ao produto |
| Agenda, atas, decisões e RAC | Processos e análise crítica com dados registrados | Fluxo integrado de reuniões, agenda, atas, decisões e RAC | F31/R09; P3180–P3232; #202 `triagem` | Preservar base atual e explicitar evolução V2.0; não confundir com gestão especializada de conselhos |
| Relatórios e BI | Saídas e painéis por módulo | Catálogo, relatórios programados, BI governado, linhagem e logs | F32/F35/R09; P3246–P3317, P8384–P8442; #203 `triagem` | Informar V2.0 planejada, sem prometer formatos universais ou conectores Power BI |
| Conectores, webhooks e jobs | Importação por planilha e saídas por módulo | Integrações aprovadas, erros, retry e reconciliação | F34/R11; P0406, P8502–P8560; #205 `triagem` | Planejado V2.0, dependente do contrato de cada conector; nenhuma marca é entrega garantida |
| Extração documental e mapeamento assistido | Assistente atual consulta dados; não recebe documentos | Propostas de campos com fonte, confiança e confirmação humana | F36/R12; P3602, P8679–P8737; DAT-V3-R12-003, sem task R12 nas sprints consultadas | Planejado V3.0; F36 admite casos aprovados na V2.0, sem evidência de entrega. Não chamar de OCR |
| Ações confirmadas no chat | Somente leitura | Ações autorizadas, confirmação, autoria e idempotência | #211 `triagem` (D71, Sprint 2); agentes supervisionados V3 em DAT-V3-R12-005, P8797–P8855 | Há evolução planejada; não anunciar escrita atual ou automação sem confirmação |
| Assistente com fontes e especialistas | Consultas limitadas às ferramentas autorizadas | Assistente contextual e especialistas por domínio, com revisão | DAT-V3-R12-002/004; P8620–P8678, P8738–P8796; sem task R12 consultada | Planejado V3.0; não ampliar a capacidade presente |
| Tendências, anomalias e recomendações | Não há motor preditivo auditado | Casos V3 por domínio: indicadores, ativos, clima e falhas | P9676, P9802, P9856, P9910 e mapas F×R | Planejado por caso; não equivale a forecast ou probabilidade de atingir metas |
| Formulários externos | Formulários internos versionados; portal específico de fornecedores | Distribuição e formulários externos delimitados | F33; P3377–P3382; internos #125 entregue; sem task externa específica | Externos planejados V2.0, sem link público genérico disponível hoje |
| Projetos e compensações | Inventário GEE com fatores versionados, cálculos por atividade e totais | Projetos e compensações separados da emissão bruta | F29; P3042–P3050 (estado desejado); base #124 entregue. P3084/#200 não explicitam projetos/compensações | Evolução futura, sem versão/task de entrega confirmada; não confundir com crédito negociável ou certificação |
| Metas reproduzíveis e cálculos ambientais | Registros ambientais e indicadores existentes | Fonte, fórmula, unidade, período e versão; meta e realizado compatíveis | R08; P8266–P8314; #201 `triagem` | Planejado V2.0; não prometer metas net zero, SBTi ou previsão climática |
| Consolidação e publicação ESG | Referenciais livres, temas, respostas, evidências, ODS e relato em rascunho | Coleta, consolidação, revisão, composição e publicação humana | F30; P3116, P3134, P3156–P3158; base #124 entregue, #200 `triagem` | Planejado V2.0; manter rascunho como capacidade atual |

## Conclusões que permanecem

| Tema | Classificação após consultar o Master | Motivo / evidência |
| --- | --- | --- |
| Financeiro transacional, contabilidade, folha, ponto, recrutamento e LMS completo | Não objetivo de substituição | P0307, P0385–P0387, P0399. Podem existir integrações futuras, sem transformar Daton nesses sistemas |
| BSC, OKRs, avaliação 360°, carreira e sucessão | Sem evidência específica | Objetivos, KPIs, competências e planos genéricos não comprovam essas metodologias ou pacotes |
| Gestão especializada de conselhos e comitês | Sem evidência específica | F31 cobre reuniões e decisões; não estabelece cadastro, mandato ou governança de órgãos colegiados |
| Saúde ocupacional/SST completa | Sem evidência específica | F24 cobre verificações do ambiente, instrumentos e calibração (P2654–P2678); isso não comprova exames, prontuários ou ASO |
| OCR, machine learning, forecast, probabilidade de metas, API pública e OAuth público | Sem evidência específica | O Master não assume essas tecnologias, previsões ou contratos públicos. Extração e anomalias planejadas não são equivalentes |
| SAP, TOTVS, Oracle, Protheus, Zapier, Power BI e IoT prontos | Sem evidência de conector contratado/entregue | P0406 exige sistema, contrato, direção, campos, autoridade, credenciais, custo e responsável antes do compromisso |
| Pacotes GRI, SASB, CDP e TCFD | Sem evidência específica | Referenciais configuráveis por organização; exemplos não viram compromisso universal (P3106–P3108, P3134, P3166) |
| Créditos negociáveis/certificados, ROI, simulador ESG, circularidade, efluentes, qualidade da água e diversidade | Sem evidência específica | Os domínios e tasks consultados não especificam esses produtos ou resultados |
| MFA, SOC 2, ISO 27001, versões AES/TLS, SLA e garantia de conformidade jurídica | Sem evidência para anunciar | Contratos de segurança não certificam implementação, operação ou conformidade; P3808–P3810 veda inferência jurídica |
| Documentação/ajuda ampliada da IA | Em revisão | Task #210 em revisão, sem merge; não amplia ferramentas de acesso a dados |

Importações (#126), formulários internos (#125), pessoas/treinamentos (#117), infraestrutura (#118), ambiente (#119) e clima/ESG (#124) têm registros de entrega. A copy mantém a condição de habilitação por empresa, domínio/destino e permissões; o merge isolado não comprova ativação universal.

## Aplicação na landing e no relatório

As mesmas posições de cards continuam descrevendo a base atual. Frases nos parágrafos existentes identificam a evolução como **planejada e ainda indisponível**, sem códigos de tasks, status ou versões internas na copy pública. FAQs e Documentação explicam os dois estados sem oferecer roteiros para telas futuras. Não foram adicionados cards, seções, estilos, imagens ou regras de disponibilidade.

O PDF revisado compara a landing original com a proposta final, explica quais conclusões da primeira auditoria mudaram e apresenta uma matriz de roadmap com status. Nenhum prazo de entrega foi criado e nenhuma capacidade foi implementada no painel nesta task.
