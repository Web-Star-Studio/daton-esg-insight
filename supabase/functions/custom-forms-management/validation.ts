// Validation schemas for custom forms management
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Form field structure validation
const FormFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'textarea', 'number', 'select', 'checkbox', 'radio', 'date', 'file', 'multiselect', 'nps', 'rating', 'message']),
  label: z.string().min(1, 'Label is required'),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  content: z.string().optional(), // For message type fields
  options: z.union([
    z.array(z.object({
      label: z.string(),
      value: z.string()
    })),
    z.array(z.string())
  ]).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional()
  }).optional()
});

// Form structure validation
const FormStructureSchema = z.object({
  fields: z.array(FormFieldSchema),
  sections: z.array(z.object({
    title: z.string(),
    fields: z.array(z.string())
  })).optional(),
  theme: z.object({
    primaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    logoUrl: z.string().optional(),
    logoPosition: z.enum(['left', 'center', 'right']).optional(),
    footerImageUrl: z.string().optional(),
    footerImagePosition: z.enum(['left', 'center', 'right']).optional()
  }).optional()
});

// Create form validation
export const CreateFormSchema = z.object({
  action: z.literal('CREATE_FORM'),
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  structure_json: FormStructureSchema,
  is_published: z.boolean().optional()
});

// Update form validation
export const UpdateFormSchema = z.object({
  action: z.literal('UPDATE_FORM'),
  formId: z.string().uuid('Invalid form ID'),
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .optional(),
  description: z.string().optional(),
  structure_json: FormStructureSchema.optional(),
  is_published: z.boolean().optional()
});

// Delete form validation
export const DeleteFormSchema = z.object({
  action: z.literal('DELETE_FORM'),
  formId: z.string().uuid('Invalid form ID')
});

// Submit form validation
export const SubmitFormSchema = z.object({
  action: z.literal('SUBMIT_FORM'),
  form_id: z.string().uuid('Invalid form ID'),
  submission_data: z.record(z.any()),
  employee_id: z.string().uuid('Invalid employee ID').optional()
});

// Get form validation
export const GetFormSchema = z.object({
  action: z.literal('GET_FORM'),
  formId: z.string().uuid('Invalid form ID')
});

// Get submissions validation
export const GetSubmissionsSchema = z.object({
  action: z.literal('GET_SUBMISSIONS'),
  formId: z.string().uuid('Invalid form ID')
});

// Get employee submissions validation
export const GetEmployeeSubmissionsSchema = z.object({
  action: z.literal('GET_EMPLOYEE_SUBMISSIONS'),
  employeeId: z.string().uuid('Invalid employee ID')
});

// Get forms validation
export const GetFormsSchema = z.object({
  action: z.literal('GET_FORMS')
});

// Public form validation (no auth required)
export const GetPublicFormSchema = z.object({
  action: z.literal('GET_PUBLIC_FORM'),
  formId: z.string().uuid('Invalid form ID')
});

// Public form submission validation (no auth required)
export const SubmitPublicFormSchema = z.object({
  action: z.literal('SUBMIT_PUBLIC_FORM'),
  form_id: z.string().uuid('Invalid form ID'),
  submission_data: z.record(z.any()),
  employee_id: z.string().uuid('Invalid employee ID').optional()
});

// Delete submission validation
export const DeleteSubmissionSchema = z.object({
  action: z.literal('DELETE_SUBMISSION'),
  submissionId: z.string().uuid('Invalid submission ID')
});

// Union of all action schemas
export const ActionSchema = z.discriminatedUnion('action', [
  CreateFormSchema,
  UpdateFormSchema,
  DeleteFormSchema,
  SubmitFormSchema,
  GetFormSchema,
  GetSubmissionsSchema,
  GetEmployeeSubmissionsSchema,
  GetFormsSchema,
  GetPublicFormSchema,
  SubmitPublicFormSchema,
  DeleteSubmissionSchema
]);

export type ActionType = z.infer<typeof ActionSchema>;