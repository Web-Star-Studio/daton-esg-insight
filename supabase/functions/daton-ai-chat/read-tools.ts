/**
 * Advanced Read Tools for Daton AI Chat
 * Provides intelligent data querying capabilities
 */

export const readTools = [
  {
    type: "function",
    function: {
      name: "query_emissions_data",
      description: "Consulta dados de emissões de GEE. Use para perguntas sobre emissões totais, por escopo, por período, ou comparações.",
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            enum: ["1", "2", "3", "all"],
            description: "Escopo de emissões (1, 2, 3 ou 'all' para todos)"
          },
          year: {
            type: "number",
            description: "Ano de referência (opcional, padrão é ano atual)"
          },
          groupBy: {
            type: "string",
            enum: ["source", "month", "category"],
            description: "Agrupar resultados por fonte, mês ou categoria"
          }
        },
        required: ["scope"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_goals_progress",
      description: "Consulta progresso de metas ESG. Use para perguntas sobre status de metas, progresso, prazos.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "active", "completed", "at_risk"],
            description: "Filtrar por status da meta"
          },
          category: {
            type: "string",
            enum: ["environmental", "social", "governance", "all"],
            description: "Categoria da meta"
          },
          sortBy: {
            type: "string",
            enum: ["progress", "deadline", "priority"],
            description: "Ordenar resultados"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_licenses",
      description: "Consulta licenças ambientais. Use para perguntas sobre licenças vencidas, próximas ao vencimento, status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "active", "expired", "expiring_soon"],
            description: "Status da licença"
          },
          daysUntilExpiry: {
            type: "number",
            description: "Filtrar licenças que vencem em X dias (para expiring_soon)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_tasks",
      description: "Consulta tarefas de coleta de dados e outras atividades. Use para perguntas sobre tarefas pendentes, atrasadas, status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "pending", "overdue", "completed"],
            description: "Status da tarefa"
          },
          taskType: {
            type: "string",
            description: "Tipo de tarefa (emissões, resíduos, etc)"
          },
          assignedTo: {
            type: "string",
            description: "ID do usuário responsável"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_risks",
      description: "Consulta riscos ESG identificados. Use para perguntas sobre riscos críticos, por categoria, status.",
      parameters: {
        type: "object",
        properties: {
          level: {
            type: "string",
            enum: ["all", "critical", "high", "medium", "low"],
            description: "Nível de risco"
          },
          category: {
            type: "string",
            enum: ["environmental", "social", "governance", "all"],
            description: "Categoria do risco"
          },
          status: {
            type: "string",
            enum: ["active", "mitigated", "all"],
            description: "Status do risco"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_non_conformities",
      description: "Consulta não conformidades. Use para perguntas sobre NCs abertas, por tipo, gravidade.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "open", "in_treatment", "closed"],
            description: "Status da não conformidade"
          },
          severity: {
            type: "string",
            enum: ["all", "critical", "major", "minor"],
            description: "Gravidade da NC"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_employees",
      description: "Consulta dados de colaboradores. Use para perguntas sobre contagem, diversidade, departamentos.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "active", "inactive"],
            description: "Status do colaborador"
          },
          groupBy: {
            type: "string",
            enum: ["department", "gender", "position"],
            description: "Agrupar por departamento, gênero ou cargo"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_summary",
      description: "Obtém resumo executivo dos principais KPIs e alertas do dashboard. Use para visão geral do status ESG.",
      parameters: {
        type: "object",
        properties: {
          includeAlerts: {
            type: "boolean",
            description: "Incluir alertas e itens que precisam atenção"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "review_pending_extractions",
      description: "Lista extrações de documentos pendentes de aprovação. Use para saber quais documentos foram processados pela IA e aguardam validação.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Número máximo de extrações a retornar (padrão: 10)"
          },
          minConfidence: {
            type: "number",
            description: "Confiança mínima (0-1) para filtrar extrações"
          }
        },
        required: []
      }
    }
  }
];
