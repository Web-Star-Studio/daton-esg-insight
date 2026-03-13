

# Deduplicar lista de treinamentos no "Copiar de treinamento existente"

## Problema
O dropdown "Copiar de treinamento existente" lista todos os programas de treinamento, incluindo duplicatas de nome (ex: "FORMAÇÃO DE MOTORISTA CEGONHEIRO" aparece várias vezes).

## Solução
Filtrar `existingPrograms` para mostrar apenas **um programa por nome único** (o mais recente). Isso é feito com um simples dedupe antes do `.map()`.

## Alteração

**Arquivo: `src/components/TrainingProgramModal.tsx`** (~linha 575)

Substituir a iteração direta `existingPrograms.map(...)` por uma versão deduplicada por nome:

```tsx
{(() => {
  const seen = new Set<string>();
  return existingPrograms.filter((prog) => {
    const key = prog.name.trim().toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
})().map((prog) => (
  <SelectItem key={prog.id} value={prog.id}>
    {prog.name}
  </SelectItem>
))}
```

Isso garante que cada título aparece apenas uma vez, mantendo o primeiro da lista (que já vem ordenado do banco). Uma mudança de ~5 linhas, sem impacto em nenhuma outra funcionalidade.

