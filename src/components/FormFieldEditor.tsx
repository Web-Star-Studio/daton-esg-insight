import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { type FormField } from "@/services/customForms";
import { Plus, X } from "lucide-react";

interface FormFieldEditorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
}

export function FormFieldEditor({ field, onUpdate }: FormFieldEditorProps) {
  const addOption = () => {
    const currentOptions = field.options || [];
    onUpdate({
      options: [...currentOptions, `Opção ${currentOptions.length + 1}`]
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index) || [];
    onUpdate({ options: newOptions });
  };

  const hasOptions = field.type === 'select' || field.type === 'multiselect';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Editor de Campo
          <Badge variant="outline">{field.type}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="label">Label do Campo</Label>
          <Input
            id="label"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Digite o label do campo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="placeholder">Placeholder</Label>
          <Input
            id="placeholder"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Texto de exemplo (opcional)"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="required"
            checked={field.required}
            onCheckedChange={(required) => onUpdate({ required })}
          />
          <Label htmlFor="required">Campo obrigatório</Label>
        </div>

        {hasOptions && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Opções</Label>
              <Button variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={(field.options?.length || 0) <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {field.type === 'number' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="min">Valor Mínimo</Label>
              <Input
                id="min"
                type="number"
                value={field.validation?.min || ''}
                onChange={(e) => onUpdate({ 
                  validation: { 
                    ...field.validation, 
                    min: e.target.value ? Number(e.target.value) : undefined 
                  } 
                })}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max">Valor Máximo</Label>
              <Input
                id="max"
                type="number"
                value={field.validation?.max || ''}
                onChange={(e) => onUpdate({ 
                  validation: { 
                    ...field.validation, 
                    max: e.target.value ? Number(e.target.value) : undefined 
                  } 
                })}
                placeholder="Opcional"
              />
            </div>
          </div>
        )}

        {(field.type === 'text' || field.type === 'textarea') && (
          <div className="space-y-2">
            <Label htmlFor="pattern">Padrão de Validação (Regex)</Label>
            <Textarea
              id="pattern"
              value={field.validation?.pattern || ''}
              onChange={(e) => onUpdate({ 
                validation: { 
                  ...field.validation, 
                  pattern: e.target.value || undefined 
                } 
              })}
              placeholder="Exemplo: ^[A-Za-z]+$ (somente letras)"
              rows={2}
            />
          </div>
        )}

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Pré-visualização</h4>
          <div className="p-3 border rounded-lg bg-muted/20">
            <Label className="text-sm">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="mt-1">
              {field.type === 'text' && (
                <Input placeholder={field.placeholder} disabled />
              )}
              {field.type === 'textarea' && (
                <Textarea placeholder={field.placeholder} disabled rows={3} />
              )}
              {field.type === 'number' && (
                <Input type="number" placeholder={field.placeholder} disabled />
              )}
              {field.type === 'date' && (
                <Input type="date" disabled />
              )}
              {field.type === 'checkbox' && (
                <div className="flex items-center space-x-2">
                  <input type="checkbox" disabled />
                  <span className="text-sm">{field.placeholder || 'Opção'}</span>
                </div>
              )}
              {hasOptions && field.options && (
                <div className="space-y-1">
                  {field.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input 
                        type={field.type === 'multiselect' ? 'checkbox' : 'radio'} 
                        disabled 
                        name={`preview-${field.id}`}
                      />
                      <span className="text-sm">{option}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}