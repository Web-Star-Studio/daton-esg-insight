# Edge Functions API Documentation

## Overview

This document provides comprehensive API documentation for all Supabase Edge Functions in the Daton system. All functions use consistent patterns for error handling, parameter validation, and response formatting.

---

## 🔧 Common Patterns

### CORS Headers
All functions support CORS with these headers:
```javascript
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": {
    "function": "function_name",
    "step": "step_where_error_occurred",
    "timestamp": "2025-11-11T23:30:00.000Z"
  }
}
```

### Parameter Formats

Functions accept both **camelCase** and **snake_case** parameters for compatibility:
- `filePath` or `file_path`
- `fileType` or `file_type`
- `documentId` or `document_id`
- `companyId` or `company_id`

---

## 📄 parse-chat-document

**Purpose:** Parses documents (PDF, Excel, CSV, images) and extracts text content.

### Request

**Method:** `POST`

**Parameters:**
```typescript
{
  filePath: string;      // Required: Path to file in storage (camelCase or snake_case)
  fileType: string;      // Required: MIME type (e.g., 'application/pdf')
  useVision?: boolean;   // Optional: Use OCR for images (default: false)
  useCache?: boolean;    // Optional: Use cached results (default: true)
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "parsedContent": "Extracted text content...",
  "metadata": {
    "pages": 5,
    "tables_detected": 2,
    "has_images": true
  }
}
```

**Error (400/500):**
```json
{
  "success": false,
  "error": "filePath e fileType são obrigatórios"
}
```

### Example Call
```typescript
const { data, error } = await supabase.functions.invoke('parse-chat-document', {
  body: {
    filePath: '1234567890-abc.pdf',
    fileType: 'application/pdf',
    useCache: true
  }
});
```

---

## 🧠 smart-content-analyzer

**Purpose:** Classifies document content and extracts ESG-relevant entities using AI.

### Request

**Method:** `POST`

**Parameters:**
```typescript
{
  content: string;       // Required: Document text content
  fileType: string;      // Required: MIME type
  fileName: string;      // Required: Original filename
  companyId: string;     // Required: Company UUID
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "classification": {
    "document_type": "Planilha de Dados",
    "document_category": "Emissões GEE",
    "esg_relevance_score": 95,
    "extracted_entities": [
      {
        "entity_type": "emission_data",
        "entity_name": "CO2 emissions",
        "value": "1500",
        "unit": "tCO2e",
        "confidence": 0.95
      }
    ],
    "target_mappings": [
      {
        "table_name": "emission_sources",
        "confidence": 0.9,
        "field_mappings": {
          "source_name": "Transporte",
          "scope": 1
        }
      }
    ],
    "data_quality_assessment": {
      "completeness_score": 85,
      "accuracy_score": 90,
      "issues": []
    }
  }
}
```

---

## 🎯 intelligent-pipeline-orchestrator

**Purpose:** Orchestrates the complete document processing pipeline (parse → classify → extract → validate → insert).

### Request

**Method:** `POST`

**Parameters:**
```typescript
{
  document_id: string;           // Required: Document UUID
  auto_insert_threshold?: number; // Optional: Confidence threshold for auto-insert (default: 0.8)
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "document_id": "uuid",
  "pipeline": [
    {
      "name": "parse",
      "status": "completed",
      "duration_ms": 1250,
      "result": { "content_length": 5432 }
    },
    {
      "name": "classify",
      "status": "completed",
      "duration_ms": 3200,
      "result": {
        "document_type": "Planilha de Dados",
        "esg_relevance": 95,
        "entities_found": 6
      }
    },
    // ... more steps
  ],
  "total_duration_ms": 15500,
  "final_status": "auto_inserted",
  "summary": {
    "document_type": "Planilha de Dados",
    "esg_relevance": 95,
    "overall_confidence": 0.92,
    "auto_inserted": true,
    "records_inserted": 3
  }
}
```

### Pipeline Steps

1. **parse** - Extract text from document
2. **classify** - Classify content and extract entities
3. **extract** - Extract structured data
4. **validate** - Validate data quality
5. **insert** - Auto-insert or queue for review

---

## 🔍 universal-document-processor

**Purpose:** Analyzes unstructured documents using AI and saves results to `unclassified_data` table.

### Request

**Method:** `POST`

**Parameters:**
```typescript
{
  document_id: string;      // Required: Document UUID
  mode?: string;            // Optional: 'exploratory' (default)
  parsed_content?: string;  // Optional: Pre-parsed content (skips parsing)
  skip_parse?: boolean;     // Optional: Skip file parsing (default: false)
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "analysis": {
    "document_category": "Emissões",
    "relevance_score": 95,
    "extracted_entities": [...],
    "potential_uses": [...],
    "recommendations": [...]
  },
  "unclassified_data_id": "uuid"
}
```

---

## 🤖 intelligent-data-processor

**Purpose:** Processes data operations (INSERT/UPDATE/DELETE) with validation and deduplication.

### Request

**Method:** `POST`

**Parameters:**
```typescript
{
  company_id: string;      // Required: Company UUID
  operations: Array<{
    table: string;         // Required: Target table name
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    data: object;          // Required: Data to process
    deduplication?: {
      check_fields: string[];
      merge_strategy: 'skip_if_exists' | 'update_existing' | 'merge_fields';
    };
    validation?: {
      required_fields: string[];
    };
  }>;
  execution_options?: {
    auto_rollback?: boolean;
    validate_before_insert?: boolean;
    create_audit_log?: boolean;
  };
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "records_inserted": 5,
  "records_updated": 2,
  "records_skipped": 1,
  "tables_affected": ["emission_sources", "activity_data"],
  "successful_operations": [...],
  "failed_operations": []
}
```

---

## 📊 Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request - Missing/invalid parameters | Check request body |
| 401 | Unauthorized - Invalid auth token | Refresh authentication |
| 404 | Not Found - Resource doesn't exist | Verify IDs |
| 500 | Internal Server Error | Check logs, retry with backoff |
| 503 | Service Unavailable - Timeout | Retry with exponential backoff |

---

## 🔐 Authentication

All functions require a valid Supabase auth token in the `Authorization` header:

```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

For service role operations (admin-only):
```
Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
```

---

## 🚀 Best Practices

### 1. Error Handling
Always check for errors before accessing data:
```typescript
const { data, error } = await supabase.functions.invoke('function-name', { ... });
if (error) {
  console.error('Function error:', error);
  return;
}
// Process data
```

### 2. Retry Logic
Implement exponential backoff for transient failures:
```typescript
import { retryOperation } from '@/utils/retryOperation';

const result = await retryOperation(
  () => supabase.functions.invoke('function-name', { body }),
  { maxRetries: 3, initialDelay: 1000 }
);
```

### 3. Timeouts
Set reasonable timeouts (default: 60s for document processing):
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 60000);

try {
  const { data } = await supabase.functions.invoke('function-name', {
    body,
    signal: controller.signal
  });
} finally {
  clearTimeout(timeout);
}
```

---

## 📝 Change Log

### 2025-11-11
- ✅ Fixed `parse-chat-document` parameter naming (camelCase)
- ✅ Added `skip_parse` support to `universal-document-processor`
- ✅ Optimized pipeline to avoid re-parsing documents
- ✅ Enhanced error handling with structured responses
- ✅ Added parameter normalization utility

---

## 🔗 Related Documentation

- [Deduplication System](./DEDUPLICATION_SYSTEM.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Troubleshooting](https://docs.lovable.dev/tips-tricks/troubleshooting)
