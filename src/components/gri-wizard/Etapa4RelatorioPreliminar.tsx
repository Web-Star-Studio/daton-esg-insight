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
