import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { customFormsService, type CustomForm, type FormField } from "@/services/customForms";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { NPSInput } from "@/components/forms/NPSInput";

interface PublicFormRendererProps {
  formId: string;
  onSubmitSuccess?: () => void;
}

export function PublicFormRenderer({ 
  formId, 
  onSubmitSuccess
}: PublicFormRendererProps) {
  const [form, setForm] = useState<CustomForm | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const data = await customFormsService.getPublicForm(formId);
      
      if (!data) {
        toast({ title: "Erro", description: "Formulário não encontrado ou não publicado", variant: "destructive" });
        return;
      }

      setForm(data);
      
      const initialData: Record<string, any> = {};
      data.structure_json.fields.forEach((field: FormField) => {
        if (field.type === 'checkbox') initialData[field.id] = false;
        else if (field.type === 'multiselect') initialData[field.id] = [];
        else if (field.type === 'nps') initialData[field.id] = null;
        else initialData[field.id] = '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
      toast({ title: "Erro", description: "Formulário não encontrado ou não publicado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form) return false;
    
    form.structure_json.fields.forEach((field: FormField) => {
      if (field.required) {
        const value = formData[field.id];
        if (field.type === 'multiselect' && Array.isArray(value) && value.length === 0) {
          newErrors[field.id] = 'Este campo é obrigatório';
        } else if (field.type === 'checkbox' && !value) {
          newErrors[field.id] = 'Este campo é obrigatório';
        } else if (field.type === 'nps' && (value === null || value === undefined)) {
          newErrors[field.id] = 'Este campo é obrigatório';
        } else if (field.type !== 'nps' && (!value || (typeof value === 'string' && value.trim() === ''))) {
          newErrors[field.id] = 'Este campo é obrigatório';
        }
      }
      
      if (field.validation && formData[field.id]) {
        const value = formData[field.id];
        if (field.validation.min !== undefined && field.type === 'number') {
          if (parseFloat(value) < field.validation.min) newErrors[field.id] = `Valor mínimo: ${field.validation.min}`;
        }
        if (field.validation.max !== undefined && field.type === 'number') {
          if (parseFloat(value) > field.validation.max) newErrors[field.id] = `Valor máximo: ${field.validation.max}`;
        }
        if (field.validation.pattern && (field.type === 'text' || field.type === 'textarea')) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) newErrors[field.id] = 'Formato inválido';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ title: "Erro de validação", description: "Por favor, corrija os erros no formulário", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      await customFormsService.submitPublicForm(formId, {
        submission_data: formData
      });

      toast({ title: "Sucesso", description: "Formulário enviado com sucesso!" });

      const resetData: Record<string, any> = {};
      form?.structure_json.fields.forEach((field: FormField) => {
        if (field.type === 'checkbox') resetData[field.id] = false;
        else if (field.type === 'multiselect') resetData[field.id] = [];
        else if (field.type === 'nps') resetData[field.id] = null;
        else resetData[field.id] = '';
      });
      setFormData(resetData);
      setErrors({});
      
      onSubmitSuccess?.();
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast({ title: "Erro", description: "Erro ao enviar formulário", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateFieldValue = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) setErrors(prev => ({ ...prev, [fieldId]: '' }));
  };

  const renderField = (field: FormField) => {
    const hasError = !!errors[field.id];
    const value = formData[field.id] || '';

    const fieldElement = () => {
      switch (field.type) {
        case 'text':
          return <Input type="text" value={value} onChange={(e) => updateFieldValue(field.id, e.target.value)} placeholder={field.placeholder} className={hasError ? 'border-destructive' : ''} />;
        case 'textarea':
          return <Textarea value={value} onChange={(e) => updateFieldValue(field.id, e.target.value)} placeholder={field.placeholder} rows={4} className={hasError ? 'border-destructive' : ''} />;
        case 'number':
          return <Input type="number" value={value} onChange={(e) => updateFieldValue(field.id, e.target.value)} placeholder={field.placeholder} min={field.validation?.min} max={field.validation?.max} className={hasError ? 'border-destructive' : ''} />;
        case 'date':
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", hasError && "border-destructive")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), "dd/MM/yyyy", { locale: ptBR }) : (field.placeholder || "Selecione uma data")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={value ? new Date(value) : undefined} onSelect={(date) => updateFieldValue(field.id, date?.toISOString().split('T')[0])} initialFocus />
              </PopoverContent>
            </Popover>
          );
        case 'checkbox':
          return (
            <div className="flex items-center space-x-2">
              <Checkbox id={field.id} checked={value} onCheckedChange={(checked) => updateFieldValue(field.id, checked)} />
              <Label htmlFor={field.id}>{field.label}</Label>
            </div>
          );
        case 'select':
          return (
            <Select value={value} onValueChange={(newValue) => updateFieldValue(field.id, newValue)}>
              <SelectTrigger className={hasError ? 'border-destructive' : ''}><SelectValue placeholder={field.placeholder || "Selecione"} /></SelectTrigger>
              <SelectContent>{field.options?.map((option, i) => <SelectItem key={i} value={option}>{option}</SelectItem>)}</SelectContent>
            </Select>
          );
        case 'multiselect':
          return (
            <div className="space-y-2">
              {field.options?.map((option, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Checkbox id={`${field.id}_${i}`} checked={Array.isArray(value) && value.includes(option)} onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (checked) updateFieldValue(field.id, [...currentValues, option]);
                    else updateFieldValue(field.id, currentValues.filter((v: string) => v !== option));
                  }} />
                  <Label htmlFor={`${field.id}_${i}`}>{option}</Label>
                </div>
              ))}
            </div>
          );
        case 'nps':
          return (
            <NPSInput
              value={value !== '' && value !== null ? Number(value) : null}
              onChange={(score) => updateFieldValue(field.id, score)}
              hasError={hasError}
            />
          );
        default: return null;
      }
    };

    return (
      <div key={field.id} className="space-y-2">
        {field.type !== 'checkbox' && <Label htmlFor={field.id}>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>}
        {fieldElement()}
        {hasError && <p className="text-sm text-destructive">{errors[field.id]}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader><div className="animate-pulse space-y-2"><div className="h-6 bg-muted rounded w-3/4"></div><div className="h-4 bg-muted rounded w-1/2"></div></div></CardHeader>
        <CardContent><div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="space-y-2"><div className="h-4 bg-muted rounded w-1/4"></div><div className="h-10 bg-muted rounded"></div></div>)}</div></CardContent>
      </Card>
    );
  }

  if (!form) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Formulário não encontrado</h3>
          <p className="text-muted-foreground">O formulário solicitado não existe ou não está disponível.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        {form.description && <CardDescription>{form.description}</CardDescription>}
        <div className="flex items-center gap-2">
          <Badge variant="outline">{form.structure_json.fields.length} campos</Badge>
          {form.is_published && <Badge variant="default">Publicado</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.structure_json.fields.map((field: FormField) => renderField(field))}
          
          <div className="pt-4 border-t">
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Enviando..." : "Enviar Formulário"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}