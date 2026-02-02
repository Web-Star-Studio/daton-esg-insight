# Documentação de API - Daton ESG Insight

## Visão Geral

O Daton utiliza Supabase Edge Functions como backend serverless. Todas as funções são escritas em Deno/TypeScript.

## Autenticação

```
Authorization: Bearer {supabase_access_token}
```

Tokens são obtidos via Supabase Auth (email/senha ou OAuth).

## Endpoints Base

- **Supabase URL:** `https://dqlvioijqzlvnvvajmft.supabase.co`
- **Functions:** `https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/{function_name}`

---

## Padrão de Resposta

### Sucesso (200)

```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

### Erro (4xx/5xx)

```json
{
  "success": false,
  "error": "Mensagem de erro",
  "details": {
    "function": "function_name",
    "step": "validation",
    "timestamp": "2026-02-02T10:30:00Z"
  }
}
```

---

## Edge Functions Principais

### ESG Dashboard

```
POST /functions/v1/esg-dashboard
```

Retorna dados consolidados do dashboard ESG.

**Request:**
```json
{
  "company_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "environmental_score": 85,
    "social_score": 78,
    "governance_score": 92,
    "emissions_total": 1500.5,
    "goals_on_track": 12,
    "goals_at_risk": 3
  }
}
```

---

### Document Processor

```
POST /functions/v1/universal-document-processor
```

Processa e analisa documentos com IA.

**Request:**
```json
{
  "document_id": "uuid",
  "mode": "exploratory",
  "skip_parse": false
}
```

**Response (200):**
```json
{
  "success": true,
  "analysis": {
    "document_category": "Emissões",
    "relevance_score": 95,
    "extracted_entities": [...]
  }
}
```

---

### AI Chat Assistant

```
POST /functions/v1/ai-chat-assistant
```

Assistente de IA para consultas contextuais.

**Request:**
```json
{
  "message": "Qual foi o total de emissões em 2025?",
  "context_type": "emissions",
  "company_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "response": "O total de emissões em 2025 foi de 1.500 tCO2e...",
  "sources": [...]
}
```

---

### Parse Chat Document

```
POST /functions/v1/parse-chat-document
```

Parseia documentos (PDF, Excel, CSV, imagens) e extrai conteúdo.

**Request:**
```json
{
  "filePath": "path/to/file.pdf",
  "fileType": "application/pdf",
  "useVision": false,
  "useCache": true
}
```

**Response (200):**
```json
{
  "success": true,
  "parsedContent": "Texto extraído...",
  "metadata": {
    "pages": 5,
    "tables_detected": 2
  }
}
```

---

### Smart Content Analyzer

```
POST /functions/v1/smart-content-analyzer
```

Classifica documentos e extrai entidades ESG.

**Request:**
```json
{
  "content": "Conteúdo do documento...",
  "fileType": "application/pdf",
  "fileName": "relatorio-emissoes.pdf",
  "companyId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "classification": {
    "document_type": "Planilha de Dados",
    "document_category": "Emissões GEE",
    "esg_relevance_score": 95,
    "extracted_entities": [...]
  }
}
```

---

### Intelligent Pipeline Orchestrator

```
POST /functions/v1/intelligent-pipeline-orchestrator
```

Orquestra o pipeline completo de processamento de documentos.

**Request:**
```json
{
  "document_id": "uuid",
  "auto_insert_threshold": 0.8
}
```

**Response (200):**
```json
{
  "success": true,
  "document_id": "uuid",
  "pipeline": [...],
  "total_duration_ms": 15500,
  "final_status": "auto_inserted"
}
```

---

## Códigos de Erro

| Código | Significado | Ação |
|--------|-------------|------|
| 400 | Parâmetros inválidos | Verificar body da requisição |
| 401 | Não autenticado | Renovar token de acesso |
| 403 | Sem permissão | Verificar roles do usuário |
| 404 | Recurso não encontrado | Verificar IDs |
| 429 | Rate limit excedido | Aguardar e tentar novamente |
| 500 | Erro interno | Verificar logs, reportar bug |
| 503 | Serviço indisponível | Retry com backoff exponencial |

---

## Rate Limiting

- 100 requisições por minuto por IP
- 1000 requisições por hora por usuário

---

## Tabelas Principais (Database)

| Tabela | Descrição |
|--------|-----------|
| `companies` | Empresas cadastradas |
| `profiles` | Perfis de usuários |
| `employees` | Funcionários |
| `emission_sources` | Fontes de emissão GEE |
| `activity_data` | Dados de atividade (consumo) |
| `goals` | Metas ESG |
| `non_conformities` | Não conformidades |
| `suppliers` | Fornecedores |
| `licenses` | Licenças ambientais |
| `documents` | Documentos do sistema |
| `training_courses` | Cursos de treinamento |
| `audits` | Auditorias |

---

## Exemplos de Uso

### JavaScript/TypeScript

```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('esg-dashboard', {
  body: { company_id: 'uuid' }
});

if (error) {
  console.error('Erro:', error);
  return;
}

console.log('Dashboard:', data);
```

### cURL

```bash
curl -X POST \
  'https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/esg-dashboard' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"company_id": "uuid"}'
```

---

## Recursos Adicionais

- [Documentação completa de Edge Functions](./EDGE_FUNCTIONS_API.md)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Guia de Arquitetura](./architecture.md)
