import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type FormField } from "@/services/customForms";
import { Plus, X, Star, Upload } from "lucide-react";

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

  // Checkbox now also has options (radio behavior)
  const hasOptions = field.type === 'select' || field.type === 'multiselect' || field.type === 'checkbox';

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

        {/* Options for select, multiselect, and checkbox */}
        {hasOptions && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Opções</Label>
              <Button variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {field.type === 'checkbox' 
                ? 'Checkbox permite selecionar apenas 1 opção'
                : field.type === 'multiselect'
                  ? 'Múltipla escolha permite selecionar várias opções'
                  : 'Seleção única via dropdown'}
            </p>
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

        {/* Rating configuration */}
        {field.type === 'rating' && (
          <div className="space-y-2">
            <Label>Quantidade de Estrelas</Label>
            <Select 
              value={String(field.validation?.max || 5)} 
              onValueChange={(v) => onUpdate({ 
                validation: { ...field.validation, max: Number(v) } 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Estrelas</SelectItem>
                <SelectItem value="5">5 Estrelas</SelectItem>
                <SelectItem value="10">10 Estrelas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* File configuration */}
        {field.type === 'file' && (
          <div className="space-y-2">
            <Label htmlFor="fileTypes">Tipos de Arquivo Aceitos</Label>
            <Input
              id="fileTypes"
              value={field.validation?.pattern || ''}
              onChange={(e) => onUpdate({ 
                validation: { ...field.validation, pattern: e.target.value } 
              })}
              placeholder=".pdf,.jpg,.png,.doc,.docx"
            />
            <p className="text-xs text-muted-foreground">
              Separe as extensões por vírgula. Ex: .pdf,.jpg,.png
            </p>
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

        {/* Preview Section */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Pré-visualização</h4>
          <div className="p-3 border rounded-lg bg-muted/20">
            <Label className="text-sm">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="mt-2">
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
              
              {/* Checkbox with options (radio behavior) */}
              {field.type === 'checkbox' && field.options && field.options.length > 0 && (
                <div className="space-y-2">
                  {field.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        disabled 
                        name={`preview-${field.id}`}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{option}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Select preview */}
              {field.type === 'select' && field.options && (
                <div className="space-y-1">
                  {field.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        disabled 
                        name={`preview-${field.id}`}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{option}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Multiselect preview */}
              {field.type === 'multiselect' && field.options && (
                <div className="space-y-1">
                  {field.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        disabled 
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{option}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* NPS preview */}
              {field.type === 'nps' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Nada provável</span>
                    <span>Muito provável</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 11 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded text-xs flex items-center justify-center font-medium ${
                          i <= 6 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                          i <= 8 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        }`}
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Rating preview */}
              {field.type === 'rating' && (
                <div className="flex gap-1">
                  {Array.from({ length: field.validation?.max || 5 }, (_, i) => (
                    <Star 
                      key={i} 
                      className="h-6 w-6 text-yellow-400 fill-yellow-400" 
                    />
                  ))}
                </div>
              )}
              
              {/* File upload preview */}
              {field.type === 'file' && (
                <div className="border-2 border-dashed rounded-lg p-4 text-center bg-muted/30">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Clique ou arraste para enviar
                  </p>
                  {field.validation?.pattern && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Aceito: {field.validation.pattern}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
