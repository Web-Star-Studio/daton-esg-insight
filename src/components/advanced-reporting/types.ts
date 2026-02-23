export type ReportCategory =
  | "esg"
  | "compliance"
  | "performance"
  | "sustainability"

export type ReportFrequency = "weekly" | "monthly" | "quarterly" | "annual"

export type ReportFormat = "pdf" | "excel" | "powerpoint" | "html"

export type MetricTrend = "up" | "down" | "stable"

export type InsightType = "positive" | "negative" | "neutral"

export type PriorityLevel = "low" | "medium" | "high"

export type ReportChartType = "line" | "bar" | "pie" | "area"

export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: ReportCategory
  frequency: ReportFrequency
  sections: string[]
  format: ReportFormat
  automated: boolean
}

export interface ReportMetric {
  name: string
  value: number
  change: number
  trend: MetricTrend
  target?: number
}

export interface ReportInsight {
  type: InsightType
  title: string
  description: string
  recommendation: string
  priority: PriorityLevel
}

export interface ReportChart {
  id: string
  type: ReportChartType
  title: string
  data: Array<Record<string, unknown>>
}

export interface ReportNextStep {
  action: string
  responsible: string
  deadline: Date
  priority: PriorityLevel
}

export interface ReportData {
  title: string
  period: string
  generatedAt: Date
  executiveSummary: string
  keyMetrics: ReportMetric[]
  insights: ReportInsight[]
  charts: ReportChart[]
  recommendations: string[]
  nextSteps: ReportNextStep[]
}
