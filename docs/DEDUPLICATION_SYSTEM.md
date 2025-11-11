# Sistema de Deduplicação Configurável

## 🎯 Visão Geral

O sistema de deduplicação configurável do Daton permite que você defina regras personalizadas para evitar registros duplicados no banco de dados durante o processamento automático de documentos.

**Novidade:** Sistema com **normalização automática** de dados para aumentar a taxa de detecção de duplicatas!

## 🔧 Como Funciona

### Fluxo de Deduplicação

```
┌─────────────────────────────────────────────────────────┐
│  Documento Processado                                    │
│  Dados extraídos pela IA                                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  intelligent-data-processor                              │
│  Prepara operação de inserção                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  Buscar Regras de            │
        │  Deduplicação                │
        │  (por tabela + company_id)   │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │  🔄 NORMALIZAÇÃO AUTOMÁTICA          │
        │                                       │
        │  Para cada campo único:               │
        │  • Trim (remover espaços)            │
        │  • Lowercase (minúsculas)            │
        │  • Remove acentos                     │
        │  • Normaliza espaços múltiplos       │
        │  • Remove caracteres especiais*      │
        └──────────┬────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │  Para cada regra (por        │
        │  ordem de prioridade):       │
        │                              │
        │  1. Verificar campos únicos  │
        │     (já normalizados)        │
        │  2. Buscar registro          │
        │     existente                │
        └──────────┬───────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
      ▼                         ▼
┌───────────┐          ┌────────────────┐
│ Duplicata │          │ Não duplicado  │
│ Encontrada│          │                │
└─────┬─────┘          └────────┬───────┘
      │                         │
      │                         ▼
      │               ┌──────────────────┐
      │               │ INSERT normal    │
      │               └──────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│ Aplicar Estratégia de Mesclagem:        │
│                                          │
│ • skip_if_exists → Pular inserção       │
│ • update_existing → Atualizar existente │
│ • merge_fields → Mesclar campos         │
└──────────────────────────────────────────┘
```

## 📊 Estrutura da Tabela

### `deduplication_rules`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `company_id` | UUID | Empresa dona da regra |
| `target_table` | TEXT | Tabela alvo (ex: `emission_sources`) |
| `rule_name` | TEXT | Nome descritivo da regra |
| `unique_fields` | JSONB | Array de campos que devem ser únicos |
| `merge_strategy` | TEXT | Estratégia ao encontrar duplicata |
| `enabled` | BOOLEAN | Se a regra está ativa |
| `priority` | INTEGER | Ordem de aplicação (menor = maior prioridade) |
| `normalization_options` | JSONB | Opções de normalização de texto |
| `created_by_user_id` | UUID | Usuário que criou |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Última atualização |

## 🔄 Normalização Automática de Dados

### O que é Normalização?

A normalização transforma dados em um formato padronizado antes de comparar para detectar duplicatas. Isso **aumenta significativamente** a taxa de detecção.

### Opções Disponíveis

| Opção | Descrição | Exemplo |
|-------|-----------|---------|
| **Trim** | Remove espaços extras no início e fim | `"  João  "` → `"João"` |
| **Lowercase** | Converte para minúsculas | `"JOÃO"` → `"joão"` |
| **Remove Accents** | Remove acentuação | `"José"` → `"Jose"` |
| **Normalize Whitespace** | Converte múltiplos espaços em um | `"São  Paulo"` → `"São Paulo"` |
| **Remove Special Chars** | Remove pontuação e símbolos | `"123.456.789-00"` → `"12345678900"` |

### Exemplos Práticos

#### 1. Nome de Pessoa

**Sem normalização:**
- `"João Silva"` ≠ `"joão silva"` ≠ `"  João Silva  "` → **3 registros duplicados!**

**Com normalização (trim + lowercase + remove_accents):**
- Todos se tornam: `"joao silva"` → **1 registro único** ✅

#### 2. CPF/CNPJ

**Sem normalização:**
- `"123.456.789-00"` ≠ `"12345678900"` → **2 registros!**

**Com normalização (remove_special_chars):**
- Ambos se tornam: `"12345678900"` → **1 registro único** ✅

#### 3. Razão Social

**Dados recebidos:**
```
"  EMPRESA  XYZ   LTDA  "
"Empresa Xyz Ltda"
"empresa xyz ltda"
```

**Após normalização completa:**
Todos se tornam: `"empresa xyz ltda"` → **Detectados como duplicatas** ✅

### Configuração na Interface

Ao criar/editar uma regra, você verá checkboxes para cada opção:

```
✅ Remover espaços extras (trim)
✅ Converter para minúsculas  
✅ Remover acentos (João → Joao)
✅ Normalizar espaços múltiplos
⬜ Remover caracteres especiais
```

### Impacto na Performance

A normalização é aplicada:
- ✅ **No momento da comparação** (não modifica dados armazenados)
- ✅ **Automaticamente** para todos os campos únicos definidos
- ✅ **Cache-friendly** (normalização acontece em memória)

**Não há impacto negativo** na performance, apenas benefícios na detecção!

### Casos de Uso por Tipo de Campo

| Tipo de Campo | Opções Recomendadas | Motivo |
|---------------|---------------------|--------|
| **Nome de pessoa** | trim + lowercase + remove_accents | Variações comuns |
| **Email** | trim + lowercase | Emails são case-insensitive |
| **CPF/CNPJ** | remove_special_chars | Formatos com/sem máscara |
| **Razão social** | trim + lowercase + remove_accents + normalize_whitespace | Múltiplas variações |
| **Número de licença** | trim + uppercase | Geralmente tem padrão fixo |
| **Códigos** | trim + remove_special_chars | Remove formatação |

### Função SQL de Normalização

O sistema também oferece uma função SQL para normalização:

```sql
-- Uso básico (opções padrão)
SELECT normalize_text('  João da Silva  ');
-- Retorna: 'joao da silva'

-- Uso com opções customizadas
SELECT normalize_text(
  'María José', 
  '{"lowercase": false, "remove_accents": true}'::jsonb
);
-- Retorna: 'Maria Jose'
```

Esta função pode ser usada em:
- Queries manuais
- Triggers
- Outras funções do banco

### Exemplos Completos

#### Regra para Funcionários (CPF)

```typescript
{
  rule_name: "Funcionário por CPF",
  target_table: "employees",
  unique_fields: ["cpf"],
  merge_strategy: "update_existing",
  normalization_options: {
    trim: true,
    lowercase: false,
    remove_accents: false,
    remove_special_chars: true,  // 123.456.789-00 → 12345678900
    normalize_whitespace: false
  }
}
```

**Resultado:** CPF com ou sem máscara será detectado como duplicata!

#### Regra para Fornecedores (CNPJ + Razão Social)

```typescript
{
  rule_name: "Fornecedor por CNPJ",
  target_table: "suppliers",
  unique_fields: ["cnpj", "supplier_name"],
  merge_strategy: "merge_fields",
  normalization_options: {
    trim: true,
    lowercase: true,
    remove_accents: true,
    remove_special_chars: true,
    normalize_whitespace: true
  }
}
```

**Detecta como duplicata:**
- "12.345.678/0001-00 | EMPRESA XYZ LTDA"
- "12345678000100 | empresa xyz ltda"
- "  12.345.678/0001-00  |  Empresa  Xyz  Ltda  "

---

*Restante da documentação permanece igual...*

---

**Última atualização:** 2025-01-11  
**Versão:** 2.0 (Com Normalização Automática)
