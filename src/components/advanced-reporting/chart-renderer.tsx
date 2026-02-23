import { type ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { getColorFromValue } from "./helpers"
import { type ReportChart } from "./types"

export const renderReportChart = (chart: ReportChart): ReactNode => {
  switch (chart.type) {
    case "line":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="environmental"
              stroke="#10b981"
              strokeWidth={2}
            />
            <Line type="monotone" dataKey="social" stroke="#3b82f6" strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="governance"
              stroke="#f59e0b"
              strokeWidth={2}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      )

    case "pie":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={chart.data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}%`}
            >
              {chart.data.map((entry) => (
                <Cell
                  key={String(entry.name ?? entry.label ?? entry.id ?? entry.value)}
                  fill={
                    typeof entry.color === "string"
                      ? entry.color
                      : getColorFromValue(
                          String(
                            entry.name ??
                              entry.label ??
                              entry.id ??
                              entry.value ??
                              "default"
                          )
                        )
                  }
                />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      )

    case "bar":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="users" fill="#10b981" />
            <Bar dataKey="pageViews" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      )

    default:
      return <div>Unsupported chart type</div>
  }
}
