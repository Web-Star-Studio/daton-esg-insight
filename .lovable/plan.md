
# Plano de Correcao de Bugs - Validacao Funcional

## Bugs Identificados

| ID | Severidade | Modulo | Descricao |
|----|------------|--------|-----------|
| BUG-001 | ALTA | ESG > SOCIAL | CPF invalido aceito no EmployeeModal (ex: 111.111.111-11) |
| BUG-002 | MEDIA | ESG > SOCIAL | SocialProjectModal sem botao Excluir com AlertDialog |
| BUG-003 | BAIXA | Dashboard | Erro 406 ao buscar company_id em algumas queries |

---

## Correcao BUG-001: Validacao de CPF no EmployeeModal

### Problema Atual
O `EmployeeModal.tsx` exibe uma mensagem de "CPF invalido" (linha 526-528), mas **nao bloqueia o envio do formulario** quando o CPF e invalido. A validacao e apenas visual.

```typescript
// Linha 526 - Apenas exibe mensagem, mas nao impede submit
{formData.cpf && !validateCPF(formData.cpf) && formData.cpf.replace(/\D/g, '').length === 11 && (
  <p className="text-xs text-destructive mt-1">CPF inválido</p>
)}
```

### Solucao
Adicionar validacao de CPF no `handleSubmit` antes de enviar:

**Arquivo:** `src/components/EmployeeModal.tsx`

1. Adicionar validacao de CPF no submit (apos linha 418):
```typescript
// Validar CPF se preenchido
if (formData.cpf && formData.cpf.replace(/\D/g, '').length === 11) {
  if (!validateCPF(formData.cpf)) {
    toast.error('CPF invalido. Verifique os digitos informados.');
    return;
  }
}
```

---

## Correcao BUG-002: Botao Excluir no SocialProjectModal

### Problema Atual
O `SocialProjectModal.tsx` nao possui botao de exclusao com confirmacao AlertDialog, violando o padrao `standardized-deletion-flow` estabelecido no sistema.

### Solucao
Adicionar estado e logica de exclusao com AlertDialog de confirmacao.

**Arquivo:** `src/components/social/SocialProjectModal.tsx`

**Alteracoes:**
1. Importar `deleteSocialProject` do service
2. Importar `AlertDialog` components
3. Adicionar estado `showDeleteConfirm`
4. Adicionar `isDeleting` state
5. Implementar funcao `handleDelete`
6. Adicionar botao "Excluir" no DialogFooter (visivel apenas em modo edicao)
7. Adicionar AlertDialog de confirmacao

**Codigo a Adicionar:**

```typescript
// Imports adicionais
import { deleteSocialProject } from "@/services/socialProjects";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

// Novos estados
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

// Funcao de exclusao
const handleDelete = async () => {
  if (!project) return;
  
  setIsDeleting(true);
  try {
    await deleteSocialProject(project.id);
    toast.success('Projeto excluido com sucesso!');
    onSuccess();
    onOpenChange(false);
  } catch (error) {
    console.error('Error deleting project:', error);
    toast.error('Erro ao excluir projeto');
  } finally {
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  }
};

// Botao no DialogFooter
{project && (
  <Button 
    type="button" 
    variant="destructive" 
    onClick={() => setShowDeleteConfirm(true)}
    disabled={isSubmitting || isDeleting}
    className="mr-auto"
  >
    <Trash2 className="mr-2 h-4 w-4" />
    Excluir
  </Button>
)}

// AlertDialog de confirmacao
<AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmar Exclusao</AlertDialogTitle>
      <AlertDialogDescription>
        Tem certeza que deseja excluir o projeto "{project?.name}"? 
        Esta acao nao pode ser desfeita.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleDelete}
        disabled={isDeleting}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        {isDeleting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Excluindo...
          </>
        ) : (
          'Excluir Projeto'
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Correcao BUG-003: Erro 406 Not Acceptable

### Problema Atual
Erro 406 ocorre quando a API retorna dados em formato diferente do esperado. Isso pode acontecer quando `.single()` e usado mas nenhum registro ou multiplos registros sao retornados.

### Analise
O `formErrorHandler.ts` ja usa `.maybeSingle()` corretamente (linha 47), mas outras partes do codigo podem estar usando `.single()`.

**Arquivos identificados com padrao potencialmente problematico:**
- `src/components/gri-wizard/DocumentUploadZone.tsx:78`
- `src/pages/SupplierFailuresPage.tsx:62`

### Solucao
Substituir `.single()` por `.maybeSingle()` nos arquivos identificados e adicionar tratamento de erro adequado.

**Arquivo:** `src/pages/SupplierFailuresPage.tsx`

```typescript
// ANTES (linha 62)
const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();

// DEPOIS
const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle();
```

**Arquivo:** `src/components/gri-wizard/DocumentUploadZone.tsx`

```typescript
// ANTES (linha 78)
company_id: (await supabase.from('profiles').select('company_id').eq('id', (await supabase.auth.getUser()).data.user?.id).single()).data?.company_id,

// DEPOIS - Refatorar para busca separada com maybeSingle
const { data: profile } = await supabase
  .from('profiles')
  .select('company_id')
  .eq('id', user?.id)
  .maybeSingle();
  
if (!profile?.company_id) {
  toast.error('Erro ao identificar empresa');
  return;
}
// Usar profile.company_id na insercao
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/EmployeeModal.tsx` | Adicionar validacao de CPF no handleSubmit |
| `src/components/social/SocialProjectModal.tsx` | Adicionar botao Excluir + AlertDialog |
| `src/pages/SupplierFailuresPage.tsx` | Substituir .single() por .maybeSingle() |
| `src/components/gri-wizard/DocumentUploadZone.tsx` | Refatorar query com .maybeSingle() |

---

## Secao Tecnica

### Validacao de CPF
A funcao `validateCPF` em `src/utils/formValidation.ts` ja implementa corretamente a validacao com digitos verificadores. O problema e que ela so exibe a mensagem de erro visualmente, sem bloquear o envio.

### Padrao AlertDialog
O sistema ja possui o padrao `standardized-deletion-flow` implementado em outros modais como `EmployeeModal.tsx` (linhas 17, 90, 101). A correcao segue o mesmo padrao.

### Erro 406 HTTP
Ocorre quando o cliente solicita um formato de resposta (via header Accept) que o servidor nao pode fornecer. No Supabase, `.single()` espera exatamente 1 resultado - se retorna 0 ou 2+, da erro 406.
