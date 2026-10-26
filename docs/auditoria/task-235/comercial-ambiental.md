# Copy comercial — Ambiental, Social, Governança e Tecnologia

Revisão: 2026-10-26

Base: `3de3f70f`

Escopo: `esgAreas.ts`, `ESGAreaTemplate.tsx`, `ESGAmbiental.tsx`, `ValueProposition.tsx` e `TechStack3D.tsx`.

## Critério editorial

A landing apresenta a visão integral do produto definida no MasterProduct. O texto comercial pode comunicar a capacidade-alvo, sem tratar a ausência no código atual como exclusão da oferta. Isso não transforma direção de produto em comprovação de implantação, prazo, certificação ou disponibilidade universal.

A revisão preservou literalmente a hierarquia, a quantidade e a ordem dos slots, o markup, classes, estilos, ícones, imagens e comportamento. Somente strings foram alteradas.

## Rastreabilidade das mudanças

| Recorte | Antes | Depois | Motivo comercial | F-ID e localizadores do MasterProduct |
| --- | --- | --- | --- | --- |
| Hero Ambiental | Registro de emissões, resíduos e requisitos, condicionado a módulos habilitados | Monitoramentos, emissões, resíduos, prazos, metas, cálculos, alertas, projetos de compensação e relatos ESG conectados | Comunicar o ciclo ambiental completo, da fonte ao relato, sem expor linguagem de rollout | F27: P2928–P2938; F29: P3042–P3078; F30: P3116–P3158 |
| Recursos, resíduos e licenças | Cadastros, MTR/CDF e prazos descritos como inventário funcional | Consumos de água, energia e químicos; movimentações e destinação; alertas, responsáveis, evidências e relatórios | Mostrar gestão operacional contínua, mantendo fontes, prazos e provas como diferenciais | F27: P2928–P2946; F10/F15: P1700–P1734 e relações ambientais |
| Clima e carbono | Inventário, fatores versionados, totais e CSV | Cálculo reproduzível, metas por escopo, projetos, compensações separadas e relatórios | Representar a visão climática integral sem confundir compensação com redução bruta ou crédito certificado | F29: P3042–P3062, P3076–P3094 |
| ESG e relato | Referenciais e evidências em relato rascunho condicionado | Referenciais escolhidos, indicadores e evidências conectados a revisão e publicação controladas | Posicionar relato como fluxo governado e configurável, sem anunciar pacote universal de frameworks ou certificação | F30: P3106–P3136, P3150–P3168 |
| Social | Competências, treinamentos e comunicação; PDI rotulado como indisponível | Competências, lacunas, PDI, aprendizagem, eficácia e comunicação como ciclo integrado | Comunicar desenvolvimento de pessoas e aprendizagem como proposta completa sem prometer folha, recrutamento ou LMS próprio | F19: P2292–P2338; F20: P2366–P2420; F21: P2440–P2494; R07: P8093–P8113 |
| Governança | Riscos, auditorias e indicadores; atas e decisões rotuladas como indisponíveis | Estratégia, riscos, indicadores, reuniões, pautas, atas, decisões, ações e RAC | Mostrar o ciclo executivo da fonte à decisão e à ação acompanhada | F31: P3180–P3242; F08/F09: P1478–P1530 e P1552–P1606 |
| Inteligência artificial | Consulta somente leitura; extração rotulada como indisponível | Consulta com fontes, extração, comparação, mapeamento, recomendações e ações com prévia e confirmação humana | Apresentar inteligência assistida e governada, sem autonomia irrestrita nem previsão probabilística genérica | F36: P3550–P3612; princípios: P0464–P0468; ferramentas governadas: P8807–P8851 |
| Plataforma | API, banco e infraestrutura descritos em linguagem técnica | Dados e módulos conectados, relações sem duplicar fontes, histórico, evidências e fluxo do dado à decisão | Converter implementação técnica em valor comercial compreensível | Visão: P0307–P0310, P0345–P0377; contratos: P0445–P0458 |
| Acesso e segurança | JWT, banco, organização e jargão de arquitetura | Acesso por papel, módulo e abrangência; separação por organização; arquivos, decisões e alterações rastreáveis | Comunicar confiança pelo efeito percebido, sem anunciar algoritmo, protocolo ou certificação | F05: P1256–P1318; princípios: P0464, P0654–P0664 |
| Entrada e saída de dados | Importação por planilha e exportações disponíveis | Mapeamento, prévia, erros por linha, confirmação, reconciliação e exportação com fonte e filtros | Mostrar governança do dado sem prometer ERP, conector ou formato universal | F34: P0699–P0711; regras transversais: P0635–P0656 |
| Blocos quantitativos | Web, perfis, empresa e histórico | Fonte, dono, prazo e prova | Usar os quatro slots existentes para comunicar a proposta central do MasterProduct, sem inventar SLA, volume ou prazo de implantação | North Star e proposta: P0345–P0375; ciclo: P0493–P0515 |

## Limites preservados

- Não foi prometido monitoramento externo universal em tempo real, conformidade automática ou certificação.
- Não foram anunciados GRI, SASB, CDP, TCFD ou qualquer outro framework como pacote pronto e universal; os referenciais são escolhidos pela organização.
- Compensações aparecem separadas das emissões brutas. O texto não promete crédito negociável, certificação de carbono, net zero ou metodologia específica.
- A IA não foi descrita como OCR, modelo probabilístico ou agente autônomo. Extração e mapeamento são assistidos; recomendações e ações permanecem sujeitas a fontes, permissões, prévia e confirmação humana.
- Não foram prometidos ERP, conectores específicos, SST completa, diversidade, avaliação 360°, recrutamento, folha ou LMS próprio.

## Resultado editorial

O recorte deixa de narrar somente o inventário técnico atual e passa a vender a visão MasterProduct: dados confiáveis alimentam operação, decisão, evidência, relato e inteligência assistida. A redação diferencia essa promessa de produto de garantias de implantação, certificação, prazo ou disponibilidade universal.

## Revisão visual em 375 px

Títulos de Social e Governança foram condensados e rótulos das métricas viraram “Execução” e “Controle” para caber nos espaços existentes sem mudar CSS. A barra fixa dos heros Social/Governança já se sobrepõe ao parágrafo secundário na base; seu posicionamento foi preservado por se tratar de uma revisão exclusivamente textual.
