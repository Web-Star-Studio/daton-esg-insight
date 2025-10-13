export const reportTools = [
  {
    type: "function",
    function: {
      name: "generate_smart_report",
      description: "Gera um relatório inteligente com análises, gráficos e insights de IA. Use quando o usuário pedir relatórios, análises ou visualizações de dados.",
      parameters: {
        type: "object",
        properties: {
          reportType: {
            type: "string",
            enum: ["emissions", "quality", "compliance", "esg", "gri", "custom"],
            description: "Tipo de relatório a ser gerado"
          },
          dateRange: {
            type: "object",
            properties: {
              start: {
                type: "string",
                description: "Data inicial no formato YYYY-MM-DD"
              },
              end: {
                type: "string",
                description: "Data final no formato YYYY-MM-DD"
              }
            },
            required: ["start", "end"]
          },
          includeCharts: {
            type: "boolean",
            description: "Se deve incluir gráficos no relatório",
            default: true
          },
          includeInsights: {
            type: "boolean",
            description: "Se deve incluir insights de IA",
            default: true
          },
          sections: {
            type: "array",
            items: { type: "string" },
            description: "Seções específicas a incluir no relatório"
          }
        },
        required: ["reportType", "dateRange"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_chart",
      description: "Cria um gráfico específico a partir de dados. Use quando o usuário pedir visualizações específicas ou gráficos.",
      parameters: {
        type: "object",
        properties: {
          chartType: {
            type: "string",
            enum: ["line", "bar", "pie", "area", "scatter"],
            description: "Tipo de gráfico"
          },
          dataSource: {
            type: "string",
            description: "Fonte dos dados (tabela do banco)"
          },
          title: {
            type: "string",
            description: "Título do gráfico"
          },
          xAxis: {
            type: "string",
            description: "Campo para eixo X"
          },
          yAxis: {
            type: "string",
            description: "Campo para eixo Y"
          },
          filters: {
            type: "object",
            description: "Filtros a aplicar nos dados"
          },
          groupBy: {
            type: "string",
            description: "Campo para agrupar dados"
          }
        },
        required: ["chartType", "dataSource", "title"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "schedule_report",
      description: "Agenda geração automática de relatórios. Use quando o usuário quiser automatizar relatórios.",
      parameters: {
        type: "object",
        properties: {
          reportType: {
            type: "string",
            enum: ["emissions", "quality", "compliance", "esg", "gri"],
            description: "Tipo de relatório"
          },
          frequency: {
            type: "string",
            enum: ["daily", "weekly", "monthly", "quarterly"],
            description: "Frequência de geração"
          },
          recipients: {
            type: "array",
            items: { type: "string" },
            description: "Lista de emails para receber o relatório"
          },
          format: {
            type: "string",
            enum: ["pdf", "excel", "both"],
            description: "Formato do relatório",
            default: "pdf"
          },
          startDate: {
            type: "string",
            description: "Data para iniciar o agendamento (YYYY-MM-DD)"
          }
        },
        required: ["reportType", "frequency"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "export_report",
      description: "Exporta um relatório em formato específico (PDF, Excel, CSV). Use quando o usuário pedir para baixar ou exportar dados.",
      parameters: {
        type: "object",
        properties: {
          reportId: {
            type: "string",
            description: "ID do relatório a exportar"
          },
          format: {
            type: "string",
            enum: ["pdf", "excel", "csv", "json"],
            description: "Formato de exportação"
          },
          includeCharts: {
            type: "boolean",
            description: "Incluir gráficos na exportação",
            default: true
          },
          templateId: {
            type: "string",
            description: "ID do template a usar (opcional)"
          }
        },
        required: ["format"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_trends",
      description: "Analisa tendências em dados temporais. Use quando o usuário pedir análise de tendências ou padrões.",
      parameters: {
        type: "object",
        properties: {
          dataType: {
            type: "string",
            enum: ["emissions", "quality", "compliance", "goals"],
            description: "Tipo de dado a analisar"
          },
          period: {
            type: "string",
            enum: ["last_month", "last_quarter", "last_year", "custom"],
            description: "Período de análise"
          },
          customDateRange: {
            type: "object",
            properties: {
              start: { type: "string" },
              end: { type: "string" }
            },
            description: "Intervalo customizado se period=custom"
          },
          metrics: {
            type: "array",
            items: { type: "string" },
            description: "Métricas específicas a analisar"
          }
        },
        required: ["dataType", "period"],
        additionalProperties: false
      }
    }
  }
];
