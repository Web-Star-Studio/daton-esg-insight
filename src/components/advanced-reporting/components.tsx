import { type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import {
  AlertTriangle,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileBarChart,
  FileText,
  Share2,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react"
import { REPORT_TEMPLATES } from "./constants"
import {
  getMetricChangeColorClass,
  getPriorityBadgeVariant
} from "./helpers"
import {
  type ReportChart,
  type ReportData,
  type ReportInsight,
  type ReportMetric,
  type ReportNextStep,
  type ReportTemplate
} from "./types"

interface ReportHeaderProps {
  onSchedule: () => void
  onGenerate: () => void
}

export function ReportHeader({ onSchedule, onGenerate }: ReportHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Advanced Reporting</h2>
        <p className="text-muted-foreground">
          AI-powered reports with intelligent insights and recommendations
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onSchedule}>
          <Clock className="h-4 w-4 mr-2" />
          Schedule
        </Button>
        <Button onClick={onGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>
    </div>
  )
}

interface TemplateItemProps {
  template: ReportTemplate
  isSelected: boolean
  onSelect: (template: ReportTemplate) => void
}

function TemplateItem({ template, isSelected, onSelect }: TemplateItemProps) {
  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/50"
      }`}
      onClick={() => onSelect(template)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect(template)
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{template.name}</h4>
        <Badge variant={template.automated ? "default" : "secondary"}>
          {template.automated ? "Auto" : "Manual"}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="capitalize">{template.frequency}</span>
        <span className="uppercase">{template.format}</span>
      </div>
    </div>
  )
}

interface TemplateSelectionCardProps {
  selectedTemplateId?: string
  onSelectTemplate: (template: ReportTemplate) => void
}

export function TemplateSelectionCard({
  selectedTemplateId,
  onSelectTemplate
}: TemplateSelectionCardProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Report Templates
        </CardTitle>
        <CardDescription>
          Choose from pre-built templates or create custom reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {REPORT_TEMPLATES.map((template) => (
          <TemplateItem
            key={template.id}
            template={template}
            isSelected={selectedTemplateId === template.id}
            onSelect={onSelectTemplate}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export function GeneratingStateCard() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <div>
            <h3 className="font-medium">Generating AI-Powered Report</h3>
            <p className="text-sm text-muted-foreground">
              Analyzing data and creating insights...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EmptyStateCard() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto" />
          <div>
            <h3 className="font-medium">No Report Generated</h3>
            <p className="text-sm text-muted-foreground">
              Select a template and click "Generate Report" to begin
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ReportOverviewCardProps {
  reportData: ReportData
  onDownload: (format: string) => void
}

function ReportOverviewCard({ reportData, onDownload }: ReportOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{reportData.title}</CardTitle>
            <CardDescription>
              Generated on {reportData.generatedAt.toLocaleDateString()}
              {" \u2022 "}
              {reportData.period}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onDownload("pdf")}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload("excel")}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <h3>Executive Summary</h3>
          <p>{reportData.executiveSummary}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface MetricItemProps {
  metric: ReportMetric
}

function MetricItem({ metric }: MetricItemProps) {
  const progressValue = metric.target
    ? (metric.value / metric.target) * 100
    : undefined

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{metric.name}</span>
        <div className="flex items-center gap-1">
          {metric.trend === "up" ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : metric.trend === "down" ? (
            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
          ) : (
            <div className="h-4 w-4" />
          )}
          <span className={`text-sm ${getMetricChangeColorClass(metric.change)}`}>
            {metric.change > 0 ? "+" : ""}
            {metric.change}%
          </span>
        </div>
      </div>
      <div className="text-2xl font-bold">{metric.value}</div>
      {metric.target && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress to Target</span>
            <span>{metric.target}</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>
      )}
    </div>
  )
}

interface KeyMetricsCardProps {
  metrics: ReportMetric[]
}

function KeyMetricsCard({ metrics }: KeyMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Performance Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((metric) => (
            <MetricItem key={metric.name} metric={metric} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface ChartsCardProps {
  charts: ReportChart[]
  renderChart: (chart: ReportChart) => ReactNode
}

function ChartsCard({ charts, renderChart }: ChartsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={charts[0]?.id} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {charts.map((chart) => (
              <TabsTrigger key={chart.id} value={chart.id}>
                {chart.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {charts.map((chart) => (
            <TabsContent key={chart.id} value={chart.id} className="mt-6">
              <div className="space-y-4">
                <h4 className="font-medium">{chart.title}</h4>
                {renderChart(chart)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface InsightItemProps {
  insight: ReportInsight
}

function InsightItem({ insight }: InsightItemProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-3">
        {insight.type === "positive" ? (
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
        ) : insight.type === "negative" ? (
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
        ) : (
          <FileBarChart className="h-5 w-5 text-blue-500 mt-0.5" />
        )}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{insight.title}</h4>
            <Badge variant={getPriorityBadgeVariant(insight.priority)}>
              {insight.priority} priority
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{insight.description}</p>
          <div className="bg-muted/50 rounded p-3">
            <p className="text-sm font-medium">Recommendation:</p>
            <p className="text-sm">{insight.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface InsightsCardProps {
  insights: ReportInsight[]
}

function InsightsCard({ insights }: InsightsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI-Generated Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <InsightItem key={insight.title} insight={insight} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface NextStepItemProps {
  step: ReportNextStep
}

function NextStepItem({ step }: NextStepItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="flex-1">
        <h4 className="font-medium">{step.action}</h4>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {step.responsible}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {step.deadline.toLocaleDateString()}
          </span>
        </div>
      </div>
      <Badge variant={getPriorityBadgeVariant(step.priority)}>{step.priority}</Badge>
    </div>
  )
}

interface NextStepsCardProps {
  steps: ReportNextStep[]
}

function NextStepsCard({ steps }: NextStepsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Next Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step) => (
            <NextStepItem
              key={`${step.action}-${step.responsible}-${step.deadline.toISOString()}`}
              step={step}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface GeneratedReportViewProps {
  reportData: ReportData
  onDownload: (format: string) => void
  renderChart: (chart: ReportChart) => ReactNode
}

export function GeneratedReportView({
  reportData,
  onDownload,
  renderChart
}: GeneratedReportViewProps) {
  return (
    <div className="space-y-6">
      <ReportOverviewCard reportData={reportData} onDownload={onDownload} />
      <KeyMetricsCard metrics={reportData.keyMetrics} />
      <ChartsCard charts={reportData.charts} renderChart={renderChart} />
      <InsightsCard insights={reportData.insights} />
      <NextStepsCard steps={reportData.nextSteps} />
    </div>
  )
}
