#!/usr/bin/env python3
"""Extrai todos os `<Route path="...">` declarados em src/App.tsx e gera
src/constants/declaredRoutes.ts.

Uso: python3 scripts/extract-routes.py

Por que: a tab "Rotas mortas" do PlatformAdmin compara as rotas declaradas
contra `route_pattern` visto em `page_view_logs` para apontar rotas que
nunca receberam acesso — candidatas a remoção. A lista canônica precisa
estar em sincronia com o App.tsx; este script garante isso sem
manutenção manual.

Roda em ~50ms, não tem deps externas. Idealmente: rodar antes de cada
release ou via pre-commit hook.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP_TSX = ROOT / "src" / "App.tsx"
OUT = ROOT / "src" / "constants" / "declaredRoutes.ts"

src = APP_TSX.read_text()
matches = re.findall(r'<Route\s+[^>]*path="([^"]+)"', src)
# Normaliza nomes de parâmetros (`:branchId`, `:sectorId`, `:slug` etc.)
# para `:id` — bate com a heurística de routePattern aplicada no front e no
# get-usage-summary, que substitui qualquer segmento dinâmico por `:id`.
def normalize(p: str) -> str:
    return re.sub(r":[A-Za-z_][A-Za-z0-9_]*", ":id", p)

# Filtra rotas relativas (paths em `<Route>` aninhadas que não começam com
# `/`) e o catch-all `*`. Só rotas absolutas têm correspondência direta com
# o pathname do browser e o que cai em page_view_logs.
routes = sorted(
    set(normalize(m) for m in matches if m.startswith("/"))
)

header = '''// Lista canônica das rotas declaradas em App.tsx.
// Gerada automaticamente — sempre que adicionar/remover <Route> no App.tsx,
// regenerar via:
//
//   python3 scripts/extract-routes.py
//
// Usada pela tab "Rotas mortas" em UsageAnalyticsTab pra comparar contra
// route_pattern visto em page_view_logs e identificar rotas que nunca
// receberam acesso (candidatas a remoção).

export const DECLARED_ROUTES: readonly string[] = [
'''
body = "".join(f'  "{r}",\n' for r in routes)
footer = "] as const;\n"

OUT.write_text(header + body + footer)
print(f"wrote {OUT.relative_to(ROOT)} ({len(routes)} routes)")
