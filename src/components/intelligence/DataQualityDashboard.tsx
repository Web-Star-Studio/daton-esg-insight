import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle2, Database } from 'lucide-react';

interface TableQualityScore {
  table_name: string;
  total_records: number;
  complete_records: number;
  score: number;
}

interface DataIssue {
  type: string;
  description: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

export function DataQualityDashboard() {
  const { selectedCompany } = useCompany();
  const [tableScores, setTableScores] = useState<TableQualityScore[]>([]);
  const [issues, setIssues] = useState<DataIssue[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCompany?.id) {
      analyzeDataQuality();
    }
  }, [selectedCompany?.id]);

  const analyzeDataQuality = async () => {
    if (!selectedCompany?.id) return;

    try {
      setLoading(true);

      // Analyze main tables
      const tablesToAnalyze = [
        'emissions_inventory',
        'waste_management',
        'licenses_certifications',
        'stakeholders',
        'suppliers'
      ];

      const scores: TableQualityScore[] = [];
      const foundIssues: DataIssue[] = [];

      for (const tableName of tablesToAnalyze) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('company_id', selectedCompany.id);

          if (error) {
            console.error(`Error analyzing ${tableName}:`, error);
            continue;
          }

          if (data && data.length > 0) {
            // Calculate completeness score
            const records = data;
            const totalRecords = records.length;
            let completeRecords = 0;

            records.forEach(record => {
              const fields = Object.entries(record);
              const filledFields = fields.filter(([key, value]) => {
                // Ignore system fields
                if (['id', 'created_at', 'updated_at', 'company_id'].includes(key)) return true;
                return value !== null && value !== undefined && value !== '';
              });
              
              const completeness = filledFields.length / fields.length;
              if (completeness >= 0.8) completeRecords++;
            });

            const score = Math.round((completeRecords / totalRecords) * 100);
            scores.push({
              table_name: tableName,
              total_records: totalRecords,
              complete_records: completeRecords,
              score
            });

            // Identify common issues
            if (score < 70) {
              foundIssues.push({
                type: 'low_completeness',
                description: `Tabela ${getTableDisplayName(tableName)} com baixa completude`,
                count: totalRecords - completeRecords,
                severity: score < 50 ? 'high' : 'medium'
              });
            }
          }
        } catch (err) {
          console.error(`Error processing ${tableName}:`, err);
        }
      }

      // Check for unclassified data
      const { data: unclassified } = await supabase
        .from('unclassified_data')
        .select('id')
        .eq('company_id', selectedCompany.id)
        .is('user_decision', null);

      if (unclassified && unclassified.length > 10) {
        foundIssues.push({
          type: 'pending_classification',
          description: 'Muitos dados aguardando classificação',
          count: unclassified.length,
          severity: unclassified.length > 50 ? 'high' : 'medium'
        });
      }

      setTableScores(scores);
      setIssues(foundIssues.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }));

      // Calculate overall score
      if (scores.length > 0) {
        const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
        setOverallScore(Math.round(avgScore));
      }
    } catch (error) {
      console.error('Error analyzing data quality:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTableDisplayName = (tableName: string) => {
    const names: Record<string, string> = {
      emissions_inventory: 'Inventário de Emissões',
      waste_management: 'Gestão de Resíduos',
      licenses_certifications: 'Licenças e Certificações',
      stakeholders: 'Partes Interessadas',
      suppliers: 'Fornecedores'
    };
    return names[tableName] || tableName;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <Database className="h-8 w-8 animate-pulse text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Qualidade dos Dados
            </CardTitle>
            <CardDescription>Análise de completude e integridade</CardDescription>
          </div>
          {overallScore >= 80 && (
            <Badge className="bg-success text-success-foreground">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Excelente
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Geral */}
        <div className="text-center p-6 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-2">Score de Qualidade Geral</p>
          <div className="text-5xl font-bold text-primary mb-2">{overallScore}</div>
          <Progress value={overallScore} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">
            {overallScore >= 80 ? 'Excelente qualidade' : overallScore >= 60 ? 'Boa qualidade' : 'Necessita melhorias'}
          </p>
        </div>

        {/* Breakdown por Tabela */}
        {tableScores.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Qualidade por Módulo
            </h4>
            <div className="space-y-3">
              {tableScores.map(table => (
                <div key={table.table_name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{getTableDisplayName(table.table_name)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {table.complete_records}/{table.total_records} completos
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {table.score}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={table.score} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issues Comuns */}
        {issues.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Problemas Identificados
            </h4>
            <div className="space-y-2">
              {issues.map((issue, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${getSeverityColor(issue.severity)}`} />
                    <span className="text-sm">{issue.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityBadge(issue.severity) as any}>
                      {issue.count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tableScores.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum dado disponível para análise</p>
            <p className="text-xs mt-1">Comece adicionando dados aos módulos</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}