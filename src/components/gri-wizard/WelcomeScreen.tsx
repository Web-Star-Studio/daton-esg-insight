import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  FileText, 
  BarChart3, 
  Users, 
  Target, 
  CheckCircle2,
  Sparkles,
  Download,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const AUDIENCE_OPTIONS = [
  { id: 'investors', label: 'Investidores', icon: TrendingUp },
  { id: 'shareholders', label: 'Acionistas', icon: Users },
  { id: 'employees', label: 'Colaboradores', icon: Users },
  { id: 'customers', label: 'Clientes', icon: Target },
  { id: 'suppliers', label: 'Fornecedores', icon: BarChart3 },
  { id: 'society', label: 'Sociedade', icon: Users },
];

export function WelcomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [objective, setObjective] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const toggleAudience = (audienceId: string) => {
    setSelectedAudience(prev =>
      prev.includes(audienceId)
        ? prev.filter(id => id !== audienceId)
        : [...prev, audienceId]
    );
  };

  const handleCreateReport = async () => {
    if (!purpose.trim()) {
      toast.error('Por favor, confirme o propósito do relatório');
      return;
    }

    if (selectedAudience.length === 0) {
      toast.error('Selecione ao menos um público-alvo');
      return;
    }

    setIsCreating(true);

    try {
      // Get user profile to get company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (profileError || !profile?.company_id) {
        toast.error('Erro ao buscar informações do usuário');
        return;
      }

      // Create new report
      const { data: report, error: reportError } = await supabase
        .from('gri_reports')
        .insert({
          company_id: profile.company_id,
          report_title: 'Novo Relatório GRI',
          year: new Date().getFullYear(),
          gri_standard_version: 'GRI Standards 2021',
          reporting_period_start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
          reporting_period_end: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
          organization_purpose: purpose,
          report_objective: objective,
          target_audience: selectedAudience,
        })
        .select()
        .single();

      if (reportError) {
        toast.error('Erro ao criar relatório');
        console.error(reportError);
        return;
      }

      toast.success('Relatório criado com sucesso!');
      navigate(`/assistente-gri/${report.id}`);
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error('Erro ao criar relatório');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Lightbulb className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Elabore Relatórios de Sustentabilidade GRI com IA
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transforme seus dados, evidências e documentos em relatórios profissionais seguindo o padrão GRI Standards
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">IA Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Nossa IA interpreta contextos organizacionais, redige tópicos seguindo normas GRI e identifica informações específicas em documentos
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Visualizações Automáticas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Gera automaticamente gráficos, dashboards e tabelas para melhor visibilidade de números e indicadores de desempenho
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Múltiplos Formatos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Exporte em Word (.docx) para edição e diagramação personalizada, ou em PDF final pronto para publicação
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Objetivo Principal */}
        <Card className="mb-8 border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Objetivo Principal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Elaboração de Relatórios GRI</p>
                <p className="text-sm text-muted-foreground">
                  Esta ferramenta elabora relatórios completos no padrão GRI Standards a partir de seus dados, evidências e documentos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Geração de Textos Descritivos</p>
                <p className="text-sm text-muted-foreground">
                  A IA elabora textos profissionais e contextualizados para cada seção do seu relatório de sustentabilidade
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Baseado em Normas GRI e Modelos</p>
                <p className="text-sm text-muted-foreground">
                  Utiliza como base as normas GRI Standards 2021 e modelos de relatórios reconhecidos internacionalmente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Público-Alvo */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Para Quem São Seus Relatórios
            </CardTitle>
            <CardDescription>
              Seus relatórios serão lidos por diversos stakeholders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AUDIENCE_OPTIONS.map((audience) => (
                <div
                  key={audience.id}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
                >
                  <audience.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{audience.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setShowModal(true)}
            className="gap-2 text-lg px-8 py-6"
          >
            <Sparkles className="h-5 w-5" />
            Iniciar Novo Relatório
            <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Configure em 7 etapas simples e deixe a IA trabalhar para você
          </p>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Seu Novo Relatório GRI</DialogTitle>
            <DialogDescription>
              Confirme o propósito e selecione o público-alvo do relatório
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Propósito */}
            <div className="space-y-2">
              <Label htmlFor="purpose">
                Confirme o Propósito deste Relatório *
              </Label>
              <Textarea
                id="purpose"
                placeholder="Ex: Demonstrar compromisso com sustentabilidade, transparência e conformidade com padrões internacionais..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Objetivo Específico */}
            <div className="space-y-2">
              <Label htmlFor="objective">
                Objetivo Específico (Opcional)
              </Label>
              <Textarea
                id="objective"
                placeholder="Ex: Atender exigência de investidores ESG, comunicar avanços em metas de carbono zero..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Público-Alvo */}
            <div className="space-y-2">
              <Label>Para Quem é Este Relatório? *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Selecione todos os públicos-alvo relevantes
              </p>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_OPTIONS.map((audience) => (
                  <Badge
                    key={audience.id}
                    variant={selectedAudience.includes(audience.id) ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
                    onClick={() => toggleAudience(audience.id)}
                  >
                    <audience.icon className="h-3 w-3 mr-1.5" />
                    {audience.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateReport}
              disabled={isCreating || !purpose.trim() || selectedAudience.length === 0}
              className="gap-2"
            >
              {isCreating ? (
                <>Criando...</>
              ) : (
                <>
                  Confirmar e Começar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
