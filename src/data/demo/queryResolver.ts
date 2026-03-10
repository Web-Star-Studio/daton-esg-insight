interface MockEntry {
  queryKey: readonly unknown[];
  data: unknown;
}

function normalizeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => [key, normalizeValue(val)]);

    return Object.fromEntries(entries);
  }

  return value;
}

function keyToString(key: readonly unknown[]): string {
  return JSON.stringify(normalizeValue(key));
}

function prefixToString(key: readonly unknown[], length: number): string {
  return JSON.stringify(normalizeValue(key.slice(0, length)));
}

function buildFallbackRow(index: number, keyLabel: string) {
  return {
    id: `demo-${keyLabel}-${index + 1}`,
    name: `${keyLabel} ${index + 1}`,
    title: `${keyLabel} ${index + 1}`,
    status: ["Ativo", "Em Andamento", "Concluído"][index % 3],
    value: 65 + index * 7,
    score: 72 + index * 4,
    count: 8 + index * 3,
    created_at: new Date(Date.now() - index * 86400000).toISOString(),
  };
}

function buildSeriesData() {
  return [
    { month: "Set", value: 72, rate: 71.5, total: 44 },
    { month: "Out", value: 76, rate: 75.2, total: 48 },
    { month: "Nov", value: 79, rate: 78.1, total: 52 },
    { month: "Dez", value: 82, rate: 81.7, total: 57 },
    { month: "Jan", value: 84, rate: 84.0, total: 59 },
    { month: "Fev", value: 87, rate: 86.5, total: 63 },
  ];
}

const LIST_LIKE_KEYWORDS = [
  "suppliers",
  "stakeholders",
  "responsibles",
  "requirements",
  "processes",
  "reviews",
  "evidences",
  "documents",
  "document-center",
  "deliveries",
  "failures",
  "workflows",
  "forms",
  "categories",
  "types",
  "users",
  "employees",
  "goals",
  "tasks",
  "reports",
  "assets",
  "items",
  "list",
  "alerts",
  "notifications",
  "activities",
  "predictions",
  "insights",
  "messages",
  "events",
  "logs",
  "legislations",
  "legislation-themes",
  "legislation-subthemes",
  "themes",
  "subthemes",
  "units",
  "business-units",
  "payable",
  "receivable",
  "wastes",
  "mailing",
  "branches",
  "indicators",
  "sgq-documents",
  "targets",
  "period",
  "versions",
  "campaigns",
  "recipients",
  "contacts",
  "pending",
];

function buildFallbackData(queryKey: readonly unknown[]): unknown {
  const tokens = queryKey
    .filter((segment): segment is string => typeof segment === "string")
    .map((segment) => segment.toLowerCase());

  const firstToken = tokens[0] ?? "dataset";
  const keyLabel = firstToken.replace(/[^a-z0-9]+/g, "-");

  if (
    tokens.some((token) =>
      ["trend", "evolution", "history", "comparison", "series"].some((word) =>
        token.includes(word),
      ),
    )
  ) {
    return buildSeriesData();
  }

  if (
    tokens.some((token) =>
      ["stats", "dashboard", "metrics", "summary", "health", "score", "kpi"].some((word) =>
        token.includes(word),
      ),
    )
  ) {
    return {
      total: 54,
      pending: 8,
      approved: 39,
      rejected: 7,
      active: 47,
      complianceRate: 84.6,
      averageScore: 81.3,
      completionRate: 79.2,
      responseRate: 77.8,
      trend: 4.7,
      trainings: { total: 26, completed: 20, rate: 76.9 },
      readings: { total: 31, confirmed: 25, rate: 80.6 },
      surveys: { total: 18, responded: 14, rate: 77.8 },
    };
  }

  if (
    tokens.some((token) =>
      LIST_LIKE_KEYWORDS.some((word) => token.includes(word)),
    )
  ) {
    return [
      buildFallbackRow(0, keyLabel),
      buildFallbackRow(1, keyLabel),
      buildFallbackRow(2, keyLabel),
    ];
  }

  return {
    id: `demo-${keyLabel}`,
    label: keyLabel,
    value: 82,
    status: "Ativo",
    updated_at: new Date().toISOString(),
    items: [buildFallbackRow(0, keyLabel), buildFallbackRow(1, keyLabel)],
  };
}

export function createDemoQueryResolver(mockEntries: MockEntry[]) {
  const exactMap = new Map<string, unknown>();
  const prefixMap = new Map<string, unknown>();

  mockEntries.forEach(({ queryKey, data }) => {
    exactMap.set(keyToString(queryKey), data);

    for (let i = 1; i <= queryKey.length; i += 1) {
      const prefix = prefixToString(queryKey, i);
      if (!prefixMap.has(prefix)) {
        prefixMap.set(prefix, data);
      }
    }
  });

  return (queryKey: readonly unknown[]) => {
    const exact = exactMap.get(keyToString(queryKey));
    if (exact !== undefined) {
      return exact;
    }

    for (let i = queryKey.length; i >= 1; i -= 1) {
      const prefix = prefixToString(queryKey, i);
      const prefixData = prefixMap.get(prefix);
      if (prefixData !== undefined) {
        return prefixData;
      }
    }

    return buildFallbackData(queryKey);
  };
}
