

# Remover feature de extração com IA do sistema de documentos

## Escopo da remoção

A feature de extração IA está espalhada em vários pontos. A remoção envolve:

### 1. Remover a aba "Aprovações" (Extrações) do DocumentosHub
- Remover import de `ExtracoesDocumentos`, `getPendingExtractions`, `Brain` icon
- Remover contagem de pendências (`pendingCount`)
- Remover TabsTrigger e TabsContent de "extracoes"
- Alterar grid de 4 para 3 colunas

### 2. Remover referências de extração em `documentCenter.ts`
- Remover `latest_extraction` do tipo `DocumentRecord`
- Remover função `getLatestExtractions()` (linhas 461-514)
- Remover chamada a `getLatestExtractions` nos `Promise.all` das funções `listDocuments` e `getDocumentRecord`
- Remover parâmetro `extractionMap` do `buildDocumentRecord`

### 3. Remover seção de extração IA da página de detalhes (`SGQDocumentDetail.tsx`)
- Remover card/seção que exibe `document.latest_extraction`
- Remover ícones relacionados (Brain, Sparkles)

### 4. Remover processamento IA do upload (`DocumentUploadModal.tsx`)
- Remover import e chamada de `processDocumentWithAI`
- Remover uso de `useAutoAIProcessing`

### 5. Remover processamento IA do SGQ upload (`SGQIsoDocumentsTab.tsx`)
- Remover import e chamada de `processDocumentWithAI`

### 6. Remover rota/redirect de extrações (`App.tsx`)
- Remover import de `ExtracoesDocumentos`
- Remover redirect `/extracoes-documentos`

### 7. Remover atalho de teclado (`GlobalKeyboardShortcuts.tsx`)
- Remover case 'e' que navega para `/extracoes-documentos`

### 8. Remover página e componentes dedicados (arquivos inteiros)
- `src/pages/ExtracoesDocumentos.tsx`
- `src/components/DocumentExtractionApproval.tsx`
- `src/components/AIExtractionDashboard.tsx`
- `src/components/ExtractedDataReviewCard.tsx`
- `src/components/AIProcessingStatusWidget.tsx`
- `src/components/ai/AIExtractionStats.tsx`
- `src/components/intelligence/ExtractedDataManager.tsx`
- `src/components/intelligence/DocumentAIAnalysis.tsx`

### 9. Remover hooks dedicados
- `src/hooks/useExtractionRealtime.ts`
- `src/hooks/useAutoAIProcessing.ts`
- `src/hooks/useAIHealth.ts`
- `src/hooks/useDataReconciliation.ts`
- `src/hooks/useDocumentProcessing.ts`

### 10. Remover serviços dedicados
- `src/services/documentAI.ts`
- `src/services/extractionApprovalLog.ts`

### 11. Remover mocks de extração (`reportsMocks.ts`)
- Remover entradas de `ai-health`, `ai-extraction-stats`, `extraction-previews`

### 12. Atualizar textos/FAQs
- Remover FAQs sobre extração IA em `src/data/faqs.ts`
- Atualizar descrição do hub em `DocumentosHub.tsx`

## Arquivos modificados (edições)
| Arquivo | Alteração |
|---------|-----------|
| `src/pages/DocumentosHub.tsx` | Remover aba Aprovações, pendingCount, imports |
| `src/services/documentCenter.ts` | Remover `getLatestExtractions`, `latest_extraction` do tipo e builds |
| `src/pages/SGQDocumentDetail.tsx` | Remover seção de extração |
| `src/components/DocumentUploadModal.tsx` | Remover processamento IA |
| `src/components/document-control/SGQIsoDocumentsTab.tsx` | Remover processamento IA |
| `src/App.tsx` | Remover import e redirect |
| `src/components/GlobalKeyboardShortcuts.tsx` | Remover atalho 'e' |
| `src/data/demo/reportsMocks.ts` | Remover mocks de extração |

## Arquivos deletados
~10 arquivos entre páginas, componentes, hooks e serviços dedicados à extração.

