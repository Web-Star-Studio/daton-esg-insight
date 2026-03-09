

## Remove "Compliance 7.5" tab from /controle-documentos

Remove the third tab (`compliance-75`) from the `ControleDocumentos` page, including its trigger, content, and the import of `DocumentComplianceOperationsTab`. Update the grid from 3 columns to 2.

**File: `src/pages/ControleDocumentos.tsx`**
- Remove import of `DocumentComplianceOperationsTab`
- Change `grid-cols-3` to `grid-cols-2` on `TabsList`
- Remove the `<TabsTrigger value="compliance-75">` element
- Remove the `<TabsContent value="compliance-75">` block

