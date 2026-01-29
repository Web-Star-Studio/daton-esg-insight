
# Plano: Resolver Dependencia de Setores para Criar Avaliacoes LAIA

## Diagnostico

Ao criar uma nova avaliacao LAIA (`/laia/unidade/:id` -> Nova Avaliacao), o campo **Setor** e obrigatorio. Se nao existem setores cadastrados, o dropdown fica vazio e o usuario nao consegue prosseguir no wizard.

```
Hierarquia: Setor -> Avaliacao LAIA
```

A aba "Setores" para cadastrar setores existe na mesma pagina, mas o usuario nao e informado sobre isso quando o dropdown esta vazio.

---

## Solucao

Adicionar um alerta informativo no Step 1 do formulario `LAIAAssessmentForm.tsx` quando nao houver setores ativos disponveis, com link direto para a aba de setores.

---

## Alteracoes

### Arquivo: `src/components/laia/LAIAAssessmentForm.tsx`

**Mudanca 1**: Adicionar import do Alert e Link

```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
```

**Mudanca 2**: Adicionar alerta quando nao ha setores ativos (linhas ~236-256)

Na secao do Step 1, apos o titulo "Identificacao", adicionar um alerta condicional:

```typescript
{currentStep === 1 && (
  <div className="space-y-4">
    <h3 className="text-lg font-medium">Identificação</h3>
    
    {/* Novo alerta quando não há setores */}
    {(!sectors || sectors.filter(s => s.is_active).length === 0) && (
      <Alert variant="destructive" className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">
          Nenhum setor cadastrado
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          Para criar avaliações LAIA, é necessário cadastrar ao menos um setor.
          Use a aba <strong>"Setores"</strong> para criar setores antes de continuar.
        </AlertDescription>
      </Alert>
    )}
    
    <div className="space-y-2">
      <Label htmlFor="sector">Setor *</Label>
      {/* ... resto do codigo ... */}
```

**Mudanca 3**: Melhorar o placeholder do Select quando vazio

Atualizar o SelectTrigger para mostrar mensagem mais clara:

```typescript
<SelectValue 
  placeholder={
    sectors?.filter(s => s.is_active).length 
      ? "Selecione o setor" 
      : "Nenhum setor disponível - cadastre na aba Setores"
  } 
/>
```

---

## Fluxo Apos Correcao

1. Usuario abre `/laia/unidade/:id` e clica "Nova Avaliação"
2. Se nao ha setores cadastrados, ve alerta explicativo
3. Alerta orienta a ir para aba "Setores" para cadastrar
4. Usuario cria setor e volta para criar avaliacao normalmente

---

## Resultado Esperado

| Cenario | Antes | Depois |
|---------|-------|--------|
| Sem setores cadastrados | Dropdown vazio, sem explicacao | Alerta claro com instrucoes |
| Com setores cadastrados | Funciona normalmente | Continua funcionando normalmente |
| UX geral | Usuario confuso | Orientacao clara sobre hierarquia |

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/laia/LAIAAssessmentForm.tsx` | Adicionar Alert informativo quando nao ha setores ativos |
| `src/components/laia/LAIAAssessmentForm.tsx` | Melhorar placeholder do dropdown de setores |
