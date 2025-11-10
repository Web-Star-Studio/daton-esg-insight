import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { Target, TrendingUp, Award, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SDG_DATA } from '@/constants/sdgData';
import { toast } from 'sonner';

export default function SDGDashboard() {
  const [sdgData, setSdgData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    loadSDGData();
  }, []);

  const loadSDGData = async () => {
    setIsLoading(true);
    try {
      const { data: reports } = await supabase
        .from('gri_reports')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!reports || reports.length === 0) {
        toast.error('Nenhum relatório encontrado');
        return;
      }

      const reportId = reports[0].id;

      const { data, error } = await supabase
        .from('sdg_alignment')
        .select('*')
        .eq('report_id', reportId);

      if (error) throw error;

      setSdgData(data || []);
      
      if (data && data.length > 0) {
        const avgScore = data.reduce((sum, item) => {
          const impactValue = item.impact_level === 'Alto' ? 100 : 
                             item.impact_level === 'Médio' ? 66 : 33;
          return sum + impactValue;
        }, 0) / data.length;
        setOverallScore(Math.round(avgScore));
      }
    } catch (error) {
      console.error('Error loading SDG data:', error);
      toast.error('Erro ao carregar dados de ODS');
    } finally {
      setIsLoading(false);
    }
  };

  const radarData = SDG_DATA.map(sdg => {
    const alignment = sdgData.find(d => d.sdg_number === sdg.number);
    const value = alignment ? 
      (alignment.impact_level === 'Alto' ? 100 : 
       alignment.impact_level === 'Médio' ? 66 : 33) : 0;
    
    return {
      subject: `ODS ${sdg.number}`,
      value,
      fullMark: 100
    };
  });

  const categoryData = [
    { 
      name: 'Social', 
      value: calculateCategoryScore([1, 2, 3, 4, 5, 10, 16]), 
      color: '#3b82f6' 
    },
    { 
      name: 'Econômico', 
      value: calculateCategoryScore([8, 9, 12, 17]), 
      color: '#f59e0b' 
    },
    { 
      name: 'Ambiental', 
      value: calculateCategoryScore([6, 7, 11, 13, 14, 15]), 
      color: '#10b981' 
    }
  ];

  function calculateCategoryScore(sdgNumbers: number[]): number {
    const categorySDGs = sdgData.filter(d => sdgNumbers.includes(d.sdg_number));
    if (categorySDGs.length === 0) return 0;
    
    const total = categorySDGs.reduce((sum, item) => {
      const value = item.impact_level === 'Alto' ? 100 : 
                   item.impact_level === 'Médio' ? 66 : 33;
      return sum + value;
    }, 0);
    
    return Math.round(total / categorySDGs.length);
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { text: '🥇 Ouro', class: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
    if (score >= 60) return { text: '🥈 Prata', class: 'bg-gray-100 text-gray-700 border-gray-300' };
    if (score >= 40) return { text: '🥉 Bronze', class: 'bg-orange-100 text-orange-700 border-orange-300' };
    return { text: '🎯 Em Desenvolvimento', class: 'bg-blue-100 text-blue-700 border-blue-300' };
  };

  const scoreBadge = getScoreBadge(overallScore);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de ODS</h1>
          <p className="text-muted-foreground mt-1">
            Visualize sua contribuição aos Objetivos de Desenvolvimento Sustentável
          </p>
        </div>
        <Badge variant="outline" className={`text-lg px-4 py-2 ${scoreBadge.class}`}>
          {scoreBadge.text}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ODS Adotados</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sdgData.length}/17</div>
            <Progress value={(sdgData.length / 17) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Score Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallScore}/100</div>
            <Progress value={overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alta Contribuição</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sdgData.filter(d => d.impact_level === 'Alto').length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ODS com impacto significativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hoje</div>
            <p className="text-xs text-muted-foreground mt-2">
              Dados em tempo real
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contribuição por ODS</CardTitle>
            <CardDescription>
              Visão geral da contribuição em cada objetivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="Contribuição" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6} 
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance por Categoria</CardTitle>
            <CardDescription>
              Social, Econômico e Ambiental
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Score" radius={[8, 8, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ODS Detalhados</CardTitle>
          <CardDescription>
            Detalhamento de cada objetivo adotado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sdgData.map(item => {
              const sdg = SDG_DATA.find(s => s.number === item.sdg_number);
              if (!sdg) return null;

              return (
                <Card key={item.id} className="border-l-4" style={{ borderLeftColor: sdg.color }}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl text-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: sdg.color }}
                      >
                        {sdg.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">
                            ODS {sdg.number} - {sdg.name}
                          </h3>
                          <Badge variant="outline" className={
                            item.impact_level === 'Alto' ? 'bg-green-100 text-green-700' :
                            item.impact_level === 'Médio' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                          }>
                            {item.impact_level}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {sdg.description}
                        </p>
                        {item.selected_targets && item.selected_targets.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Metas: </span>
                            {item.selected_targets.map((target: string) => (
                              <Badge key={target} variant="secondary" className="mr-1">
                                {target}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
