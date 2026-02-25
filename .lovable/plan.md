

# Importação de Cargos via CSV/XLSX

## Objetivo

Adicionar funcionalidade de importação em massa de cargos na página `/descricao-cargos`, com:
- Upload de arquivo CSV ou XLSX
- Modelo de importação disponível para download
- Preview dos dados antes de importar
- Validação e feedback de erros/sucessos
- Criação automática de departamentos inexistentes

## Colunas do modelo de importação

Baseado na tabela `positions`:

```text
Título (obrigatório) | Descrição | Departamento | Nível | Salário Mínimo | Salário Máximo | Escolaridade Exigida | Experiência (anos) | Requisitos (separados por ;) | Responsabilidades (separadas por ;)
```

## Arquivos a criar/modificar

### 1. `src/services/positionImport.ts` (novo)

Serviço de importação com:
- **`generatePositionTemplate()`**: Gera um arquivo XLSX com cabeçalhos e 2 linhas de exemplo para download
- **`parsePositionFile(file)`**: Lê CSV/XLSX, detecta cabeçalhos, retorna array de `ParsedPosition`
- **`validateParsedPositions(rows, existingPositions)`**: Valida cada linha (título obrigatório, nível válido, valores numéricos, duplicatas)
- **`importPositions(rows)`**: Insere no banco, criando departamentos inexistentes automaticamente. Retorna resultado com contagem de sucesso/erros

Lógica:
- Detecção automática de cabeçalhos (busca por "título" ou "title" nas primeiras linhas)
- Requisitos e responsabilidades separados por `;` em uma única célula
- Departamento buscado por nome — se não existir, cria automaticamente
- Nível validado contra lista: Trainee, Junior, Pleno, Senior, Gerente, Diretor
- Escolaridade validada contra lista existente

### 2. `src/components/positions/PositionImportModal.tsx` (novo)

Modal com wizard de 3 etapas:

**Etapa 1 — Upload**: Área de drag-and-drop ou seleção de arquivo + botão "Baixar Modelo"

**Etapa 2 — Preview/Validação**: Tabela com os dados parseados, indicando erros por linha (ex: título vazio, nível inválido). Contagem de válidos/inválidos.

**Etapa 3 — Resultado**: Resumo da importação (X importados, Y erros, departamentos criados automaticamente)

### 3. `src/pages/DescricaoCargos.tsx` (modificar)

Adicionar botão "Importar" ao lado do "Novo Cargo" no header, que abre o `PositionImportModal`. Após importação bem-sucedida, recarrega a lista de cargos.

## Detalhes técnicos

- Usa `XLSX` (já instalado) para ler CSV e XLSX e gerar template
- Usa `createPosition` do `organizationalStructure.ts` para inserir (respeita RLS e `company_id`)
- Usa `getDepartments`/`createDepartment` para reconciliar departamentos por nome
- Validação client-side antes do envio — sem necessidade de edge function
- Template gerado como XLSX com `XLSX.writeFile`

## Modelo de template (exemplo)

| Título | Descrição | Departamento | Nível | Salário Mínimo | Salário Máximo | Escolaridade Exigida | Experiência (anos) | Requisitos | Responsabilidades |
|--------|-----------|--------------|-------|----------------|----------------|---------------------|---------------------|------------|-------------------|
| Analista de RH | Responsável por processos seletivos | Recursos Humanos | Pleno | 4000 | 6000 | Ensino Superior Completo | 3 | Conhecimento em R&S; Excel avançado | Conduzir entrevistas; Elaborar relatórios |
| Engenheiro Ambiental | Gestão de licenças ambientais | Meio Ambiente | Senior | 8000 | 12000 | Pós-Graduação | 5 | CREA ativo; Gestão de resíduos | Elaborar PGRS; Acompanhar licenciamentos |

