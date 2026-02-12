

## Adicionar secoes detalhadas dos modulos de /ambiental na pagina /tecnologia

### Contexto

A pagina `/ambiental` (ESGAmbiental.tsx) exibe 5 cards de modulos:

| # | Modulo | Categoria |
|---|--------|-----------|
| 001 | ESG Ambiental | Meio Ambiente / Sustentabilidade |
| 002 | ESG Social | Social / Diversidade / Seguranca |
| 003 | Qualidade (SGQ) | Gestao / Controle de Processos |
| 004 | Gestao Fornecedores | Cadeia de Suprimentos |
| 005 | Inteligencia Artificial | Tecnologia / Automacao |

A pagina `/tecnologia` (Technology.tsx) atualmente tem seus proprios cards sobre aspectos tecnicos (IA, Arquitetura, Seguranca, Integracoes, Performance).

### O que sera adicionado

Uma nova secao abaixo do grid de tecnologia e acima do footer, intitulada algo como **"Modulos da Plataforma"**, contendo blocos detalhados para cada um dos 5 modulos de `/ambiental`.

Cada bloco tera:
- Numero do indice (001, 002, etc.)
- Titulo e categoria
- Descricao completa
- Lista de features
- Imagem do modulo
- Botao de CTA direcionando para `/funcionalidades`

O layout sera alternado (imagem esquerda/direita) para criar ritmo visual, seguindo o estilo Heimdall com animacoes framer-motion no scroll.

### Detalhes tecnicos

**Arquivo: `src/pages/Technology.tsx`**

1. Importar os dados MODULES de `/ambiental` como uma constante separada (`SOLUTION_MODULES`) dentro do proprio arquivo Technology.tsx, replicando os 5 modulos para evitar acoplamento entre paginas.

2. Criar um componente `SolutionDetailSection` que renderiza cada modulo em layout alternado (texto + imagem lado a lado, invertendo a cada item).

3. Inserir a nova secao entre a `PerformanceSection` e o `PublicFooter`, com:
   - Titulo da secao: "Nossas Solucoes" com subtitulo
   - 5 blocos detalhados com animacao `whileInView`
   - Estilo consistente com o resto da pagina (cores, tipografia, espacamento)

Nenhum outro arquivo precisa ser alterado.

