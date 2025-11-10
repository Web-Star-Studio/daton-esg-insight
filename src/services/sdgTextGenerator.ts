import { supabase } from '@/integrations/supabase/client';
import { SDG_DATA } from '@/constants/sdgData';

interface SDGAlignmentData {
  sdg_number: number;
  selected_targets: string[];
  impact_level: string;
  actions_taken?: string;
  results_achieved?: string;
  future_commitments?: string;
}

export async function generateSDGReportText(
  reportId: string,
  useAI: boolean = false
): Promise<string> {
  try {
    const { data: sdgData, error } = await supabase
      .from('sdg_alignment')
      .select('*')
      .eq('report_id', reportId);

    if (error) throw error;

    if (!sdgData || sdgData.length === 0) {
      return 'Nenhum ODS selecionado para este relatório.';
    }

    if (useAI) {
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
        'gri-content-generator',
        {
          body: {
            reportId,
            sectionKey: 'sdg_alignment',
            sdgData: sdgData
          }
        }
      );

      if (aiError) {
        console.error('AI generation error:', aiError);
        throw new Error('Erro ao gerar texto com IA');
      }

      return aiResponse.generated_text;
    } else {
      return generateBasicSDGText(sdgData);
    }
  } catch (error) {
    console.error('Error generating SDG text:', error);
    throw error;
  }
}

function generateBasicSDGText(sdgData: SDGAlignmentData[]): string {
  let text = `# Objetivos de Desenvolvimento Sustentável (ODS)\n\n`;
  text += `A organização adota os seguintes Objetivos de Desenvolvimento Sustentável (ODS) da Agenda 2030 da ONU como parte integrante de sua estratégia de sustentabilidade:\n\n`;

  sdgData.forEach((item, index) => {
    const sdg = SDG_DATA.find(s => s.number === item.sdg_number);
    if (!sdg) return;

    text += `## ODS ${sdg.number} - ${sdg.name}\n\n`;
    text += `**Descrição:** ${sdg.description}\n\n`;
    text += `**Nível de Contribuição:** ${item.impact_level || 'Médio'}\n\n`;

    if (item.selected_targets && item.selected_targets.length > 0) {
      text += `**Metas da Agenda 2030:**\n`;
      item.selected_targets.forEach(targetCode => {
        const target = sdg.targets.find(t => t.code === targetCode);
        if (target) {
          text += `- **${targetCode}:** ${target.description}\n`;
        }
      });
      text += `\n`;
    }

    if (item.actions_taken) {
      text += `**Ações Realizadas:**\n${item.actions_taken}\n\n`;
    }

    if (item.results_achieved) {
      text += `**Resultados Alcançados:**\n${item.results_achieved}\n\n`;
    }

    if (item.future_commitments) {
      text += `**Compromissos Futuros:**\n${item.future_commitments}\n\n`;
    }

    if (index < sdgData.length - 1) {
      text += `---\n\n`;
    }
  });

  text += `\n## Alinhamento com o Pacto Global\n\n`;
  text += `Esta seleção de ODS está alinhada aos princípios do Pacto Global da ONU, demonstrando o compromisso da organização com práticas empresariais responsáveis nas áreas de:\n\n`;
  text += `- **Direitos Humanos:** Apoiar e respeitar a proteção de direitos humanos reconhecidos internacionalmente\n`;
  text += `- **Trabalho:** Garantir condições de trabalho dignas e seguras\n`;
  text += `- **Meio Ambiente:** Promover a responsabilidade ambiental e o desenvolvimento de tecnologias limpas\n`;
  text += `- **Anticorrupção:** Combater a corrupção em todas as suas formas\n\n`;
  text += `A organização continuará integrando esses objetivos em sua estratégia de negócios, contribuindo ativamente para a Agenda 2030.`;

  return text;
}

export async function exportSDGSection(reportId: string): Promise<{
  markdown: string;
  html: string;
  plainText: string;
}> {
  const markdown = await generateSDGReportText(reportId, false);
  
  const html = markdown
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '<br><br>');
  
  const plainText = markdown
    .replace(/^#+ (.*$)/gm, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^- /gm, '• ');

  return { markdown, html, plainText };
}
