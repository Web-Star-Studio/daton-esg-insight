import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, RefreshCw, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface AIContentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  sectionType: string;
  sectionTitle: string;
  currentContent?: string;
  onContentGenerated: (content: string) => void;
}

const CONTENT_TYPES = {
  'organizational_profile': {
    prompt: 'Crie um perfil organizacional detalhado para um relatório de sustentabilidade GRI, incluindo informações sobre estrutura da empresa, atividades principais, cadeia de valor e governança.',
    suggestions: ['Estrutura societária', 'Cadeia de valor', 'Principais atividades', 'Mercados servidos']
  },
  'strategy': {
    prompt: 'Desenvolva uma seção de estratégia de sustentabilidade que inclua visão, missão, objetivos estratégicos e compromissos ESG.',
    suggestions: ['Visão de sustentabilidade', 'Estratégia climática', 'Objetivos de longo prazo', 'Compromissos ESG']
  },
  'governance': {
    prompt: 'Elabore uma seção sobre governança corporativa focada em estruturas de tomada de decisão, supervisão e responsabilidades em sustentabilidade.',
    suggestions: ['Estrutura de governança', 'Comitês de sustentabilidade', 'Responsabilidades', 'Processos decisórios']
  },
  'stakeholder_engagement': {
    prompt: 'Crie conteúdo sobre engajamento com stakeholders, incluindo identificação, métodos de engajamento e temas materiais identificados.',
    suggestions: ['Mapeamento de stakeholders', 'Canais de engajamento', 'Frequência de interações', 'Feedback coletado']
  },
  'material_topics': {
    prompt: 'Desenvolva uma análise de materialidade que identifique e priorize os temas ESG mais relevantes para a organização e seus stakeholders.',
    suggestions: ['Processo de materialidade', 'Temas prioritários', 'Impactos identificados', 'Matriz de materialidade']
  },
  'economic_performance': {
    prompt: 'Elabore uma seção sobre performance econômica incluindo valor econômico gerado e distribuído, impactos econômicos indiretos.',
    suggestions: ['Valor econômico direto', 'Impactos na comunidade', 'Investimentos locais', 'Cadeia de fornecimento']
  },
  'environmental_performance': {
    prompt: 'Crie conteúdo sobre performance ambiental cobrindo gestão de recursos, emissões, resíduos e biodiversidade.',
    suggestions: ['Gestão hídrica', 'Emissões GEE', 'Economia circular', 'Conservação']
  },
  'social_performance': {
    prompt: 'Desenvolva uma seção sobre performance social incluindo diversidade, saúde e segurança, desenvolvimento de pessoas.',
    suggestions: ['Diversidade e inclusão', 'Saúde e segurança', 'Desenvolvimento profissional', 'Direitos humanos']
  }
};

export function AIContentGeneratorModal({
  isOpen,
  onClose,
  reportId,
  sectionType,
  sectionTitle,
  currentContent,
  onContentGenerated
}: AIContentGeneratorModalProps) {
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [customPrompt, setCustomPrompt] = useState('');

  const generateContent = async () => {
    setIsGenerating(true);
    try {
      const contentConfig = CONTENT_TYPES[sectionType as keyof typeof CONTENT_TYPES];
      const basePrompt = contentConfig?.prompt || `Crie conteúdo para a seção "${sectionTitle}" de um relatório de sustentabilidade GRI.`;
      
      const lengthInstruction = {
        'short': 'Seja conciso e direto, máximo 2 parágrafos.',
        'medium': 'Desenvolva o conteúdo com 3-4 parágrafos bem estruturados.',
        'long': 'Crie um conteúdo detalhado e abrangente com 5-6 parágrafos.'
      };

      const toneInstruction = {
        'professional': 'Use um tom profissional e corporativo.',
        'accessible': 'Use linguagem acessível e clara para diversos públicos.',
        'technical': 'Use terminologia técnica apropriada para especialistas.'
      };

      const fullPrompt = `
        ${basePrompt}
        
        ${toneInstruction[tone as keyof typeof toneInstruction]}
        ${lengthInstruction[length as keyof typeof lengthInstruction]}
        
        ${customPrompt ? `Instruções adicionais: ${customPrompt}` : ''}
        
        ${currentContent ? `Conteúdo atual para referência: ${currentContent}` : ''}
        
        Formate o texto de forma profissional e pronto para uso em relatório de sustentabilidade.
      `;

      const { data, error } = await supabase.functions.invoke('gri-content-generator', {
        body: {
          reportId,
          sectionKey: sectionType,
          contentType: sectionTitle,
          context: fullPrompt,
          regenerate: !!currentContent
        }
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      toast.success('Conteúdo gerado com sucesso!');
    } catch (error: any) {
      logger.error('Erro ao gerar conteúdo', error);
      
      // Provide more specific error messages
      let errorMessage = 'Erro ao gerar conteúdo. Tente novamente.';
      
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'A geração está demorando muito. Tente com um prompt mais simples.';
      } else if (error?.message?.includes('unauthorized') || error?.message?.includes('auth')) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseContent = () => {
    onContentGenerated(generatedContent);
    onClose();
    toast.success('Conteúdo aplicado à seção!');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Conteúdo copiado para a área de transferência!');
  };

  const suggestions = CONTENT_TYPES[sectionType as keyof typeof CONTENT_TYPES]?.suggestions || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Gerador de Conteúdo IA - {sectionTitle}
          </DialogTitle>
          <DialogDescription>
            Configure as opções abaixo e clique em "Gerar Conteúdo com IA" para criar conteúdo profissional para esta seção do seu relatório GRI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tom de Voz</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="accessible">Acessível</SelectItem>
                  <SelectItem value="technical">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Extensão</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Conciso</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="long">Detalhado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <Label>Sugestões de Conteúdo</Label>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Badge 
                    key={index}
                    variant="secondary" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setCustomPrompt(customPrompt + (customPrompt ? ', ' : '') + suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label>Instruções Personalizadas (Opcional)</Label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ex: Incluir dados específicos da empresa, mencionar certificações ISO, focar em inovação..."
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateContent}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Gerando Conteúdo...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Gerar Conteúdo com IA
              </>
            )}
          </Button>

          {/* Generated Content */}
          {generatedContent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Conteúdo Gerado</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateContent} disabled={isGenerating}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/30 max-h-80 overflow-y-auto">
                <div className="whitespace-pre-wrap text-sm">
                  {generatedContent}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button onClick={handleUseContent}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Usar Este Conteúdo
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}