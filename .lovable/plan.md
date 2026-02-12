

# Redesign da Pagina /auth com Design Language Heimdall

## Objetivo
Transformar a pagina de autenticacao atual (fundo branco simples com card basico) para seguir a identidade visual Heimdall usada nas paginas institucionais, mantendo toda a logica de negocio, fluxos e textos intactos.

## Mudancas Visuais Planejadas

1. **Fundo e atmosfera**: Substituir o `bg-background` por um fundo Heimdall com gradiente sutil e precision-grid (pattern de linhas finas), usando as cores `--heimdall-bg` e `--heimdall-bg-secondary`.

2. **Container principal**: Aplicar a classe `heimdall-page` ao wrapper e importar o `heimdall.css`.

3. **Card de autenticacao**: Aplicar estilo `glass-card` (glassmorphism com backdrop-blur e borda sutil) no lugar do card solido atual.

4. **Header/Logo**: Substituir o icone `Building2` pelo logo da Daton com estilo alinhado ao Heimdall -- label monospace com tracking-widest acima ("PLATAFORMA ESG") e titulo com fonte bold/grotesca.

5. **Inputs**: Estilizar com bordas sutis (`--heimdall-border`), fundo levemente translucido e foco com borda verde accent.

6. **Botao principal**: Estilizar como `heimdall-btn-primary` -- pill shape, cor verde accent (#15c470), com hover suave.

7. **Tabs (Login/Criar Conta)**: Estilizar com visual mais clean, sem background grosso, usando bordas inferiores e tipografia monospace para as labels.

8. **Links e texto secundario**: Usar cores `--heimdall-text-secondary` e `--heimdall-text-muted`.

9. **Animacoes**: Adicionar fade-up sutil via framer-motion no card ao montar.

10. **Footer links (Termos/Privacidade)**: Manter, mas com estilo muted alinhado ao Heimdall.

## Detalhes Tecnicos

### Arquivo editado
- `src/pages/Auth.tsx`

### Dependencias utilizadas (ja instaladas)
- `framer-motion` para animacao de entrada
- CSS do Heimdall (`heimdall.css`) para classes utilitarias

### O que NAO muda
- Toda a logica de login, registro, validacao de senha, CNPJ
- Todos os textos e labels existentes
- Estrutura de campos e formularios
- Rotas e navegacao
- ForgotPasswordModal e sua integracao

### Abordagem
Refatorar o JSX/classes do `Auth.tsx` diretamente, aplicando classes Heimdall e estilos inline/Tailwind para obter a estetica premium sem criar novos componentes. O card usara glassmorphism, o fundo tera o precision-grid sutil, e todo o formulario tera a tipografia e espacamento consistentes com as paginas Sobre Nos, Solucoes e Landing Page.

