# Total de Resíduos Gerados (t/ano)

## Definição

Total de resíduos sólidos, líquidos e perigosos gerados pela organização. Serve como base para estratégias de redução e destinação sustentável, seguindo os princípios da economia circular.

## Fórmula

**Total (t) = ∑(Resíduos sólidos + líquidos + perigosos)**

Onde:
- Resíduos são classificados por classe (NBR 10004):
  - **Classe I (Perigosos)**: Inflamáveis, corrosivos, reativos, tóxicos, patogênicos
  - **Classe II A (Não Inertes)**: Biodegradáveis, combustíveis, solúveis em água
  - **Classe II B (Inertes)**: Não solubilizam em água, não decomponíveis

## Compliance GRI 306

### GRI 306-3: Resíduos Gerados

Total de resíduos gerados durante o período de reporte, com breakdown por:
- **Composição**: Perigosos vs. não perigosos
- **Método de disposição**: Reciclagem, aterro, incineração, compostagem

### GRI 306-4: Resíduos Não Destinados para Disposição Final

Inclui resíduos que são:
- **Reciclados**: Transformados em novos produtos
- **Reutilizados**: Usados novamente sem transformação
- **Compostados**: Decompostos aerobicamente para fertilizante
- **Outros**: Recuperação energética, rerrefino, etc.

### GRI 306-5: Resíduos Destinados para Disposição Final

Inclui resíduos que são:
- **Aterro sanitário**: Disposição em solo controlado
- **Incineração sem recuperação**: Queima sem aproveitamento energético
- **Outras formas de disposição**: Co-processamento, etc.

## Fontes de Dados

1. **MTRs (Manifestos de Transporte de Resíduos)**
   - Documento oficial de rastreamento de resíduos
   - Contém: tipo de resíduo, classe, quantidade, destinação final

2. **Notas fiscais de destinação**
   - Comprovante de serviços de coleta e destinação
   - Valores para cálculo de custos de gestão

3. **Relatórios de coleta seletiva**
   - Volumes de recicláveis segregados
   - Taxas de recuperação

4. **Pesagens no ponto de coleta**
   - Balanças para resíduos sólidos
   - Medição volumétrica para líquidos

5. **Sistema de gestão de resíduos (tabela `waste_logs`)**
   - Registro digitalizado de todas as operações
   - Integração com MTRs e destinadores

## Conversão de Unidades

O sistema converte automaticamente diferentes unidades para **toneladas (t)**:

| Unidade Original | Conversão para Toneladas | Observações |
|------------------|---------------------------|-------------|
| **kg** (quilograma) | ÷ 1.000 | Resíduos sólidos |
| **Litros** (L) | ÷ 1.000 | Densidade ≈ 1 kg/L (líquidos) |
| **m³** (metros cúbicos) | × 1 | Densidade média 1 ton/m³ |
| **ton, t** (toneladas) | × 1 | Já em toneladas |

**Função de conversão**:
```typescript
function convertToTonnes(quantity: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'kg': return quantity / 1000;
    case 'ton': case 't': return quantity;
    case 'litros': case 'l': return quantity / 1000;
    case 'm³': return quantity * 1;
    default: return quantity; // Assume toneladas
  }
}
```

## Exemplo de Cálculo

### Cenário: Indústria de Alimentos - 2024

| Tipo de Resíduo | Classe | Quantidade | Unidade | Destinação | Toneladas |
|-----------------|--------|------------|---------|------------|-----------|
| Papelão | II B | 15.000 | kg | Reciclagem | 15,0 t |
| Resíduos Orgânicos | II A | 30 | ton | Compostagem | 30,0 t |
| Óleos e Graxas Usados | I | 2.000 | litros | Rerrefino | 2,0 t |
| Plásticos | II B | 8 | ton | Reciclagem | 8,0 t |
| Rejeitos Gerais | II A | 5.000 | kg | Aterro | 5,0 t |

**Cálculo**:
```
Total Gerado = 15 + 30 + 2 + 8 + 5 = 60 toneladas

Breakdown por Classe:
- Perigosos (Classe I) = 2 toneladas (3,3%)
- Não Perigosos (Classe II) = 58 toneladas (96,7%)

Breakdown por Destinação:
- Reciclagem = 23 toneladas (38,3%)
- Compostagem = 30 toneladas (50,0%)
- Rerrefino = 2 toneladas (3,3%)
- Aterro = 5 toneladas (8,3%)

Taxa de Reciclagem Total = (23 + 30 + 2) / 60 = 91,7%
Taxa de Disposição Final (Aterro) = 5 / 60 = 8,3%
```

**Análise de Performance**:
- ✅ **Excelente** taxa de reciclagem (>70%)
- ✅ Baixo percentual de resíduos perigosos (<5%)
- ✅ Baixa taxa de aterro (<10%)
- ✅ Forte uso de compostagem para orgânicos

## Indicadores de Desempenho

### Taxa de Reciclagem (GRI 306-4)

Percentual de resíduos não destinados para disposição final:

- **🟢 Excelente**: ≥70% (práticas avançadas de economia circular)
- **🟡 Bom**: 50-70% (gestão de resíduos sólida)
- **🟠 Regular**: 30-50% (oportunidades de melhoria)
- **🔴 Baixo**: <30% (necessário programa de melhoria urgente)

### Resíduos Perigosos (GRI 306-3)

Percentual de resíduos perigosos sobre o total:

- **🟢 Baixo**: <5% do total (gestão adequada)
- **🟡 Moderado**: 5-10% (monitoramento necessário)
- **🔴 Alto**: >10% (requer plano de redução)

### Taxa de Aterro (GRI 306-5)

Percentual de resíduos destinados para aterro:

- **🟢 Excelente**: <10% (próximo a Zero Waste)
- **🟡 Bom**: 10-30% (dentro de benchmarks)
- **🟠 Regular**: 30-50% (necessário aumentar reciclagem)
- **🔴 Alto**: >50% (impacto ambiental significativo)

## Benchmarks Setoriais

### Geração Específica (kg resíduo/tonelada produto)

| Setor | Faixa Típica | Observações |
|-------|--------------|-------------|
| **Alimentos e Bebidas** | 50-150 kg/ton | Resíduos orgânicos predominantes |
| **Metalurgia** | 200-400 kg/ton | Sucatas e escórias |
| **Química e Petroquímica** | 100-300 kg/ton | Alto percentual de perigosos |
| **Têxtil** | 150-250 kg/ton | Aparas e resíduos de tingimento |
| **Construção Civil** | 500-1.000 kg/ton | Entulho e resíduos classe II |
| **Papel e Celulose** | 50-100 kg/ton | Alto reuso de fibras |
| **Eletroeletrônicos** | 200-500 kg/ton | Logística reversa obrigatória |

### Taxa de Reciclagem por Setor

| Setor | Meta Mínima | Classe Mundial |
|-------|-------------|----------------|
| **Papel e Celulose** | 60% | >85% |
| **Alimentos** | 50% | >70% |
| **Metalurgia** | 70% | >90% |
| **Construção** | 40% | >60% |
| **Química** | 30% | >50% |

## Hierarquia de Resíduos

Ordem de prioridade para gestão (do mais ao menos desejável):

1. **Não geração** (prevenção na fonte)
   - Redesign de processos
   - Substituição de materiais

2. **Redução** (minimização)
   - Otimização de processos
   - Tecnologias mais limpas

3. **Reutilização** (reuso direto)
   - Embalagens retornáveis
   - Componentes reutilizáveis

4. **Reciclagem** (recuperação de materiais)
   - Reciclagem mecânica
   - Reciclagem química

5. **Recuperação energética**
   - Coprocessamento
   - Incineração com geração de energia

6. **Disposição final** (última opção)
   - Aterro sanitário
   - Aterro de resíduos perigosos

## Estratégias de Redução

### 1. Economia Circular

**Princípios**:
- Design for Disassembly (DfD)
- Uso de materiais recicláveis/biodegradáveis
- Logística reversa
- Simbiose industrial (resíduos de uma empresa = matéria-prima de outra)

**Exemplo**: Indústria química usa resíduos de outra como insumo em processos.

### 2. Programas de Gestão de Resíduos

**ISO 14001**: Sistema de Gestão Ambiental
- Procedimentos de segregação na origem
- Treinamento contínuo de colaboradores
- Metas de redução anuais

**PGRS (Plano de Gerenciamento de Resíduos Sólidos)**:
- Obrigatório pela PNRS (Lei 12.305/2010)
- Inventário de resíduos
- Plano de ação para redução

### 3. Parcerias com Cooperativas

- Coleta seletiva estruturada
- Geração de renda para catadores
- Aumento de taxa de reciclagem
- Responsabilidade social

### 4. Certificações

**Zero Waste to Landfill**:
- ≥95% de resíduos desviados de aterro
- Certificação por terceira parte

**Cradle to Cradle**:
- Design de produtos 100% recicláveis
- Ciclos técnicos e biológicos fechados

## Intensidade de Resíduos

### Por Produção

**Fórmula**: Intensidade (t/unidade) = Total de Resíduos (t) / Volume de Produção (unidades)

**Uso**: Comparar eficiência entre períodos e unidades produtivas.

### Por Receita

**Fórmula**: Intensidade (t/R$ 1.000) = Total de Resíduos (t) / Receita Anual (R$) × 1.000

**Uso**: Normalizar comparações entre empresas de portes diferentes.

## Compliance e Reporting

### Normas Brasileiras

- **PNRS (Lei 12.305/2010)**: Política Nacional de Resíduos Sólidos
- **NBR 10004**: Classificação de resíduos
- **NBR 13221**: Transporte de resíduos
- **CONAMA 313/2002**: Inventário nacional de resíduos industriais

### Padrões Internacionais

- **GRI 306 (2020)**: Resíduos - completo
- **CDP Climate Change**: Módulo de resíduos e economia circular
- **ISO 14001**: Sistema de Gestão Ambiental
- **ISO 14046**: Pegada de Água (relacionado a resíduos líquidos)
- **SASB**: Métricas específicas por indústria

### Certificações

- **ABNT PR 2030**: Processo de Certificação de Qualidade de Aterros
- **FSC**: Resíduos de madeira e papel
- **Eureciclo**: Compensação de logística reversa

## Metas de Redução

### Definição de Meta

**Exemplo de meta SMART**:
- "Reduzir resíduos totais gerados em 15% até 2025 (baseline 2023)"
- "Aumentar taxa de reciclagem de 45% para 70% até 2026"
- "Atingir Zero Waste to Landfill (<5% aterro) até 2027"

### Monitoramento

**KPIs mensais**:
- Total de resíduos gerados (t)
- Taxa de reciclagem (%)
- Taxa de aterro (%)
- Custos de destinação (R$/t)

**Alertas automáticos**:
- Aumento de resíduos perigosos
- Queda na taxa de reciclagem
- Destinação inadequada

## Integração com Sistema

### Coleta de Dados

Tabela `waste_logs`:
- `waste_description`: Tipo de resíduo
- `waste_class`: Classe I, II A, II B
- `quantity` + `unit`: Quantidade e unidade
- `final_treatment_type`: Reciclagem, aterro, etc.
- `collection_date`: Data da coleta
- `mtr_number`: Número do MTR

### Cálculo Automático

Função `calculateTotalWasteGeneration(year)`:
1. Busca todos os registros do ano
2. Converte unidades para toneladas
3. Classifica por tipo de tratamento
4. Calcula percentuais e compara com ano anterior
5. Gera breakdown detalhado

### Dashboard Visual

Componente `WasteTotalGenerationDashboard`:
- Total gerado em destaque
- Breakdown perigosos vs. não perigosos
- Gráfico de pizza (destinação por tipo)
- Gráfico de barras (Top 10 resíduos)
- Alertas de performance
- Comparação ano anterior

## Referências

- **GRI 306**: Waste (2020)
- **GHG Protocol**: Waste Accounting and Reporting Standard
- **EPA**: Waste Reduction Model (WARM)
- **PNRS**: Lei 12.305/2010
- **NBR 10004**: Resíduos Sólidos - Classificação
- **CDP**: Climate Change Questionnaire - Waste Module
