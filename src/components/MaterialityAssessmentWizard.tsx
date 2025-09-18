import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight, ArrowLeft } from 'lucide-react';
import { MaterialityTheme, MaterialityAssessment, MATERIALITY_CATEGORIES } from '@/services/materiality';

interface MaterialityAssessmentWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (assessment: Omit<MaterialityAssessment, 'id' | 'created_at' | 'updated_at'>) => void;
  themes: MaterialityTheme[];
}

const STEPS = [
  { id: 'basic', title: 'Informações Básicas', description: 'Definir título, ano e metodologia' },
  { id: 'themes', title: 'Seleção de Temas', description: 'Escolher temas materiais relevantes' },
  { id: 'stakeholders', title: 'Stakeholders', description: 'Identificar grupos de interesse' },
  { id: 'review', title: 'Revisão', description: 'Confirmar configurações' },
];

const STAKEHOLDER_CATEGORIES = [
  'Funcionários',
  'Clientes',
  'Fornecedores',
  'Investidores',
  'Comunidade Local',
  'Governo/Reguladores',
  'ONGs',
  'Mídia',
  'Sindicatos',
  'Academia'
];

export const MaterialityAssessmentWizard = ({ 
  open, 
  onClose, 
  onSubmit, 
  themes 
}: MaterialityAssessmentWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: `Avaliação de Materialidade ${new Date().getFullYear()}`,
    description: `Análise de materialidade para o exercício de ${new Date().getFullYear()}`,
    assessment_year: new Date().getFullYear(),
    methodology: 'GRI Standards',
    selected_themes: [] as string[],
    stakeholder_categories: [] as string[],
  });

  const currentStepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const assessment: Omit<MaterialityAssessment, 'id' | 'created_at' | 'updated_at'> = {
      company_id: '', // Será preenchido via RLS
      title: formData.title,
      description: formData.description,
      assessment_year: formData.assessment_year,
      status: 'draft',
      methodology: formData.methodology,
      selected_themes: formData.selected_themes,
      stakeholder_participation: formData.stakeholder_categories.length,
      internal_score: {},
      external_score: {},
      final_matrix: {},
      created_by_user_id: '', // Será preenchido automaticamente
    };

    onSubmit(assessment);
    onClose();
  };

  const toggleTheme = (themeId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_themes: prev.selected_themes.includes(themeId)
        ? prev.selected_themes.filter(id => id !== themeId)
        : [...prev.selected_themes, themeId]
    }));
  };

  const toggleStakeholder = (category: string) => {
    setFormData(prev => ({
      ...prev,
      stakeholder_categories: prev.stakeholder_categories.includes(category)
        ? prev.stakeholder_categories.filter(c => c !== category)
        : [...prev.stakeholder_categories, category]
    }));
  };

  const isStepValid = () => {
    switch (currentStepData.id) {
      case 'basic':
        return formData.title.trim() && formData.assessment_year;
      case 'themes':
        return formData.selected_themes.length > 0;
      case 'stakeholders':
        return formData.stakeholder_categories.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título da Avaliação</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Avaliação de Materialidade 2024"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o objetivo desta avaliação..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Ano de Referência</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.assessment_year}
                  onChange={(e) => setFormData(prev => ({ ...prev, assessment_year: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="methodology">Metodologia</Label>
                <Input
                  id="methodology"
                  value={formData.methodology}
                  onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
                  placeholder="Ex: GRI Standards"
                />
              </div>
            </div>
          </div>
        );

      case 'themes':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Selecione os temas materiais relevantes para sua organização
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.selected_themes.length} de {themes.length} temas selecionados
              </p>
            </div>
            
            {MATERIALITY_CATEGORIES.map(category => {
              const categoryThemes = themes.filter(theme => theme.category === category.value);
              const selectedInCategory = categoryThemes.filter(theme => 
                formData.selected_themes.includes(theme.id)
              ).length;
              
              return (
                <Card key={category.value}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${category.color}-500`}></div>
                      {category.label}
                      <Badge variant="secondary" className="ml-auto">
                        {selectedInCategory}/{categoryThemes.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {categoryThemes.map(theme => (
                        <div key={theme.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={theme.id}
                            checked={formData.selected_themes.includes(theme.id)}
                            onCheckedChange={() => toggleTheme(theme.id)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={theme.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {theme.title}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {theme.description}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {theme.gri_indicators.slice(0, 3).map(indicator => (
                                <Badge key={indicator} variant="outline" className="text-xs">
                                  {indicator}
                                </Badge>
                              ))}
                              {theme.gri_indicators.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{theme.gri_indicators.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );

      case 'stakeholders':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Selecione os grupos de stakeholders que participarão da avaliação
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.stakeholder_categories.length} grupos selecionados
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {STAKEHOLDER_CATEGORIES.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`stakeholder-${category}`}
                    checked={formData.stakeholder_categories.includes(category)}
                    onCheckedChange={() => toggleStakeholder(category)}
                  />
                  <label
                    htmlFor={`stakeholder-${category}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Revisão da Configuração</h3>
              <p className="text-sm text-muted-foreground">
                Verifique as informações antes de criar a avaliação
              </p>
            </div>
            
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Título:</span>
                    <span className="text-sm font-medium">{formData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ano:</span>
                    <span className="text-sm font-medium">{formData.assessment_year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Metodologia:</span>
                    <span className="text-sm font-medium">{formData.methodology}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Temas Selecionados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {formData.selected_themes.map(themeId => {
                      const theme = themes.find(t => t.id === themeId);
                      return theme ? (
                        <Badge key={theme.id} variant="secondary">
                          {theme.title}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.selected_themes.length} temas selecionados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Stakeholders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {formData.stakeholder_categories.map(category => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.stakeholder_categories.length} grupos de stakeholders
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Avaliação de Materialidade</DialogTitle>
          <DialogDescription>
            Configure sua avaliação de materialidade seguindo as etapas abaixo
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Etapa {currentStep + 1} de {STEPS.length}</span>
            <span>{Math.round(progress)}% concluído</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Steps Navigation */}
        <div className="flex justify-between mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index <= currentStep 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'border-muted-foreground text-muted-foreground'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-2 hidden sm:block">
                <p className={`text-sm font-medium ${
                  index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 mx-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
            <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
          </div>
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          {currentStep === STEPS.length - 1 ? (
            <Button onClick={handleSubmit} disabled={!isStepValid()}>
              Criar Avaliação
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!isStepValid()}>
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};