# Sistema de Processamento de Documentos Daton

## 🎯 Visão Geral

O sistema de processamento de documentos do Daton foi refatorado para usar uma **arquitetura unificada** que garante consistência, rastreabilidade e processamento inteligente de todos os tipos de documentos.

## 📊 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    UPLOAD UNIFICADO                          │
│              src/services/documents.ts                       │
│                 uploadDocument()                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Supabase Storage            │
        │  Bucket: documents           │
        │  Path: timestamp-random.ext  │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  Table: documents            │
        │  - id (UUID)                 │
        │  - company_id                │
        │  - file_path                 │
        │  - file_name                 │
        │  - file_type                 │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────────┐
        │  intelligent-pipeline-orchestrator        │
        │  Recebe: { document_id, options }        │
        └──────────────┬────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────────┐    ┌──────────────────────┐
│ parse-chat-doc    │    │ smart-content-       │
│ Extrai conteúdo   │───▶│ analyzer             │
│ OCR se necessário │    │ Classifica documento │
└───────────────────┘    └──────────┬───────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ universal-document-processor  │
                    │ Extrai campos estruturados    │
                    └───────────┬───────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
        ┌──────────────────┐    ┌──────────────────────┐
        │ High Confidence  │    │ Low Confidence       │
        │ Auto-insert via  │    │ Manual Review via    │
        │ intelligent-data-│    │ extracted_data_      │
        │ processor        │    │ preview              │
        └──────────────────┘    └──────────────────────┘
```

## 🔧 Componentes Principais

### 1. Upload Unificado (`uploadDocument`)

**Localização:** `src/services/documents.ts`

**Características:**
- ✅ Upload para bucket `documents`
- ✅ Criação automática de registro em `documents` table
- ✅ Validação de tipo e tamanho
- ✅ Suporte a auto-processamento opcional
- ✅ Sanitização de nomes de arquivo
- ✅ Tratamento de erros robusto

**Uso:**
```typescript
import { uploadDocument } from '@/services/documents';

const doc = await uploadDocument(file, {
  skipAutoProcessing: true, // Desabilita processamento automático
  folder_id: 'uuid',
  tags: ['emissoes', 'escopo-1'],
  related_model: 'emission_source',
  related_id: 'source-uuid'
});
```

### 2. Pipeline Inteligente

**Edge Function:** `intelligent-pipeline-orchestrator`

**Entrada:**
```typescript
{
  document_id: string,  // ⚠️ SEMPRE use document_id, NÃO file_id/file_path
  options: {
    auto_insert: boolean,           // Se deve inserir automaticamente
    generate_insights: boolean,     // Se deve gerar insights
    auto_insert_threshold: number   // Limiar de confiança (0-1)
  }
}
```

**Saída:**
```typescript
{
  classification: {
    document_type: string,
    confidence: number
  },
  extraction: {
    entities_count: number,
    fields: Record<string, any>
  },
  inserted_count: number,
  insights: Array<any>
}
```

### 3. Tratamento de Erros

**Erros de Rate Limit (429):**
```typescript
if (error.message?.includes('429')) {
  toast.error('Limite de taxa atingido. Aguarde alguns instantes.');
}
```

**Erros de Créditos (402):**
```typescript
if (error.message?.includes('402')) {
  toast.error('Créditos de IA esgotados. Adicione créditos em Configurações → Workspace → Uso.');
}
```

### 4. Notificações em Tempo Real

**Hook:** `useDocumentProcessingNotifications`

**Integração no App.tsx:**
```typescript
const AppContent = () => {
  useDocumentProcessingNotifications();
  return <>{/* rotas */}</>;
};
```

**Notifica sobre:**
- ✅ Jobs de extração concluídos/erro
- ✅ Novos dados para revisão manual
- ✅ Invalidação de cache React Query

## 📝 Tipos de Arquivo Suportados

| Tipo | Extensões | Processamento | Limites |
|------|-----------|---------------|---------|
| **PDF** | .pdf | ✅ Texto + OCR | 20MB |
| **Excel** | .xlsx, .xls | ✅ Múltiplas abas | 20MB |
| **CSV** | .csv | ✅ Auto-detect encoding | 20MB |
| **Imagens** | .jpg, .png, .webp | ✅ OCR via Gemini Vision | 20MB |
| **JSON** | .json | ✅ Estrutura preservada | 20MB |
| **XML** | .xml | ✅ Parse nativo | 20MB |
| **Word** | .docx, .doc | ⚠️ Recomenda-se converter para PDF | 20MB |
| **PowerPoint** | .pptx | ⚠️ Suporte limitado | 20MB |

### ⚠️ Importante: Arquivos Word

Arquivos Word (.doc/.docx) têm suporte limitado. O sistema exibe automaticamente um aviso ao usuário:

```typescript
toast.warning('Para melhores resultados, converta o arquivo Word para PDF antes de enviar.', {
  duration: 6000
});
```

## 🔄 Fluxos de Uso

### Fluxo 1: Upload Simples

```typescript
// Em qualquer componente
import { uploadDocument } from '@/services/documents';

const handleUpload = async (file: File) => {
  try {
    const doc = await uploadDocument(file);
    console.log('Documento criado:', doc.id);
  } catch (error) {
    console.error('Erro no upload:', error);
  }
};
```

### Fluxo 2: Upload + Processamento IA

```typescript
import { uploadDocument } from '@/services/documents';
import { supabase } from '@/integrations/supabase/client';

const handleUploadAndProcess = async (file: File) => {
  // 1. Upload
  const doc = await uploadDocument(file, {
    skipAutoProcessing: true
  });

  // 2. Processar com IA
  const { data, error } = await supabase.functions.invoke(
    'intelligent-pipeline-orchestrator',
    {
      body: {
        document_id: doc.id,
        options: {
          auto_insert: true,
          generate_insights: true,
          auto_insert_threshold: 0.8
        }
      }
    }
  );

  if (error) {
    if (error.message?.includes('429')) {
      toast.error('Limite de taxa atingido.');
    } else if (error.message?.includes('402')) {
      toast.error('Créditos esgotados.');
    }
    throw error;
  }

  return data;
};
```

### Fluxo 3: Batch Processing

```typescript
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';

function MyComponent() {
  const { processFiles, isProcessing, results } = useDocumentProcessing();

  const handleBatch = async (files: File[]) => {
    await processFiles(files, {
      autoInsert: true,
      generateInsights: true,
      onProgress: (current, total, fileName) => {
        console.log(`${current}/${total}: ${fileName}`);
      }
    });
  };

  return (
    <div>
      {isProcessing && <p>Processando...</p>}
      {results.map(r => (
        <div key={r.fileName}>
          {r.status === 'success' ? '✅' : '❌'} {r.fileName}
        </div>
      ))}
    </div>
  );
}
```

## 🔒 Segurança e RLS

### Políticas Importantes

**documents table:**
```sql
-- Usuários só veem documentos da própria empresa
CREATE POLICY "Users can view own company documents"
ON documents FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
```

**document_extraction_jobs:**
```sql
-- Jobs restritos por empresa
CREATE POLICY "Users can view own company jobs"
ON document_extraction_jobs FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
```

**extracted_data_preview:**
```sql
-- Prévias restritas por empresa
CREATE POLICY "Users can view own company previews"
ON extracted_data_preview FOR SELECT
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
```

## 🐛 Debugging

### Logs Importantes

**1. Upload:**
```typescript
console.log('📤 Uploading document:', file.name, options);
console.log('📁 Storage path:', filePath);
console.log('✅ Document uploaded successfully:', data.id);
```

**2. Pipeline:**
```typescript
console.log('🤖 Processing document:', document_id);
console.log('📊 Classification:', classification);
console.log('📝 Extracted entities:', entities_count);
```

**3. Erros:**
```typescript
console.error('❌ Upload error:', error);
console.error('❌ Processing error:', error);
```

### Edge Function Logs

Ver logs no Supabase Dashboard:
```
supabase.functions.invoke('intelligent-pipeline-orchestrator', ...)
```

Ou via CLI:
```bash
supabase functions logs intelligent-pipeline-orchestrator
```

## 📈 Métricas e Monitoramento

### Tabelas de Acompanhamento

1. **document_extraction_jobs**
   - Status do job (Pendente/Processando/Concluído/Erro)
   - Tempo de processamento
   - Campos extraídos
   - Score de confiança

2. **extracted_data_preview**
   - Dados aguardando validação
   - Status (Pendente/Aprovado/Rejeitado)
   - Campos extraídos
   - Confidence score

3. **ai_performance_metrics**
   - Documentos processados por dia
   - Taxa de auto-aprovação
   - Taxa de revisão manual

## ⚠️ Problemas Comuns

### 1. "File not found in storage"

**Causa:** Tentativa de usar `file_path` ou `file_id` em vez de `document_id`

**Solução:** Sempre use `document_id` no pipeline:
```typescript
// ❌ ERRADO
{ file_id: fileRecord.id, file_path: fileRecord.storage_path }

// ✅ CORRETO
{ document_id: uploadedDoc.id }
```

### 2. "Rate limit exceeded (429)"

**Causa:** Muitas requisições simultâneas para o AI Gateway

**Solução:**
- Adicionar delays entre processamentos
- Processar em lotes menores
- Verificar plano de créditos

### 3. "Credits exhausted (402)"

**Causa:** Créditos de IA esgotados

**Solução:**
- Ir em Configurações → Workspace → Uso
- Adicionar créditos
- Verificar consumo

### 4. "Word documents not parsing correctly"

**Causa:** Suporte limitado para .doc/.docx

**Solução:**
- Converter para PDF antes do upload
- Sistema já exibe aviso automático ao usuário

## 🔄 Migração de Código Legado

Se você encontrar código usando `documentExtractionService.uploadFile`:

```typescript
// ❌ CÓDIGO ANTIGO
import { documentExtractionService } from '@/services/documentExtraction';
const fileRecord = await documentExtractionService.uploadFile(file);

// ✅ CÓDIGO NOVO
import { uploadDocument } from '@/services/documents';
const doc = await uploadDocument(file, { skipAutoProcessing: true });
```

Se você encontrar `file_id` ou `file_path` sendo passados para edge functions:

```typescript
// ❌ CÓDIGO ANTIGO
supabase.functions.invoke('intelligent-pipeline-orchestrator', {
  body: { file_id: record.id, file_path: record.storage_path }
});

// ✅ CÓDIGO NOVO
supabase.functions.invoke('intelligent-pipeline-orchestrator', {
  body: { document_id: doc.id }
});
```

## 📚 Referências

- **Componentes atualizados:**
  - `src/components/intelligence/DocumentAIAnalysis.tsx`
  - `src/components/DocumentUploadCard.tsx`
  - `src/components/gri-wizard/DocumentUploadZone.tsx`
  - `src/hooks/useDocumentProcessing.ts`
  - `src/App.tsx`

- **Serviços:**
  - `src/services/documents.ts` (principal)
  - `src/services/documentAI.ts`
  - `src/services/documentProcessing.ts`

- **Edge Functions:**
  - `supabase/functions/intelligent-pipeline-orchestrator`
  - `supabase/functions/parse-chat-document`
  - `supabase/functions/smart-content-analyzer`
  - `supabase/functions/universal-document-processor`

---

**Última atualização:** 2025-01-11  
**Versão do sistema:** 2.0 (Arquitetura Unificada)
