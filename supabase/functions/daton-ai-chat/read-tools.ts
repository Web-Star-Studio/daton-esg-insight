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
  },
  {
    type: "function",
    function: {
      name: "analyze_trends",
      description: "Analisa tendências e padrões em dados históricos. Use para identificar evolução temporal de métricas ESG.",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: ["emissions", "goals", "tasks", "licenses", "risks", "non_conformities"],
            description: "Métrica a analisar"
          },
          period: {
            type: "string",
            enum: ["last_30_days", "last_90_days", "last_6_months", "last_year", "year_to_date"],
            description: "Período de análise"
          },
          groupBy: {
            type: "string",
            enum: ["day", "week", "month", "quarter"],
            description: "Granularidade da análise temporal"
          }
        },
        required: ["metric", "period"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compare_periods",
      description: "Compara métricas entre dois períodos para identificar variações e tendências. Essencial para análises de evolução.",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: ["emissions", "goals_progress", "task_completion", "license_compliance"],
            description: "Métrica a comparar"
          },
          currentPeriod: {
            type: "string",
            description: "Período atual (ex: '2025-01', 'Q1-2025', '2025')"
          },
          previousPeriod: {
            type: "string",
            description: "Período anterior (ex: '2024-12', 'Q4-2024', '2024')"
          }
        },
        required: ["metric", "currentPeriod", "previousPeriod"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "predict_future_metrics",
      description: "Prediz valores futuros de métricas com base em dados históricos. Use para projeções e planejamento estratégico.",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: ["emissions", "goal_achievement", "task_completion_rate"],
            description: "Métrica a prever"
          },
          forecastPeriod: {
            type: "string",
            enum: ["next_month", "next_quarter", "next_6_months", "next_year"],
            description: "Período de previsão"
          },
          includeConfidence: {
            type: "boolean",
            description: "Incluir intervalos de confiança na previsão"
          }
        },
        required: ["metric", "forecastPeriod"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_correlations",
      description: "Analisa correlações entre diferentes métricas ESG. Use para identificar relações causais e impactos indiretos.",
      parameters: {
        type: "object",
        properties: {
          metrics: {
            type: "array",
            items: {
              type: "string",
              enum: ["emissions", "goals", "tasks", "risks", "non_conformities", "employees"]
            },
            description: "Lista de métricas a correlacionar (mínimo 2)"
          },
          period: {
            type: "string",
            enum: ["last_90_days", "last_6_months", "last_year"],
            description: "Período de análise"
          }
        },
        required: ["metrics"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_executive_summary",
      description: "Gera resumo executivo completo com insights, alertas e recomendações estratégicas. Use para visão holística da gestão ESG.",
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            enum: ["full", "environmental", "social", "governance"],
            description: "Escopo do resumo"
          },
          includeRecommendations: {
            type: "boolean",
            description: "Incluir recomendações estratégicas"
          },
          priorityLevel: {
            type: "string",
            enum: ["critical_only", "high_priority", "all"],
            description: "Filtro de prioridade de insights"
          }
        },
        required: ["scope"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_compliance_gaps",
      description: "Analisa lacunas de conformidade e identifica áreas de risco regulatório. Essencial para gestão de compliance.",
      parameters: {
        type: "object",
        properties: {
          framework: {
            type: "string",
            enum: ["all", "licenses", "gri", "iso14001", "iso45001"],
            description: "Framework de conformidade a analisar"
          },
          includeRemediation: {
            type: "boolean",
            description: "Incluir plano de remediação"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "benchmark_performance",
      description: "Compara performance da empresa com benchmarks do setor. Use para análise competitiva e identificação de oportunidades.",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: ["emissions_intensity", "goal_achievement_rate", "compliance_score"],
            description: "Métrica a comparar"
          },
          sector: {
            type: "string",
            description: "Setor industrial para comparação (opcional, usa setor da empresa se não especificado)"
          }
        },
        required: ["metric"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "identify_optimization_opportunities",
      description: "Identifica oportunidades de otimização em processos ESG com base em análise de dados e padrões.",
      parameters: {
        type: "object",
        properties: {
          focus: {
            type: "string",
            enum: ["all", "cost_reduction", "efficiency", "risk_mitigation", "goal_acceleration"],
            description: "Foco da análise de otimização"
          },
          includeImpact: {
            type: "boolean",
            description: "Incluir estimativa de impacto das oportunidades"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_stakeholder_impact",
      description: "Analisa impacto de ações ESG em diferentes stakeholders. Use para análise de materialidade e priorização.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Ação ou iniciativa a analisar"
          },
          stakeholderGroups: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Grupos de stakeholders a considerar (ex: ['funcionários', 'comunidade', 'investidores'])"
          }
        },
        required: ["action"]
      }
    }
  }
];
