

# Fix: Imagem antiga do hero persistindo (cache do navegador)

## Problema
O arquivo `public/hero-img-01.png` foi substituido, mas o navegador mantem a versao antiga em cache. Como o caminho URL nao muda (`/hero-img-01.png`), o browser nao busca a nova versao.

## Solucao
Importar a imagem da floresta diretamente como modulo no `esgAreas.ts`, usando o arquivo ja copiado em `src/assets/hero-floresta.png`. O Vite gera um hash unico no nome do arquivo no build, quebrando o cache automaticamente.

### Arquivos editados

**1. `src/components/landing/heimdall/esgAreas.ts`**
- Importar `heroImg01` de `@/assets/hero-floresta.png`
- Substituir `"/hero-img-01.png"` pela variavel importada

```ts
import heroImg01 from '@/assets/hero-floresta.png';

// No objeto do slide Ambiental:
image: heroImg01,  // antes: "/hero-img-01.png"
```

### O que nao muda
- Os outros slides (hero-img-02 e hero-img-03) continuam iguais
- Nenhuma logica do HeroSection muda
- Layout, animacoes e comportamento permanecem identicos

