import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Database,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DocumentInsightsProps {
  insights: {
    summary: string;
    key_findings: string[];
    recommendations: string[];
    data_quality: {
      score: number;
      issues: string[];
    };
  };
  visualizations: Array<{
    type: 'bar' | 'line' | 'pie' | 'table';
    title: string;
    data: any;
  }>;
  extractedData: {
    fields: Record<string, any>;
    confidence: Record<string, number>;
    target_tables: string[];
  };
  onInsertData: () => void;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function DocumentInsights({
  insights,
  visualizations,
  extractedData,
  onInsertData
}: DocumentInsightsProps) {
  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderVisualization = (viz: any, index: number) => {
    switch (viz.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={COLORS[index % COLORS.length]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={viz.data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={viz.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {viz.data.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {Object.keys(viz.data[0] || {}).map((key) => (
                    <th key={key} className="text-left p-2 font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viz.data.map((row: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    {Object.values(row).map((value: any, vidx: number) => (
                      <td key={vidx} className="p-2">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary & Quality */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{insights.summary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Qualidade dos Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score de Qualidade</span>
              <span className={`text-2xl font-bold ${getQualityColor(insights.data_quality.score)}`}>
                {insights.data_quality.score}%
              </span>
            </div>
            {insights.data_quality.issues.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Problemas Identificados:</p>
                {insights.data_quality.issues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Descobertas Principais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insights.key_findings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{finding}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Visualizations */}
      {visualizations && visualizations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Visualizações</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {visualizations.map((viz, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base">{viz.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderVisualization(viz, idx)}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insights.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Extracted Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dados Extraídos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {Object.keys(extractedData.fields).length} campos extraídos
              </p>
              <p className="text-xs text-muted-foreground">
                Destino: {extractedData.target_tables.join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {Object.keys(extractedData.fields).slice(0, 3).map((field) => (
                <Badge key={field} variant="secondary">
                  {field}
                </Badge>
              ))}
              {Object.keys(extractedData.fields).length > 3 && (
                <Badge variant="outline">
                  +{Object.keys(extractedData.fields).length - 3}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          <Button onClick={onInsertData} className="w-full" size="lg">
            <Database className="h-4 w-4 mr-2" />
            Revisar e Inserir Dados
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
