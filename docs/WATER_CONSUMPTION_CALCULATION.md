# Cálculo de Consumo Total de Água (m³/ano)

## Definição

Volume total de água captada de todas as fontes (rede pública, poços, rios, reuso). 
Indicador essencial para gerenciar recursos hídricos e identificar riscos em áreas de escassez.

## Fórmula

**Consumo Total (m³) = ∑(Água de todas as fontes)**

Onde as fontes incluem:
- Rede pública (concessionárias)
- Poços artesianos e cacimbas
- Rios, lagos e reservatórios
- Água de chuva
- Água de reuso/reciclada
- Caminhão pipa e outras

## Compliance GRI 303

### GRI 303-3: Retirada de Água
Total de água retirada de todas as fontes, com breakdown por:
- **Fonte**: superficial, subterrânea, terceiros, água do mar, água produzida
- **Qualidade**: água doce (≤1.000 mg/L TDS) vs. outras águas
- **Áreas com estresse hídrico**: volume retirado de regiões com escassez hídrica

### GRI 303-4: Descarte de Água
Total de água descartada/devolvida, com breakdown por:
- Destino: superfície, subterrâneo, terceiros, água do mar
- Nível de tratamento

### GRI 303-5: Consumo de Água
**Consumo = Retirada - Descarte**

Representa a água que não retorna à fonte (evaporação, incorporação em produtos, etc.)

## Fontes de Dados

1. **Contas de abastecimento**: Faturas de concessionárias (SABESP, CORSAN, etc.)
2. **Hidrômetros**: Leituras de medidores instalados
3. **Relatórios de poço artesiano**: Registros de captação de poços próprios
4. **Medidores de vazão**: Para captação de rios/lagos
5. **Registros internos**: Planilhas de produção e manutenção
6. **Sistema de gestão hídrica**: Software de monitoramento (se aplicável)

## Áreas com Estresse Hídrico

Identificação de áreas com escassez hídrica usando ferramentas como:
- **WRI Aqueduct**: Ferramenta do World Resources Institute
- **WWF Water Risk Filter**: Análise de risco hídrico
- **Resolução ANA**: Áreas críticas definidas pela Agência Nacional de Águas

## Exemplo de Cálculo

### Cenário: Indústria Alimentícia - 2024

| Fonte | Volume (m³) | % do Total |
|-------|-------------|------------|
| Rede Pública | 8.500 | 56,7% |
| Poço Artesiano | 4.200 | 28,0% |
| Água de Reuso | 1.800 | 12,0% |
| Água de Chuva | 500 | 3,3% |
| **TOTAL RETIRADO** | **15.000** | **100%** |

Água Devolvida (Tratada): 3.000 m³  
**Consumo Real (GRI 303-5)**: 15.000 - 3.000 = **12.000 m³**

### Análise:
- Taxa de reuso: 12% (excelente para indústria)
- Captação de chuva: 3,3% (oportunidade de aumento)
- Devolução: 20% (bom para processos industriais)
- Estresse hídrico: 0 m³ (região não está em área crítica)

## Intensidade Hídrica (m³/unidade produzida)

### Definição
Relação entre o **consumo total de água** e a produção física ou de serviço. 
Mede a eficiência no uso da água por unidade de output.

### Fórmula

**Intensidade Hídrica = Consumo Total de Água (m³) / Unidades Produzidas**

⚠️ **IMPORTANTE**: Usar **CONSUMO** (GRI 303-5), não **RETIRADA** (GRI 303-3).

- **Consumo (GRI 303-5)**: Água que não retorna à fonte = Retirada - Devolução
- **Retirada (GRI 303-3)**: Água captada total (usado apenas para referência)

### Exemplo de Cálculo

**Cenário: Fábrica de Alimentos - 2024**

| Métrica | Valor |
|---------|-------|
| Água Retirada (GRI 303-3) | 15.000 m³ |
| Água Devolvida (GRI 303-4) | 3.000 m³ |
| **Água Consumida (GRI 303-5)** | **12.000 m³** ← Usar este! |
| Produção | 5.000 toneladas |

**Cálculo**:
```
Intensidade Hídrica = 12.000 m³ / 5.000 ton = 2,4 m³/ton
```

### Fontes de Dados / Evidências
1. Dados de consumo de água (tabela `water_consumption_data`)
2. Dados de produção (tabela `operational_metrics`)
3. Dados de receita (para intensidade por receita)
4. Contas de abastecimento e hidrômetros
5. Registros internos de produção

### Interpretação
- **Quanto MENOR**, melhor a eficiência
- Comparar com ano anterior para medir melhoria
- Benchmark setorial para avaliar competitividade
- Identificar oportunidades de otimização de processos

### Benchmarks Setoriais (Consumo)
- **Alimentos e Bebidas**: 2-5 m³/ton produto
- **Têxtil**: 80-150 m³/ton tecido
- **Papel e Celulose**: 20-50 m³/ton papel
- **Metalurgia**: 5-15 m³/ton metal
- **Química**: 10-30 m³/ton produto

### Exemplo de Evolução

| Ano | Consumo (m³) | Produção (ton) | Intensidade (m³/ton) | Melhoria |
|-----|--------------|----------------|----------------------|----------|
| 2023 | 15.000 | 5.000 | 3,00 | Baseline |
| 2024 | 12.000 | 5.000 | 2,40 | **-20%** ✅ |

### Compliance GRI
- **GRI 303-5**: Consumo de água (base do cálculo)
- **CDP Water Security**: W1.2b (Intensidade de uso de água)
- **ISO 14046**: Pegada hídrica por produto

## Metas e Benchmarks

### Benchmarks Setoriais (m³/unidade):
- **Alimentos e Bebidas**: 2-5 m³/ton produto
- **Têxtil**: 80-150 m³/ton tecido
- **Papel e Celulose**: 20-50 m³/ton papel
- **Metalurgia**: 5-15 m³/ton metal
- **Química**: 10-30 m³/ton produto

### Metas Comuns:
- Redução de 10-30% em 5 anos
- Aumento de reuso para >20%
- Zero captação em áreas com estresse hídrico
- Certificação Alliance for Water Stewardship (AWS)

## Ações de Conservação

1. **Redução de Consumo**:
   - Otimização de processos
   - Substituição de equipamentos
   - Conscientização de colaboradores

2. **Reuso e Reciclagem**:
   - Tratamento de efluentes para reuso
   - Circuito fechado em processos industriais
   - Reaproveitamento de condensados

3. **Captação Alternativa**:
   - Sistemas de captação de água de chuva
   - Aproveitamento de água de ar condicionado
   - Dessalinização (quando aplicável)

4. **Monitoramento**:
   - IoT e sensores em tempo real
   - Detecção de vazamentos
   - Auditoria hídrica periódica

## Percentual de Água Reutilizada (Economia Circular)

### Definição
Proporção de água reutilizada no total consumido. Indicador crítico para economia circular e redução de dependência de fontes externas. Promove práticas de conservação e uso eficiente dos recursos hídricos.

### Fórmula

**Reuso (%) = (Volume de Água Reutilizada / Consumo Total de Água) × 100**

⚠️ **IMPORTANTE**: O cálculo usa **CONSUMO** (GRI 303-5), não **RETIRADA** (GRI 303-3).

### Exemplo de Cálculo

**Cenário: Indústria Química - 2024**

| Métrica | Valor |
|---------|-------|
| Água Retirada (GRI 303-3) | 15.000 m³ |
| Água Devolvida (GRI 303-4) | 3.000 m³ |
| **Água Consumida (GRI 303-5)** | **12.000 m³** ← Usar este! |
| Água de Reuso | 2.400 m³ |

**Cálculo**:
```
Reuso (%) = (2.400 / 12.000) × 100 = 20%
```

### Fontes de Dados / Evidências
1. Registros de reuso (tabela `water_consumption_data` com source_type = 'Água de Reuso/Reciclada')
2. Dados de consumo total de água
3. Sistemas de tratamento de efluentes (ETE)
4. Medidores de vazão em circuitos de reuso
5. Planilhas de controle operacional
6. Relatórios de gestão hídrica

### Tipos de Reuso
1. **Reuso Industrial**: Água tratada reutilizada em processos produtivos
   - Lavagem de equipamentos
   - Circuitos de resfriamento
   - Processos auxiliares

2. **Reuso em Resfriamento**: Torres de resfriamento com circuito fechado
   - Sistemas de climatização
   - Resfriamento de máquinas

3. **Reuso em Irrigação**: Efluentes tratados para jardins e paisagismo
   - Áreas verdes
   - Gramados
   - Cultivo interno

4. **Reuso Sanitário**: Água de chuva ou efluente tratado para descargas
   - Vasos sanitários
   - Limpeza de áreas externas
   - Lavagem de pisos

5. **Reuso em Construção**: Água de chuva para atividades de obra
   - Preparo de concreto
   - Limpeza de ferramentas
   - Umidificação de terreno

### Benchmarks Setoriais

| Setor | Percentual de Reuso | Observações |
|-------|---------------------|-------------|
| **Papel e Celulose** | 60-85% | Circuitos fechados em polpação |
| **Mineração** | 70-90% | Lavagem de minério com recirculação |
| **Indústria Química** | 20-35% | Alta complexidade de processos |
| **Têxtil** | 15-30% | Tingimento e lavagem |
| **Alimentos e Bebidas** | 10-20% | Restrições sanitárias rigorosas |
| **Metalurgia** | 25-40% | Circuitos de resfriamento |
| **Automotiva** | 30-50% | Lavagem de peças e pintura |

### Classificação de Desempenho

- **🟢 Excelente**: ≥30% (práticas avançadas de circularidade)
- **🟡 Bom**: 15-30% (gestão hídrica adequada)
- **🟠 Regular**: 10-15% (oportunidades de melhoria)
- **🔴 Baixo**: <10% (necessário plano de ação)

### Interpretação
- **Quanto MAIOR**, melhor a circularidade hídrica
- Comparar com ano anterior para medir melhoria
- Benchmark setorial para avaliar competitividade
- Identificar oportunidades de aumento de reuso

### Exemplo de Evolução

| Ano | Reuso (m³) | Consumo (m³) | Reuso (%) | Melhoria |
|-----|------------|--------------|-----------|----------|
| 2023 | 1.500 | 15.000 | 10,0% | Baseline |
| 2024 | 2.400 | 12.000 | 20,0% | **+10,0pp** ✅ |

### Ações para Aumentar Reuso

1. **Tratamento de Efluentes**:
   - Instalar ETE (Estação de Tratamento de Efluentes)
   - Implementar sistemas de filtração e osmose reversa
   - Monitorar qualidade da água tratada

2. **Circuitos Fechados**:
   - Recirculação em processos industriais
   - Torres de resfriamento com tratamento
   - Sistemas de lavagem com reuso

3. **Captação de Água de Chuva**:
   - Cisternas e reservatórios
   - Uso em processos não potáveis
   - Irrigação e sanitários

4. **Segregação de Efluentes**:
   - Separar efluentes por tipo
   - Tratamento específico para cada uso
   - Reduzir contaminação cruzada

5. **Monitoramento e Controle**:
   - Medidores de vazão em pontos estratégicos
   - Dashboard em tempo real
   - Análise de qualidade da água

### Compliance e Reporting

- **GRI 303-3**: Retirada de água (incluindo reuso)
- **GRI 303-5**: Consumo de água (base do cálculo)
- **CDP Water Security**: W1.2h (Water reuse)
- **Alliance for Water Stewardship (AWS)**: Standard 3.5
- **ISO 14046**: Pegada hídrica (considera reuso)
- **CEO Water Mandate**: Compromisso de gestão sustentável

### Certificações Relacionadas
- **AWS Standard**: Certification for water stewardship
- **ISO 14001**: Sistema de Gestão Ambiental
- **LEED**: Créditos para reuso de água
- **AQUA-HQE**: Alta Qualidade Ambiental

## Compliance e Reporting Geral

- **GRI 303**: Água e Efluentes
- **CDP Water Security**: Questionário sobre segurança hídrica
- **CEO Water Mandate**: Compromisso de gestão sustentável
- **ISO 14046**: Pegada hídrica
- **Alliance for Water Stewardship (AWS)**: Certificação de gestão hídrica

## Riscos Hídricos

### Riscos Físicos:
- Escassez hídrica na região
- Seca prolongada
- Contaminação de fontes

### Riscos Regulatórios:
- Restrições de captação
- Aumento de tarifas
- Exigências de outorga

### Riscos Reputacionais:
- Uso excessivo em áreas críticas
- Conflitos com comunidades
- Pressão de investidores (ESG)
