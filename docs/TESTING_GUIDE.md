# Document Processing Testing Guide

## Overview

This guide provides comprehensive testing procedures for the document processing pipeline to ensure reliability, accuracy, and performance.

---

## 🎯 End-to-End Test Flows

### Test Flow 1: PDF Document Processing

**Objective:** Verify complete pipeline for PDF documents with text content.

**Steps:**
1. Upload a PDF document (e.g., emissions report)
2. Trigger AI processing
3. Monitor pipeline execution
4. Verify extraction results
5. Confirm data insertion

**Expected Results:**
- ✅ All 5 pipeline steps complete successfully
- ✅ `parsedContent.length > 0` in Step 1
- ✅ `entities_found > 0` in Step 2
- ✅ `unclassified_data_id` created in Step 3
- ✅ Data inserted or queued for review in Step 5
- ⏱️ Total duration < 20 seconds

**Log Verification Checklist:**
```
✓ "📄 Step 1: Parsing document..."
✓ "✅ Document parsed successfully"
✓ "🧠 Step 2: Classifying content..."
✓ "✅ Classification complete"
✓ "📊 Step 3: Extracting structured data..."
✓ "✅ Created extraction job: [job_id]"
✓ "💾 Step 5: Inserting data..."
✓ "✅ Pipeline completed in [X]ms"
```

---

### Test Flow 2: Excel/CSV Spreadsheet

**Objective:** Test structured data extraction from spreadsheets.

**Steps:**
1. Upload Excel file with emissions data
2. Process with AI
3. Verify entity extraction
4. Confirm field mappings
5. Check deduplication

**Expected Results:**
- ✅ Multi-sheet detection (if applicable)
- ✅ Column headers identified correctly
- ✅ Numeric values extracted with units
- ✅ Target table mappings suggested
- ✅ Deduplication rules applied

**Sample Data Check:**
```typescript
// Verify extracted entities
expect(classification.extracted_entities).toHaveLength(greaterThan(0));
expect(classification.target_mappings[0].table_name).toBe('emission_sources');
expect(classification.target_mappings[0].confidence).toBeGreaterThan(0.7);
```

---

### Test Flow 3: Image with OCR

**Objective:** Test vision-enabled document processing.

**Steps:**
1. Upload image document (JPG/PNG)
2. Enable vision processing (`useVision: true`)
3. Verify OCR text extraction
4. Check entity recognition

**Expected Results:**
- ✅ `useVision` flag detected in logs
- ✅ Text extracted from image via Gemini Vision
- ✅ Entities identified from extracted text
- ⏱️ Processing time < 30 seconds

**Known Limitations:**
- Complex tables in images may have lower accuracy
- Handwritten text detection varies by quality
- Non-English text may require language specification

---

### Test Flow 4: Empty/Invalid Document

**Objective:** Verify graceful handling of problematic documents.

**Steps:**
1. Upload empty PDF or corrupted file
2. Process with AI
3. Verify fallback mechanisms
4. Check error logging

**Expected Results:**
- ✅ Pipeline completes without crashing
- ⚠️ Fallback classification applied
- ✅ Document marked as `requires_review`
- ✅ Error details logged for debugging

**Fallback Behavior:**
```typescript
{
  status: 'requires_review',
  reason: 'Conteúdo vazio ou não pôde ser extraído',
  classification: {
    document_type: 'Documento Não Classificado',
    esg_relevance_score: 0
  }
}
```

---

## 🔍 Log Verification Procedures

### Parse Step (Step 1)

**Success Indicators:**
```
📄 Step 1: Parsing document...
📁 Using normalized path for parsing: [normalized_path]
✅ File found in documents
📈 Parsing Excel with multi-sheet support...
✅ Document parsed successfully
```

**Failure Indicators:**
```
❌ Error parsing document: [error_message]
⚠️ Parse failed, attempting graceful fallback
```

**Metrics to Check:**
- `parseResult.parsedContent.length` should be > 0
- `duration_ms` should be < 5000ms for most documents

---

### Classification Step (Step 2)

**Success Indicators:**
```
🧠 Step 2: Classifying content...
🏢 Company context built: { company: "X", sources: Y }
🤖 Calling Gemini 2.5 Pro for classification...
✅ Classification complete: { type: "X", relevance: Y, entities: Z }
```

**Failure Indicators:**
```
⚠️ Classification failed, using fallback classification
```

**Metrics to Check:**
- `classification.esg_relevance_score` should be 0-100
- `classification.extracted_entities.length` should be > 0 for valid docs
- `classification.target_mappings.length` should be > 0

---

### Extraction Step (Step 3)

**Success Indicators:**
```
📊 Step 3: Extracting structured data...
✅ Using pre-parsed content, skipping file download
📝 Creating extraction job and preview records...
✅ Created extraction job: [job_id]
✅ Created [N] preview records
```

**Failure Indicators:**
```
⚠️ Extraction failed, saving for manual review
❌ Failed to create extraction job: [error]
```

**Metrics to Check:**
- `extractResult.unclassified_data_id` exists
- `preview_count` matches `target_mappings.length`

---

### Validation Step (Step 4)

**Success Indicators:**
```
✅ Step 4: Validating extracted data...
```

**Metrics to Check:**
- `validation.overall_confidence` should be 0.0-1.0
- `validation.quality_score` should be 0-100
- `validation.requires_review` should be `false` for high confidence

---

### Insertion Step (Step 5)

**Success Indicators (Auto-Insert):**
```
💾 Step 5: Inserting data or queueing for review...
🚀 Auto-inserting with high confidence...
✅ [N] records inserted successfully
```

**Success Indicators (Manual Review):**
```
👁️ Queueing for manual review...
Status: requires_review
Reason: Confiança abaixo do limiar
```

**Failure Indicators:**
```
❌ Auto-insert failed: [error]
⚠️ Deduplication detected: [N] duplicates skipped
```

---

## 📊 Performance Benchmarks

### Expected Processing Times

| Document Type | Size | Expected Duration | Max Acceptable |
|---------------|------|-------------------|----------------|
| PDF (text) | < 1MB | 5-10s | 20s |
| Excel | < 500KB | 3-8s | 15s |
| Image (OCR) | < 2MB | 10-20s | 30s |
| Large PDF | > 5MB | 15-30s | 60s |

### Performance Degradation Checklist

If processing is slower than expected:
1. ✅ Check if re-parsing is occurring (should skip with `skip_parse: true`)
2. ✅ Verify network latency to AI services
3. ✅ Check for large file sizes (> 5MB)
4. ✅ Review concurrent processing load

---

## 🐛 Common Issues and Solutions

### Issue 1: `filePath` / `fileType` Undefined

**Symptoms:**
```
❌ Error parsing document: filePath e fileType são obrigatórios
```

**Root Cause:** Incorrect parameter naming (snake_case vs camelCase)

**Solution:**
```typescript
// ❌ WRONG
body: { file_path: '...', file_type: '...' }

// ✅ CORRECT
body: { filePath: '...', fileType: '...' }
```

---

### Issue 2: Re-parsing Documents

**Symptoms:**
- Processing takes 2x expected time
- Logs show duplicate "Parsing document..." messages

**Root Cause:** Pipeline not passing `parsed_content` to Step 3

**Solution:**
Verify `intelligent-pipeline-orchestrator` passes:
```typescript
{
  document_id,
  mode: 'exploratory',
  parsed_content: parseResult.parsedContent,
  skip_parse: true
}
```

---

### Issue 3: Zero Entities Extracted

**Symptoms:**
- `entities_found: 0` despite document having data

**Root Cause:** 
- Empty `parsedContent` in Step 1
- Document content not in expected format

**Solution:**
1. Verify `parseResult.parsedContent.length > 0`
2. Check file is not corrupted/encrypted
3. Try converting to plain PDF format

---

### Issue 4: Deduplication Not Working

**Symptoms:**
- Duplicate records inserted despite rules configured

**Root Cause:**
- Normalization options not applied
- Unique fields not matching

**Solution:**
1. Enable normalization: `trim`, `lowercase`, `remove_accents`
2. Review unique fields configuration
3. Test with `normalize_text()` SQL function

---

## 🧪 Automated Test Suite

### Unit Tests

```typescript
// tests/document-processing.test.ts
describe('Document Processing Pipeline', () => {
  test('should parse PDF successfully', async () => {
    const result = await supabase.functions.invoke('parse-chat-document', {
      body: {
        filePath: 'test.pdf',
        fileType: 'application/pdf'
      }
    });
    
    expect(result.data.success).toBe(true);
    expect(result.data.parsedContent).toBeDefined();
    expect(result.data.parsedContent.length).toBeGreaterThan(0);
  });

  test('should handle invalid file gracefully', async () => {
    const result = await supabase.functions.invoke('parse-chat-document', {
      body: {
        filePath: 'nonexistent.pdf',
        fileType: 'application/pdf'
      }
    });
    
    expect(result.data.success).toBe(false);
    expect(result.data.error).toBeDefined();
  });
});
```

---

## 📈 Success Metrics

### Target KPIs

- **Success Rate:** > 95% of documents processed without errors
- **Auto-Insert Rate:** > 70% of high-quality documents auto-inserted
- **Average Processing Time:** < 15 seconds
- **User Intervention Rate:** < 20% requiring manual review

### Monitoring Dashboard

Track these metrics in production:
1. Documents processed per day
2. Pipeline step failure rates
3. Average confidence scores
4. Deduplication effectiveness
5. User approval rates

---

## 🔄 Regression Testing

Before deploying changes:
1. ✅ Run full test suite (all flows)
2. ✅ Verify logs format unchanged
3. ✅ Test with 10+ real-world documents
4. ✅ Check backward compatibility
5. ✅ Monitor error rates in staging

---

## 📚 Related Documentation

- [Edge Functions API](./EDGE_FUNCTIONS_API.md)
- [Deduplication System](./DEDUPLICATION_SYSTEM.md)
- [Troubleshooting Guide](https://docs.lovable.dev/tips-tricks/troubleshooting)
