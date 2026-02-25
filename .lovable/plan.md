

# Habilitar edição de avaliações LAIA na aba Avaliações

## Situação atual

- O `LAIAAssessmentForm` só suporta criação (usa `useCreateLAIAAssessment`, título fixo "Nova Avaliação LAIA")
- Na `LAIAUnidadePage`, o `viewMode === "edit"` mostra um placeholder "Edição em desenvolvimento..."
- O service `updateLAIAAssessment` e o hook `useUpdateLAIAAssessment` já existem e funcionam

## Alterações

### `src/components/laia/LAIAAssessmentForm.tsx`

Adaptar o componente para funcionar tanto em modo criação quanto edição:

- Adicionar prop opcional `initialData?: LAIAAssessment` na interface `LAIAAssessmentFormProps`
- Derivar modo (`isEditing = !!initialData`) a partir da presença de `initialData`
- Inicializar `formData` com os dados de `initialData` quando presente (mapeando os campos do `LAIAAssessment` para `LAIAAssessmentFormData`)
- Importar e usar `useUpdateLAIAAssessment` quando em modo edição
- No `handleSubmit`, chamar `updateMutation.mutateAsync({ id: initialData.id, data: formData })` se editando, ou `createMutation.mutateAsync(formData)` se criando
- Alterar título do card: "Editar Avaliação LAIA" vs "Nova Avaliação LAIA"
- Alterar texto do botão final: "Salvar Alterações" vs "Criar Avaliação"

### `src/pages/LAIAUnidadePage.tsx`

Substituir o placeholder de edição pelo formulário real:

- Na condição `viewMode === "edit" && selectedAssessment` (linhas 165-171), renderizar `<LAIAAssessmentForm>` passando `initialData={selectedAssessment}`
- Reutilizar os mesmos callbacks `onSuccess` e `onCancel` já usados no modo criação

## Detalhes técnicos

Mapeamento de `LAIAAssessment` → `LAIAAssessmentFormData` na inicialização:

```typescript
const mapAssessmentToFormData = (a: LAIAAssessment): LAIAAssessmentFormData => ({
  branch_id: a.branch_id || branchId,
  sector_id: a.sector_id || "",
  activity_operation: a.activity_operation,
  environmental_aspect: a.environmental_aspect,
  environmental_impact: a.environmental_impact,
  temporality: a.temporality,
  operational_situation: a.operational_situation,
  incidence: a.incidence,
  impact_class: a.impact_class,
  scope: a.scope,
  severity: a.severity,
  frequency_probability: a.frequency_probability,
  has_legal_requirements: a.has_legal_requirements,
  has_stakeholder_demand: a.has_stakeholder_demand,
  has_strategic_options: a.has_strategic_options,
  control_types: a.control_types || [],
  existing_controls: a.existing_controls || "",
  legislation_reference: a.legislation_reference || "",
  has_lifecycle_control: a.has_lifecycle_control,
  lifecycle_stages: a.lifecycle_stages || [],
  output_actions: a.output_actions || "",
  notes: a.notes || "",
});
```

Nenhuma alteração de banco de dados necessária — o service e hook de update já existem.

