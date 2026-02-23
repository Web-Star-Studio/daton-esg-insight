import { type PriorityLevel } from "./types"

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4"
]

export const getColorFromValue = (value: string | number): string => {
  const normalizedValue = String(value)
  let hash = 0

  for (let index = 0; index < normalizedValue.length; index += 1) {
    hash = (hash * 31 + normalizedValue.charCodeAt(index)) >>> 0
  }

  return COLORS[hash % COLORS.length]
}

export const getPriorityBadgeVariant = (
  priority: PriorityLevel
): "secondary" | "default" | "destructive" => {
  if (priority === "high") {
    return "destructive"
  }

  if (priority === "medium") {
    return "default"
  }

  return "secondary"
}

export const getMetricChangeColorClass = (change: number): string => {
  if (change > 0) {
    return "text-green-500"
  }

  if (change < 0) {
    return "text-red-500"
  }

  return "text-muted-foreground"
}
