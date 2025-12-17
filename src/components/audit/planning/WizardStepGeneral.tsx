import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/audit/useCategories";
import { useTemplates } from "@/hooks/audit/useTemplates";
import { AuditFormData } from "./AuditCreationWizard";

interface WizardStepGeneralProps {
  formData: AuditFormData;
  onUpdate: (data: Partial<AuditFormData>) => void;
}

const entityTypes = [
  { value: "unit", label: "Unidade/Filial" },
  { value: "department", label: "Departamento" },
  { value: "process", label: "Processo" },
  { value: "supplier", label: "Fornecedor" },
  { value: "project", label: "Projeto" },
  { value: "other", label: "Outro" },
];

export function WizardStepGeneral({ formData, onUpdate }: WizardStepGeneralProps) {
  const { data: categories } = useCategories();
  const { data: allTemplates } = useTemplates();
  const templates = allTemplates?.filter(t => !formData.category_id || t.category_id === formData.category_id);

  const handleCategoryChange = (categoryId: string) => {
    onUpdate({ 
      category_id: categoryId || undefined,
      template_id: undefined, // Reset template when category changes
    });
  };

  return (
    <div className="space-y-6 px-1">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="title">Título da Auditoria *</Label>
          <Input
            id="title"
            placeholder="Ex: Auditoria Interna ISO 9001 - Unidade SP"
            value={formData.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={formData.category_id || ""}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template">Template</Label>
          <Select
            value={formData.template_id || ""}
            onValueChange={(v) => onUpdate({ template_id: v || undefined })}
            disabled={!formData.category_id}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.category_id ? "Selecione um template" : "Selecione uma categoria primeiro"} />
            </SelectTrigger>
            <SelectContent>
              {templates?.map((tpl) => (
                <SelectItem key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_entity">Entidade Auditada</Label>
          <Input
            id="target_entity"
            placeholder="Ex: Unidade São Paulo, Fornecedor XYZ"
            value={formData.target_entity || ""}
            onChange={(e) => onUpdate({ target_entity: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_entity_type">Tipo de Entidade</Label>
          <Select
            value={formData.target_entity_type || ""}
            onValueChange={(v) => onUpdate({ target_entity_type: v || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date">Data Início</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date || ""}
            onChange={(e) => onUpdate({ start_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Data Fim</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date || ""}
            onChange={(e) => onUpdate({ end_date: e.target.value })}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="description">Descrição / Objetivo</Label>
          <Textarea
            id="description"
            placeholder="Descreva o objetivo e escopo da auditoria..."
            rows={3}
            value={formData.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
