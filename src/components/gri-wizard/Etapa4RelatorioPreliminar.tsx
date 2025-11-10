import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, FileText, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SECOES = [
  { key: 'executive_summary', title: 'Sumário Executivo', icon: FileText },
  { key: 'organizational_profile', title: 'Perfil Organizacional', icon: FileText },
  { key: 'strategy_analysis', title: 'Estratégia e Análise', icon: FileText },
  { key: 'governance', title: 'Governança', icon: FileText },
  { key: 'environmental_performance', title: 'Desempenho Ambiental', icon: BarChart3 },
  { key: 'social_performance', title: 'Desempenho Social', icon: BarChart3 },
];

interface Etapa4Props {
  reportId?: string;
}

export function Etapa4RelatorioPreliminar({ reportId }: Etapa4Props) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, string>>({});

  const generateSection = async (sectionKey: string) => {
    setGenerating(sectionKey);
    try {
      // Se for seção de estratégia, buscar texto pré-gerado
      if (sectionKey === 'strategy_analysis') {
        const { data: strategyData } = await supabase
          .from('gri_strategy_data_collection')
          .select('ai_generated_text, ai_analysis')
          .eq('report_id', reportId)
          .maybeSingle();

        if (strategyData?.ai_generated_text) {
          setSections(prev => ({ 
            ...prev, 
            [sectionKey]: strategyData.ai_generated_text 
          }));
          toast.success('Conteúdo carregado da análise anterior!');
          return;
        }
      }

      // Se for seção de governança, buscar texto pré-gerado
      if (sectionKey === 'governance') {
        const { data: govData } = await supabase
          .from('gri_governance_data_collection')
          .select('ai_generated_text, ai_analysis')
          .eq('report_id', reportId)
          .maybeSingle();

        if (govData?.ai_generated_text) {
          setSections(prev => ({ 
            ...prev, 
            [sectionKey]: govData.ai_generated_text 
          }));
          toast.success('Conteúdo de governança carregado!');
          return;
        }
      }

      // Se for seção de gestão ambiental, buscar texto pré-gerado
      if (sectionKey === 'environmental_performance') {
        const { data: envData } = await supabase
          .from('gri_environmental_data_collection')
          .select('ai_generated_text, ai_analysis')
          .eq('report_id', reportId)
          .maybeSingle();

        if (envData?.ai_generated_text) {
          setSections(prev => ({ 
            ...prev, 
            [sectionKey]: envData.ai_generated_text 
          }));
          toast.success('Conteúdo ambiental carregado!');
          return;
        }
      }

      // Se for seção de desempenho social, buscar texto pré-gerado
      if (sectionKey === 'social_performance') {
        const { data: socialData } = await supabase
          .from('gri_social_data_collection')
          .select('ai_generated_text, ai_analysis')
          .eq('report_id', reportId)
          .maybeSingle();

        if (socialData?.ai_generated_text) {
          setSections(prev => ({ 
            ...prev, 
            [sectionKey]: socialData.ai_generated_text 
          }));
          toast.success('Conteúdo social carregado!');
          return;
        }
      }

      // Se for seção de desempenho econômico, buscar texto pré-gerado
          if (sectionKey === 'economic_performance') {
            const { data: economicData } = await supabase
              .from('gri_economic_data_collection')
              .select('ai_generated_text, ai_analysis')
              .eq('report_id', reportId)
              .maybeSingle();

            if (economicData?.ai_generated_text) {
              setSections(prev => ({
                ...prev,
                [sectionKey]: economicData.ai_generated_text
              }));
              toast.success('Conteúdo econômico carregado!');
              return;
            }
          }

      if (sectionKey === 'stakeholder_engagement') {
        const { data: stakeholderData } = await supabase
          .from('gri_stakeholder_engagement_data')
          .select('ai_generated_text, ai_analysis')
          .eq('report_id', reportId)
          .maybeSingle();

        if (stakeholderData?.ai_generated_text) {
          setSections(prev => ({ 
            ...prev, 
            [sectionKey]: stakeholderData.ai_generated_text 
          }));
          toast.success('Conteúdo de stakeholder engagement carregado!');
          return;
        }
      }

      if (sectionKey === 'innovation_technology') {
        const { data: innovationData } = await supabase
          .from('gri_innovation_data_collection' as any)
          .select('ai_generated_text, ai_analysis')
          .eq('report_id', reportId)
          .maybeSingle();

        if ((innovationData as any)?.ai_generated_text) {
          setSections(prev => ({ 
            ...prev, 
            [sectionKey]: (innovationData as any).ai_generated_text 
          }));
          toast.success('Conteúdo de inovação carregado!');
          return;
        }
      }

      // Caso contrário, gerar normalmente
      const { data, error } = await supabase.functions.invoke('gri-report-ai-configurator', {
        body: {
          action: 'generate_content',
          report_id: reportId,
          section_key: sectionKey,
        },
      });

      if (error) throw error;

      setSections(prev => ({ ...prev, [sectionKey]: data.content }));
      toast.success('Conteúdo gerado com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao gerar conteúdo: ${error.message}`);
    } finally {
      setGenerating(null);
    }
  };

  const generateAllSections = async () => {
    for (const section of SECOES) {
      await generateSection(section.key);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Geração Automática de Conteúdo</h3>
          <p className="text-sm text-muted-foreground">
            A IA irá gerar o conteúdo textual baseado nos documentos analisados
          </p>
        </div>
        <Button onClick={generateAllSections} disabled={generating !== null}>
          <Sparkles className="mr-2 h-4 w-4" />
          Gerar Todo o Conteúdo
        </Button>
      </div>

      <Tabs defaultValue={SECOES[0].key} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          {SECOES.map((secao) => (
            <TabsTrigger key={secao.key} value={secao.key} className="flex-shrink-0">
              <secao.icon className="mr-2 h-4 w-4" />
              {secao.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECOES.map((secao) => (
          <TabsContent key={secao.key} value={secao.key}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{secao.title}</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateSection(secao.key)}
                    disabled={generating === secao.key}
                  >
                    {generating === secao.key ? (
                      'Gerando...'
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar com IA
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={sections[secao.key] || ''}
                  onChange={(e) => setSections(prev => ({ ...prev, [secao.key]: e.target.value }))}
                  placeholder="O conteúdo será gerado automaticamente aqui..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
