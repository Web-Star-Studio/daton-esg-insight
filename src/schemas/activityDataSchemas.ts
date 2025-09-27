import { z } from 'zod';

// Schema para dados de atividade
export const activityDataSchema = z.object({
  period_start_date: z.date({
    message: "Data de início é obrigatória"
  }),
  period_end_date: z.date({
    message: "Data de fim é obrigatória"
  }),
  quantity: z.number({
    message: "Quantidade deve ser um número positivo"
  }).positive("Quantidade deve ser positiva"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  source_document: z.string().optional(),
  emission_factor_id: z.string().min(1, "Fator de emissão é obrigatório")
}).refine(
  (data) => data.period_end_date >= data.period_start_date,
  {
    message: "Data de fim deve ser posterior à data de início",
    path: ["period_end_date"]
  }
);

// Schema para formulários (string inputs)
export const activityDataFormSchema = z.object({
  period_start_date: z.string().min(1, "Data de início é obrigatória"),
  period_end_date: z.string().min(1, "Data de fim é obrigatória"),
  quantity: z.string()
    .min(1, "Quantidade é obrigatória")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Quantidade deve ser um número positivo"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  source_document: z.string().optional(),
  emission_factor_id: z.string().min(1, "Fator de emissão é obrigatório")
});

export type ActivityDataInput = z.infer<typeof activityDataSchema>;
export type ActivityDataFormInput = z.infer<typeof activityDataFormSchema>;