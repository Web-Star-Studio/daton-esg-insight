# Cálculo de Emissões de GEE Totais (tCO₂e)

## Definição

Total de emissões diretas (Escopo 1), indiretas de energia (Escopo 2) e outras emissões indiretas (Escopo 3), conforme metodologia GHG Protocol.

## Fórmula

**Total (tCO₂e) = Escopo 1 + Escopo 2 + Escopo 3**

Onde:
- **Escopo 1**: Emissões diretas de fontes próprias e controladas
- **Escopo 2**: Emissões indiretas de energia elétrica e térmica adquirida
- **Escopo 3**: Outras emissões indiretas da cadeia de valor

## Categorias

### Escopo 1
1. Combustão estacionária (caldeiras, geradores)
2. Combustão móvel (frota de veículos)
3. Emissões fugitivas (refrigeração, ar condicionado)
4. Processos industriais
5. Agricultura

### Escopo 2
1. Eletricidade adquirida (abordagem baseada em localização)
2. Vapor, aquecimento e refrigeração adquiridos

### Escopo 3 (GHG Protocol - 15 Categorias)
1. Bens e serviços adquiridos
2. Bens de capital
3. Combustíveis e energia (não incluídos em 1 e 2)
4. Transporte e distribuição upstream
5. Resíduos gerados
6. Viagens de negócios
7. Deslocamento de funcionários
8. Ativos arrendados (upstream)
9. Transporte e distribuição downstream
10. Processamento de produtos vendidos
11. Uso de produtos vendidos
12. Tratamento de fim de vida de produtos
13. Ativos arrendados (downstream)
14. Franquias
15. Investimentos

## Emissões Biogênicas

Emissões de CO₂ provenientes de materiais de origem biológica (etanol, biodiesel, biomassa) são reportadas **separadamente** do total de Escopo 1, 2 e 3, conforme orientação do GHG Protocol.

## Fontes de Dados

- Inventário GEE da organização
- Relatórios de atividades por escopo
- Fatores de emissão IPCC/GHG Protocol Brasil
- Planilhas de consumo (combustíveis, energia, materiais)

## Selos GHG Protocol Brasileiro

- **Selo Ouro**: Escopo 1 + Escopo 2 + ao menos 2 categorias relevantes de Escopo 3
- **Selo Prata**: Escopo 1 + Escopo 2
- **Selo Bronze**: Escopo 1

## Compliance GRI

- **GRI 305-1**: Emissões diretas de GEE (Escopo 1)
- **GRI 305-2**: Emissões indiretas de GEE (Escopo 2)
- **GRI 305-3**: Outras emissões indiretas de GEE (Escopo 3)
- **GRI 305-4**: Intensidade de emissões de GEE

---

## Metas de Redução de GEE

### Definição
Percentual de redução de emissões em relação ao ano base, demonstrando o compromisso da organização com metas climáticas.

### Fórmula
```
Redução (%) = (Emissões Ano Base - Emissões Ano Atual) / Emissões Ano Base × 100
```

### Fontes de Dados
- Inventário GEE com ano base definido
- Inventário GEE do ano atual
- Tabela `ghg_inventory_summary`

### Avaliação de Progresso
A meta é considerada "No Caminho Certo" quando:
- Redução atual ≥ 90% da redução esperada para o período
- Taxa de redução anual real ≥ Taxa de redução anual necessária

### Exemplo de Cálculo

**Cenário:**
- **Ano Base (2020)**: 10.500 tCO₂e
- **Ano Atual (2024)**: 8.400 tCO₂e
- **Meta**: 30% de redução até 2030

**Cálculo:**
```
Redução Atual = (10.500 - 8.400) / 10.500 × 100 = 20%
Redução Anual Média = 20% / 4 anos = 5%/ano
Redução Necessária = 30% / 10 anos = 3%/ano

Status: ✅ NO CAMINHO CERTO (5% > 3%)
```

### Compliance
- **GRI 305-5**: Redução de emissões de GEE
- **SBTi**: Science Based Targets (quando aplicável)
- **CDP Climate Change**: Questões C4.1, C4.3

### Integração no Sistema

O sistema calcula automaticamente a redução de GEE ao:
1. Gerar inventários anuais (função `generateInventorySummary`)
2. Atualizar metas existentes com progresso real (função `updateGHGGoalProgress`)
3. Avaliar status da meta (função `evaluateGHGReductionGoal`)
4. Criar alertas quando metas não estiverem sendo cumpridas

### Criação de Metas

Para criar uma meta de redução de GEE:
1. Utilize o componente `CreateGHGReductionGoalDialog`
2. Defina o ano base, ano meta e percentual de redução alvo
3. O sistema calculará automaticamente a trajetória necessária
4. As atualizações de progresso serão feitas automaticamente ao gerar inventários
