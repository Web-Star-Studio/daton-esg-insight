import type { Theme } from "./types";
import { EXTRACTED_THEMES } from "./themes_extracted";

const CORE_THEMES: Theme[] = [
  {
    id: "licenciamento",
    number: 1,
    title: "Licenciamento",
    questions: [
      {
        id: "lic.q1",
        number: "1",
        label: "A unidade está sujeita ao licenciamento ambiental?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["licenciamento_ambiental"] },
          {
            id: "em_andamento",
            label: "Licenciamento em andamento/processo em andamento",
            tags: ["licenciamento_ambiental", "licenciamento_em_andamento"],
          },
          { id: "dispensa", label: "Possui declaração/certidão de dispensa", tags: ["licenciamento_dispensa"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "lic.q1_1",
        number: "1.1",
        label: "Em qual âmbito o licenciamento ambiental é exigido?",
        type: "multi",
        showIf: { questionId: "lic.q1", anyOf: ["sim", "em_andamento"] },
        options: [
          { id: "federal", label: "Federal", tags: ["licenciamento_federal"] },
          { id: "estadual", label: "Estadual", tags: ["licenciamento_estadual"] },
          { id: "municipal", label: "Municipal", tags: ["licenciamento_municipal"] },
        ],
      },
      {
        id: "lic.q1_2",
        number: "1.2",
        label: "No licenciamento da unidade, foi exigido EIA/RIMA?",
        type: "single",
        showIf: { questionId: "lic.q1", anyOf: ["sim", "em_andamento"] },
        options: [
          { id: "sim", label: "Sim", tags: ["eia_rima"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "lic.q1_3",
        number: "1.3",
        label: "No licenciamento da unidade, a compensação ambiental foi exigida?",
        type: "multi",
        showIf: { questionId: "lic.q1", anyOf: ["sim", "em_andamento"] },
        options: [
          { id: "sim", label: "Sim", tags: ["compensacao_ambiental"] },
          { id: "financeira", label: "Financeira", tags: ["compensacao_financeira"] },
          { id: "mitigadoras", label: "Outras Medidas Mitigadoras", tags: ["medidas_mitigadoras"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "lic.q1_4",
        number: "1.4",
        label: "No licenciamento da unidade, foram executadas audiências públicas?",
        type: "single",
        showIf: { questionId: "lic.q1", anyOf: ["sim", "em_andamento"] },
        options: [
          { id: "sim", label: "Sim", tags: ["audiencia_publica"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "lic.q1_5",
        number: "1.5",
        label: "Número do protocolo do processo de licenciamento",
        type: "text",
        showIf: { questionId: "lic.q1", anyOf: ["em_andamento"] },
      },
      {
        id: "lic.q1_6",
        number: "1.6",
        label: "Órgão licenciador responsável (ex: IBAMA, SEMA/SEMMA do estado/município)",
        type: "text",
        showIf: { questionId: "lic.q1", anyOf: ["em_andamento"] },
      },
      {
        id: "lic.q1_7",
        number: "1.7",
        label: "Data do protocolo (mês/ano)",
        type: "text",
        showIf: { questionId: "lic.q1", anyOf: ["em_andamento"] },
      },
      {
        id: "lic.q1_8",
        number: "1.8",
        label: "Em que fase está o processo?",
        type: "single",
        showIf: { questionId: "lic.q1", anyOf: ["em_andamento"] },
        options: [
          { id: "lp", label: "Licença Prévia (LP)", tags: ["fase_lp"] },
          { id: "li", label: "Licença de Instalação (LI)", tags: ["fase_li"] },
          { id: "lo", label: "Licença de Operação (LO)", tags: ["fase_lo"] },
          { id: "outra", label: "Outra/Não sei" },
        ],
      },
      {
        id: "lic.q2",
        number: "2",
        label:
          "A unidade está sujeita ao Cadastro Técnico Federal (IBAMA) e/ou Cadastro Técnico Estadual e/ou Municipal?",
        type: "multi",
        options: [
          { id: "federal", label: "Federal", tags: ["ctf_ibama"] },
          { id: "estadual", label: "Estadual", tags: ["ctf_estadual"] },
          { id: "municipal", label: "Municipal", tags: ["ctf_municipal"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "lic.q3",
        number: "3",
        label: "Qual o porte da empresa?",
        type: "single",
        options: [
          { id: "micro", label: "Micro-empresa (LC 123/2006)", tags: ["porte_micro"] },
          { id: "pequena", label: "Pequena (LC 123/2006)", tags: ["porte_pequena"] },
          {
            id: "media",
            label: "Média (receita anual > R$ 1.200.000 e ≤ R$ 12.000.000)",
            tags: ["porte_media"],
          },
          { id: "grande", label: "Grande (receita anual > R$ 12.000.000)", tags: ["porte_grande"] },
        ],
      },
      {
        id: "lic.q4",
        number: "4",
        label:
          "A empresa realiza acesso/remessa de patrimônio genético e/ou ao conhecimento tradicional associado para pesquisa científica, bioprospecção e desenvolvimento tecnológico?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["patrimonio_genetico"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "lic.q5",
        number: "5",
        label: "A unidade está sujeita à elaboração de Plano de Recuperação de Área Degradada (PRAD)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["prad"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "lic.q6",
        number: "6",
        label: "Documentos externos a monitorar como 'outros requisitos'",
        type: "multi",
        options: [
          { id: "pol_sso", label: "Política de Saúde e Segurança Ocupacional", tags: ["politica_sso"] },
          {
            id: "lic_transp_perigosos",
            label: "Licenças Ambientais das Transportadoras de Produtos Perigosos",
            tags: ["transporte_perigosos"],
          },
          {
            id: "comprov_taxa_fiscaliz",
            label: "Comprovante de Pagamento de Taxa de Fiscalização Ambiental",
            tags: ["taxa_fiscalizacao_ambiental"],
          },
          { id: "lic_ambientais", label: "Licenças Ambientais", tags: ["licenciamento_ambiental"] },
          {
            id: "lic_prod_controlados",
            label: "Licenças Para Uso de Produtos Controlados",
            tags: ["produtos_controlados"],
          },
          { id: "ctf_ibama", label: "Cadastro Técnico Federal - IBAMA", tags: ["ctf_ibama"] },
          {
            id: "alvara_localizacao",
            label: "Alvará de Localização e Funcionamento",
            tags: ["alvara_funcionamento"],
          },
          {
            id: "outorga_recurso_hidrico",
            label: "Outorga de Direito de Uso de Recurso Hídrico",
            tags: ["outorga_hidrica"],
          },
          { id: "avcb", label: "AVCB", tags: ["avcb"] },
          {
            id: "alvara_sanitario",
            label: "Alvarás Sanitários de Ambulatório e Refeitório",
            tags: ["alvara_sanitario"],
          },
          { id: "politica_empresa", label: "Política da Empresa", tags: ["politica_empresa"] },
          {
            id: "fluxograma",
            label: "Fluxograma do Processo Produtivo",
            tags: ["fluxograma_processo"],
          },
          { id: "inventario_residuos", label: "Inventário de Resíduos", tags: ["residuos"] },
          { id: "balanco_energia", label: "Balanço de Energia", tags: ["energia"] },
          {
            id: "lic_destinacao_residuos",
            label: "Licenciamento de Destinação de Resíduos Industriais",
            tags: ["residuos_industriais"],
          },
          { id: "acordo_coletivo", label: "Acordo Coletivo de Trabalho", tags: ["acordo_coletivo"] },
          { id: "convencao_coletiva", label: "Convenção Coletiva de Trabalho", tags: ["convencao_coletiva"] },
          { id: "autos_infracao", label: "Autos de Infração", tags: ["autos_infracao"] },
          { id: "exigencias_clientes", label: "Exigências de Clientes", tags: ["exigencias_clientes"] },
          {
            id: "controle_documentos",
            label: "Controle e Atualização de Documentos",
            tags: ["controle_documentos"],
          },
          {
            id: "lic_fornecedores",
            label: "Licenças e Outros Docs. de Fornecedores / Prestadores de Serviço",
            tags: ["docs_fornecedores"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },
  {
    id: "instalacoes",
    number: 2,
    title: "Instalações",
    questions: [
      {
        id: "inst.q1",
        number: "1",
        label: "As atividades da unidade geram emissão de vibrações contínuas?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["vibracoes"] },
          { id: "nao", label: "Não" },
        ],
      },
      {
        id: "inst.q2",
        number: "2",
        label: "Informe a área (metragem) da empresa — área construída e área total do terreno.",
        type: "text",
        required: false,
      },
      {
        id: "inst.q3",
        number: "3",
        label:
          "Informe a quantidade de colaboradores — discriminar funcionários próprios e terceirizados fixos.",
        type: "text",
        required: false,
      },
      {
        id: "inst.q4",
        number: "4",
        label:
          "Relate todos os serviços e/ou produtos desenvolvidos pela unidade e, no caso de produtos, as principais matérias-primas utilizadas.",
        type: "textarea",
        required: false,
      },
      {
        id: "inst.q5",
        number: "5",
        label:
          "Descreva as atividades realizadas e produtos/serviços desenvolvidos que fazem parte do escopo do sistema de gestão/compliance da empresa.",
        type: "textarea",
        required: false,
      },
      {
        id: "inst.q6",
        number: "6",
        label: "A unidade realiza reformas ou obras de construção civil?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["construcao_civil"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q7",
        number: "7",
        label: "Qual tipo de armazenamento/estocagem a unidade utiliza?",
        type: "multi",
        options: [
          { id: "silos", label: "Silos (Aéreo, Bag, de Superfície etc)", tags: ["silos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q8",
        number: "8",
        label: "As instalações são providas de rede pública de água e esgoto?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["rede_publica_agua"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q8_1",
        number: "8.1",
        label: "Qual a concessionária de serviço público de água e esgoto?",
        type: "single",
        showIf: { questionId: "inst.q8", anyOf: ["sim"] },
        options: [
          { id: "estadual", label: "Estadual", tags: ["concessionaria_estadual"] },
          { id: "municipal", label: "Municipal", tags: ["concessionaria_municipal"] },
        ],
      },
      {
        id: "inst.q9",
        number: "9",
        label: "Existem subestações elétricas?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["subestacoes_eletricas"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q10",
        number: "10",
        label: "Há transformadores?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["transformadores"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q11",
        number: "11",
        label: "Existem atmosferas potencialmente explosivas?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["atmosferas_explosivas"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q12",
        number: "12",
        label: "Há geradores de energia a diesel?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["geradores_diesel", "emissoes"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q13",
        number: "13",
        label: "A unidade possui consultório odontológico?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["consultorio_odontologico"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q14",
        number: "14",
        label: "A unidade possui ambulatório?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["ambulatorio"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q15",
        number: "15",
        label: "A unidade possui refeitório?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["refeitorio"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q15_1a",
        number: "15.1",
        label: "O estabelecimento é enquadrado como:",
        type: "single",
        showIf: { questionId: "inst.q15", anyOf: ["sim"] },
        options: [
          { id: "cozinha_industrial", label: "Cozinha Industrial", tags: ["cozinha_industrial"] },
          {
            id: "area_alimentacao",
            label: "Apenas área para alimentação (sem preparo de alimentos)",
            tags: ["area_alimentacao"],
          },
        ],
      },
      {
        id: "inst.q15_1b",
        number: "15.1",
        label: "A prestação de serviço de alimentação é terceirizada?",
        type: "single",
        showIf: { questionId: "inst.q15", anyOf: ["sim"] },
        options: [
          { id: "sim", label: "Sim", tags: ["alimentacao_terceirizada"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q16",
        number: "16",
        label: "A unidade possui laboratório?",
        type: "multi",
        options: [
          { id: "ensaios", label: "Laboratório de Ensaios e/ou Calibração", tags: ["lab_ensaios"] },
          {
            id: "clinico",
            label: "Laboratório Clínico (análise de amostras, exames PCMSO)",
            tags: ["lab_clinico"],
          },
          {
            id: "agua",
            label: "Lab. físico-químicas/microbiológicas de potabilidade de água",
            tags: ["lab_agua"],
          },
          {
            id: "alimentos",
            label: "Lab. físico-químicas/microbiológicas em alimentos",
            tags: ["lab_alimentos"],
          },
          {
            id: "ambientais",
            label: "Lab. de análises ambientais (emissões, efluentes, solo, águas)",
            tags: ["lab_ambientais"],
          },
          { id: "patologia", label: "Patologias Clínicas", tags: ["lab_patologia"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q17",
        number: "17",
        label: "A unidade possui trabalhadores alojados?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["alojamento_trabalhadores"] },
          { id: "nao", label: "Não" },
        ],
      },
      {
        id: "inst.q18",
        number: "18",
        label: "Existem barragens no site da unidade?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["barragens"] },
          {
            id: "reservatorio",
            label: "Somente reservatório de água, represa ou lagos artificiais (não caracterizados como barragem)",
            tags: ["reservatorio_agua"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q19",
        number: "19",
        label: "Existe alguma área ou instalação na unidade alvo de tombamento?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["tombamento"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q20",
        number: "20",
        label: "Existe área de armazenamento de contêiner (não considerar IBC's plásticos)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["armazenamento_conteiner"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q21",
        number: "21",
        label: "A unidade possui heliponto?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["heliponto"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q22",
        number: "22",
        label: "Existem escadas rolantes, esteiras ou rampas na empresa?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["escadas_rolantes"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q23",
        number: "23",
        label: "Qual a média de circulação/concentração de pessoas?",
        type: "single",
        options: [
          { id: "<200", label: "Inferior a 200 pessoas", tags: ["circulacao_baixa"] },
          { id: "201_299", label: "Entre 201 e 299 pessoas", tags: ["circulacao_media"] },
          { id: ">=300", label: "Igual ou superior a 300 pessoas", tags: ["circulacao_alta"] },
          { id: ">=500", label: "Igual ou superior a 500 pessoas", tags: ["circulacao_500"] },
          { id: ">=1000", label: "Igual ou superior a 1.000 pessoas", tags: ["circulacao_1000"] },
          { id: ">=1500", label: "Igual ou superior a 1.500 pessoas", tags: ["circulacao_1500"] },
          { id: ">=2000", label: "Igual ou superior a 2.000 pessoas", tags: ["circulacao_2000"] },
          { id: ">=5000", label: "Igual ou superior a 5.000 pessoas", tags: ["circulacao_5000"] },
        ],
      },
      {
        id: "inst.q24",
        number: "24",
        label: "A unidade realiza atividade de desinfecção e esterilização de produtos ou materiais?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["desinfeccao_esterilizacao"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q25",
        number: "25",
        label: "Quais os meios de suspensão ou tração que a unidade utiliza?",
        type: "multi",
        options: [
          { id: "talhas", label: "Talhas", tags: ["talhas"] },
          { id: "polia", label: "Polia", tags: ["polia"] },
          { id: "correntes", label: "Correntes", tags: ["correntes"] },
          { id: "ganchos", label: "Ganchos", tags: ["ganchos"] },
          { id: "cabos_aco", label: "Cabos de Aço", tags: ["cabos_aco"] },
          { id: "outros", label: "Outros", tags: ["suspensao_outros"] },
          { id: "nenhum", label: "Nenhuma das Anteriores" },
        ],
      },
      {
        id: "inst.q26",
        number: "26",
        label: "A unidade realiza (ou pode vir a realizar) parcelamento do solo?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["parcelamento_solo"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q27",
        number: "27",
        label: "A unidade possui em seu site cercas energizadas/elétricas?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["cercas_energizadas"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q28",
        number: "28",
        label:
          "A unidade realiza atividade que possa ser foco de atração de pássaros em raio de 20 km de aeroportos por instrumento ou 13 km de demais aeródromos?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["atracao_passaros_aeroportos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q29",
        number: "29",
        label:
          "Existem fontes de ruído na unidade ou são realizadas atividades que possam produzir ruído além dos limites das instalações?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["ruido_externo"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "inst.q30",
        number: "30",
        label:
          "A unidade possui lagoa de tratamento (estrutura em solo destinada ao tratamento e/ou armazenamento temporário de efluentes/resíduos)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["lagoa_tratamento"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },
  {
    id: "localizacao_fauna_flora",
    number: 3,
    title: "Localização / Fauna / Flora",
    questions: [
      {
        id: "loc.q1",
        number: "1",
        label: "A unidade encontra-se em região rural, industrial ou urbana?",
        type: "multi",
        options: [
          { id: "mista", label: "Mista", tags: ["regiao_mista"] },
          { id: "rural", label: "Rural", tags: ["regiao_rural"] },
          { id: "urbana", label: "Urbana", tags: ["regiao_urbana"] },
          { id: "industrial", label: "Industrial", tags: ["regiao_industrial"] },
        ],
      },
      {
        id: "loc.q1_1",
        number: "1.1",
        label: "Encontra-se em região metropolitana?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["regiao_metropolitana"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q2",
        number: "2",
        label: "O site da unidade possui áreas verdes?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["areas_verdes"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q3",
        number: "3",
        label: "Existem animais da fauna silvestre em cativeiro?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["fauna_cativeiro"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q4",
        number: "4",
        label: "Existe RPPN (Reserva Particular do Patrimônio Natural) constituída pela unidade?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["rppn"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q5",
        number: "5",
        label:
          "A unidade encontra-se em área com ocorrência de patrimônio histórico, arqueológico ou fósseis?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["patrimonio_historico"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q6",
        number: "6",
        label: "A unidade está localizada em zona costeira?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["zona_costeira"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q7",
        number: "7",
        label: "Selecione os locais onde a unidade realiza atividades:",
        type: "multi",
        options: [
          { id: "aeroporto", label: "Aeroporto", tags: ["aeroporto"] },
          { id: "ferroviario", label: "Terminais Ferroviários", tags: ["terminal_ferroviario"] },
          { id: "rodoviario", label: "Terminais Rodoviários", tags: ["terminal_rodoviario"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q8",
        number: "8",
        label: "A unidade realiza atividade petrolífera?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["petrolifera"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q9",
        number: "9",
        label: "A unidade está localizada em condomínio?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["condominio"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q10",
        number: "10",
        label: "A unidade executa atividades em unidade de conservação ou em suas proximidades?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["unidade_conservacao"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q11",
        number: "11",
        label: "A unidade executa atividades em áreas de preservação permanente?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["app_preservacao"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q12",
        number: "12",
        label:
          "O site da unidade encontra-se dentro de Área de Proteção Ambiental (APA) instituída pelo poder público?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["apa"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q13",
        number: "13",
        label: "Na área da unidade existem cavidades naturais subterrâneas?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["cavidades_subterraneas"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q14",
        number: "14",
        label: "A unidade está localizada em áreas em que possa haver interação com animais?",
        type: "multi",
        options: [
          {
            id: "silvestres_nao_ameacados",
            label: "Animais Silvestres Não Ameaçados de Extinção",
            tags: ["fauna_silvestre"],
          },
          {
            id: "silvestres_ameacados",
            label: "Animais Silvestres Ameaçados de Extinção",
            tags: ["fauna_ameacada"],
          },
          { id: "domesticos", label: "Animais Domésticos", tags: ["animais_domesticos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q15",
        number: "15",
        label: "É feito controle de pragas nocivas (fauna sinantrópica nociva)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["controle_pragas"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q16",
        number: "16",
        label: "A unidade realiza atividades que possam ocasionar supressão de vegetação?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["supressao_vegetacao"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q17",
        number: "17",
        label: "A unidade realiza queima controlada?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["queima_controlada"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "loc.q18",
        number: "18",
        label: "Existe comunidade indígena ou quilombola próxima às atividades realizadas pela empresa?",
        type: "multi",
        options: [
          { id: "indigena", label: "Indígena", tags: ["comunidade_indigena"] },
          { id: "quilombola", label: "Quilombola", tags: ["comunidade_quilombola"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },
  {
    id: "produtos_insumos",
    number: 4,
    title: "Produtos, Insumos e Demais Substâncias",
    questions: [
      {
        id: "prod.q1",
        number: "1",
        label: "A unidade fabrica produtos pré-medidos?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["produtos_premedidos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "prod.q2",
        number: "2",
        label:
          "A unidade realiza atividades de importação e/ou exportação?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["importacao_exportacao"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "prod.q3",
        number: "3",
        label: "A unidade fabrica ou utiliza produtos transgênicos?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["transgenicos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "prod.q4",
        number: "4",
        label:
          "A unidade fabrica, comercializa ou utiliza produtos sujeitos à avaliação da conformidade pelo INMETRO ou organismo acreditado?",
        type: "multi",
        options: [
          { id: "fabrica", label: "Fabrica", tags: ["inmetro_fabrica"] },
          { id: "comercializa", label: "Comercializa", tags: ["inmetro_comercializa"] },
          { id: "utiliza", label: "Utiliza", tags: ["inmetro_utiliza"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },
  // Themes 5-12 (Produtos Florestais, Combustíveis, Produtos Químicos, Recursos Hídricos,
  // Emissões Atmosféricas, Resíduos, Equipamentos, Energia) — populated by PDF extraction below.
  {
    id: "transporte",
    number: 13,
    title: "Transporte",
    questions: [
      {
        id: "tra.q1",
        number: "1",
        label: "A unidade realiza ou contrata o transporte de material biológico?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["transporte_biologico"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q2",
        number: "2",
        label: "A unidade realiza ou contrata transporte aquaviário?",
        type: "multi",
        options: [
          {
            id: "embarcacoes_menores",
            label: "Somente embarcações menores para inspeções de estruturas e afins",
            tags: ["transporte_aquaviario_inspecao"],
          },
          { id: "realiza", label: "Realiza", tags: ["transporte_aquaviario"] },
          { id: "contrata", label: "Contrata / Adquire de Terceiros", tags: ["transporte_aquaviario"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q3",
        number: "3",
        label: "A unidade realiza ou contrata transporte rodoviário de cargas?",
        type: "multi",
        options: [
          { id: "realiza", label: "Realiza", tags: ["transporte_rodoviario_realiza"] },
          { id: "contrata", label: "Contrata / Adquire de Terceiros", tags: ["transporte_rodoviario_contrata"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q3_1",
        number: "3.1",
        label:
          "A unidade realiza ou contrata transporte internacional de cargas no âmbito da América Latina?",
        type: "multi",
        showIf: { questionId: "tra.q3", anyOf: ["realiza", "contrata"] },
        options: [
          { id: "realiza", label: "Realiza", tags: ["transporte_internacional_realiza"] },
          {
            id: "contrata",
            label: "Contrata / Adquire de Terceiros",
            tags: ["transporte_internacional_contrata"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q3_2",
        number: "3.2",
        label: "A unidade realiza transporte multimodal de cargas?",
        type: "single",
        showIf: { questionId: "tra.q3", anyOf: ["realiza", "contrata"] },
        options: [
          { id: "sim", label: "Sim", tags: ["transporte_multimodal"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q4",
        number: "4",
        label:
          "A unidade realiza ou contrata transporte rodoviário de produtos/resíduos perigosos, ou adquire tais produtos de terceiros?",
        type: "multi",
        options: [
          { id: "realiza", label: "Realiza", tags: ["transporte_perigosos_realiza"] },
          {
            id: "contrata",
            label: "Contrata / Adquire de Terceiros",
            tags: ["transporte_perigosos_contrata"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q5",
        number: "5",
        label: "A unidade realiza ou contrata transporte ferroviário de produtos perigosos?",
        type: "multi",
        options: [
          { id: "realiza", label: "Realiza", tags: ["ferroviario_perigosos_realiza"] },
          {
            id: "contrata",
            label: "Contrata / Adquire de Terceiros",
            tags: ["ferroviario_perigosos_contrata"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q6",
        number: "6",
        label: "A unidade realiza ou contrata transporte aéreo de produtos perigosos?",
        type: "multi",
        options: [
          { id: "realiza", label: "Realiza", tags: ["aereo_perigosos_realiza"] },
          { id: "contrata", label: "Contrata / Adquire de Terceiros", tags: ["aereo_perigosos_contrata"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q7",
        number: "7",
        label: "A unidade realiza ou contrata transporte marítimo de produtos perigosos?",
        type: "multi",
        options: [
          { id: "realiza", label: "Realiza", tags: ["maritimo_perigosos_realiza"] },
          {
            id: "contrata",
            label: "Contrata / Adquire de Terceiros",
            tags: ["maritimo_perigosos_contrata"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q8",
        number: "8",
        label: "A unidade possui frota própria (inclui veículos para uso de funcionários)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["frota"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q8_1a",
        number: "8.1",
        label: "Algum veículo da frota própria é movido a diesel?",
        type: "single",
        showIf: { questionId: "tra.q8", anyOf: ["sim"] },
        options: [
          { id: "sim", label: "Sim", tags: ["frota_diesel", "emissoes"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q8_1b",
        number: "8.1",
        label: "A manutenção dos veículos da frota própria é feita pela própria unidade, em suas instalações?",
        type: "single",
        showIf: { questionId: "tra.q8", anyOf: ["sim"] },
        options: [
          { id: "sim", label: "Sim", tags: ["manutencao_frota_interna"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q8_2",
        number: "8.2",
        label:
          "Qual a metodologia utilizada pela empresa para medir os parâmetros de emissão de fumaça preta dos veículos?",
        type: "multi",
        showIf: { questionId: "tra.q8", anyOf: ["sim"] },
        options: [
          { id: "opacimetro", label: "Opacímetro", tags: ["opacimetro"] },
          { id: "ringelman", label: "Anel de Ringelman", tags: ["ringelman"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q9",
        number: "9",
        label: "Existe contratação de combinações de veículos de carga (CVC)?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["cvc"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q10",
        number: "10",
        label:
          "A unidade realiza ou contrata transporte de barras, bobinas, chapas, lingotes, perfis, sucatas, tarugo, tubos, vergalhões, e seus insumos (carvão, minério)?",
        type: "multi",
        options: [
          { id: "realiza", label: "Realiza", tags: ["transporte_metais_realiza"] },
          { id: "contrata", label: "Contrata / Adquire de Terceiros", tags: ["transporte_metais_contrata"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q11",
        number: "11",
        label: "A unidade realiza ou contrata transporte de contêineres (não considerar IBC's)?",
        type: "multi",
        options: [
          { id: "realiza", label: "Realiza", tags: ["transporte_conteiner_realiza"] },
          {
            id: "contrata",
            label: "Contrata / Adquire de Terceiros",
            tags: ["transporte_conteiner_contrata"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q12",
        number: "12",
        label: "A unidade realiza ou contrata transporte feito em motocicletas (motoboy)?",
        type: "multi",
        options: [
          { id: "realiza", label: "Realiza", tags: ["motoboy_realiza"] },
          { id: "contrata", label: "Contrata / Adquire de Terceiros", tags: ["motoboy_contrata"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q13",
        number: "13",
        label: "A unidade realiza/contrata transporte de sólidos a granel?",
        type: "multi",
        options: [
          { id: "realiza", label: "Realiza", tags: ["solidos_granel_realiza"] },
          { id: "contrata", label: "Contrata / Adquire de Terceiros", tags: ["solidos_granel_contrata"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q14",
        number: "14",
        label: "A unidade possui ou contrata transporte de produtos alimentícios?",
        type: "single",
        options: [
          { id: "sim", label: "Sim", tags: ["transporte_alimentos"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q15",
        number: "15",
        label: "Há transporte que exija o monitoramento da temperatura do produto?",
        type: "multi",
        options: [
          { id: "camara_fria", label: "Câmara Fria", tags: ["transporte_camara_fria"] },
          { id: "conteiner", label: "Conteiner", tags: ["transporte_conteiner_temp"] },
          { id: "tanque_isotermico", label: "Tanque Isotérmico", tags: ["transporte_tanque_isotermico"] },
          { id: "outros", label: "Outros", tags: ["transporte_temperatura_outros"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q16",
        number: "16",
        label: "A unidade realiza (ou contrata empresa para realizar) transporte de passageiros?",
        type: "multi",
        options: [
          {
            id: "fretado",
            label: "Transporte fretado de funcionários/pessoas",
            tags: ["transporte_fretado"],
          },
          { id: "municipal", label: "Municipal", tags: ["transporte_passageiros_municipal"] },
          {
            id: "intermunicipal",
            label: "Intermunicipal",
            tags: ["transporte_passageiros_intermunicipal"],
          },
          { id: "interestadual", label: "Interestadual", tags: ["transporte_passageiros_interestadual"] },
          {
            id: "internacional",
            label: "Internacional",
            tags: ["transporte_passageiros_internacional"],
          },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
      {
        id: "tra.q17",
        number: "17",
        label: "Quais embalagens/veículos a unidade utiliza no transporte rodoviário de produtos/resíduos perigosos?",
        type: "multi",
        options: [
          { id: "recondicionada", label: "Embalagem Recondicionada", tags: ["embalagem_recondicionada"] },
          { id: "refabricada", label: "Embalagem Refabricada", tags: ["embalagem_refabricada"] },
          { id: "conteiner_tanque", label: "Conteiner – Tanque", tags: ["conteiner_tanque"] },
          { id: "reutilizada", label: "Embalagem Reutilizada", tags: ["embalagem_reutilizada"] },
          {
            id: "ibc",
            label: "IBC - Contentores Intermediários para Granéis",
            tags: ["ibc_graneis"],
          },
          { id: "veiculo_tanque", label: "Veículo Tanque", tags: ["veiculo_tanque"] },
          { id: "nao_aplica", label: "Não Se Aplica" },
        ],
      },
    ],
  },
  // Themes 14-21 are appended from EXTRACTED_THEMES below.
];

// Final list, ordered by theme number (1..21).
export const COMPLIANCE_THEMES: Theme[] = [...CORE_THEMES, ...EXTRACTED_THEMES].sort(
  (a, b) => a.number - b.number,
);
