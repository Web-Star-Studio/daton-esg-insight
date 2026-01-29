
# Plano: Corrigir Criacao de Licencas em /licenciamento/novo

## Diagnostico

O usuario reportou que ao clicar no botao "Criar Licenca" **nada acontece**. Analisando o codigo, identifiquei multiplos problemas que podem causar esse comportamento:

### Problema Principal: defaultValues Incompletos

O formulario usa `react-hook-form` com validacao Zod. Os campos de data sao obrigatorios:

```typescript
dataEmissao: z.date({ message: "Data de emissão é obrigatória" }),
dataVencimento: z.date({ message: "Data de vencimento é obrigatória" }),
```

Porem, os `defaultValues` nao incluem esses campos:

```typescript
defaultValues: {
  nome: "",
  tipo: "",
  orgaoEmissor: "",
  numeroProcesso: "",
  status: "",
  responsavel: "",
  condicionantes: "",
  // FALTAM: dataEmissao e dataVencimento
}
```

Quando o `react-hook-form` valida campos sem `defaultValue` definido, pode haver comportamento inconsistente.

### Problema Secundario: Validacao de Campos Select

O schema Zod exige `z.string().min(1)` para `tipo` e `status`, mas os valores iniciais sao strings vazias. Se os Selects nao estiverem propagando os valores corretamente, a validacao pode falhar silenciosamente.

### Problema Terciario: Toast de Erro Pode Nao Aparecer

O callback de erro do `handleSubmit` deveria mostrar um toast, mas se o erro ocorrer antes (por exemplo, na fase de parsing), o toast nao e exibido.

---

## Solucao

### 1. Corrigir defaultValues para Incluir Datas

Adicionar `dataEmissao` e `dataVencimento` como `undefined` explicitamente nos defaultValues.

### 2. Melhorar Feedback de Validacao

Adicionar validacao visual imediata (`mode: "all"` ou `mode: "onBlur"`) para que o usuario veja erros antes de clicar no botao.

### 3. Adicionar Console Log no Botao

Adicionar um `onClick` ao botao para diagnosticar se o evento esta sendo capturado.

### 4. Garantir que Toast de Erro Apareca

Verificar que o callback de erro esta sendo chamado e o toast esta configurado corretamente.

---

## Alteracoes

### Arquivo: `src/pages/LicenseForm.tsx`

**Mudanca 1**: Atualizar defaultValues (linhas 89-102)

```typescript
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  mode: "onBlur", // Validar ao sair do campo
  reValidateMode: "onChange",
  defaultValues: {
    nome: "",
    tipo: "",
    orgaoEmissor: "",
    numeroProcesso: "",
    dataEmissao: undefined,
    dataVencimento: undefined,
    status: "",
    responsavel: "",
    condicionantes: "",
  },
})
```

**Mudanca 2**: Adicionar onClick ao botao para debug (linhas 535-554)

```typescript
<Button 
  type="submit" 
  disabled={isSubmitting || createLicenseMutation.isPending || updateLicenseMutation.isPending}
  onClick={() => {
    console.log('Submit button clicked');
    console.log('Form values:', form.getValues());
    console.log('Form errors:', form.formState.errors);
  }}
  className={cn(
    "min-w-[150px]",
    Object.keys(form.formState.errors).length > 0 && "ring-2 ring-destructive ring-offset-2"
  )}
>
```

**Mudanca 3**: Melhorar mensagem de erro no handleSubmit

Tornar a mensagem de erro mais especifica e garantir que seja exibida:

```typescript
<form 
  id="licenca-form" 
  onSubmit={form.handleSubmit(
    onSubmit,
    (errors) => {
      console.error('Form validation errors:', errors);
      const errorMessages = Object.entries(errors)
        .map(([key, error]) => `${key}: ${error?.message}`)
        .join(', ');
      toast.error('Erro de validação', {
        description: errorMessages || 'Verifique os campos destacados em vermelho'
      });
    }
  )} 
  className="space-y-6"
>
```

---

## Resultado Esperado

| Cenario | Antes | Depois |
|---------|-------|--------|
| Clicar em Criar sem preencher | Nada acontece | Toast de erro com campos invalidos |
| Campos de data vazios | Falha silenciosa | Mensagem clara "Data de emissao e obrigatoria" |
| Debug | Sem logs | Logs detalhados no console |

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/LicenseForm.tsx` | Adicionar defaultValues para campos de data |
| `src/pages/LicenseForm.tsx` | Mudar mode para "onBlur" para validacao mais cedo |
| `src/pages/LicenseForm.tsx` | Adicionar onClick com logs no botao submit |
| `src/pages/LicenseForm.tsx` | Melhorar callback de erro do handleSubmit |
