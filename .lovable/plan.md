
Diagnóstico (exploração feita):
1. O erro atual acontece antes do Vite iniciar:
   - `sh: .../.bin/node: cannot execute: required file not found`
2. Procurei no projeto e o comando problemático ainda está no `package.json`:
   - `dev`, `build`, `build:dev`, `preview` usam `npm exec --yes node@24 -- ./node_modules/vite/bin/vite.js`
3. Esse wrapper com `npm exec node@24` depende de um binário temporário em `/.npm/_npx/...`, e esse caminho/binário está quebrando no ambiente.
4. Do I know what the issue is? Yes. A falha é de infraestrutura de execução do script (wrapper `npm exec node@24`), não do código React/Vite.

Plano de correção (implementação):
1. Atualizar apenas `package.json` (scripts), removendo o wrapper `npm exec --yes node@24 --`.
2. Trocar para comandos diretos do Vite:
   - `dev`: `vite`
   - `build`: `vite build`
   - `build:dev`: `vite build --mode development`
   - `preview`: `vite preview`
3. Manter `.nvmrc` como fonte de versão Node (sem “baixar node” via npm exec em runtime).

Validação após ajuste:
1. Executar `npm run dev -- --port 8080` e confirmar que o comando efetivo virou `vite --port 8080`.
2. Executar `npm run build` e confirmar compilação completa.
3. Executar `npm run preview` para validar que o bundle sobe normalmente.

Fallback (se o ambiente ainda falhar):
1. Rodar instalação limpa (`rm -rf node_modules package-lock.json && npm install`) para remover resíduos de wrappers antigos.
2. Como alternativa temporária, usar scripts com `node ./node_modules/vite/bin/vite.js` (sem `npm exec node@24`), mas a opção principal continua sendo `vite` direto.
