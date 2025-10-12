import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

interface ChartData {
  type: 'bar' | 'progress' | 'metric';
  title: string;
  data: DataPoint[] | MetricCardProps;
}

export function MetricCard({ title, value, trend, trendValue, status = 'info' }: MetricCardProps) {
  const statusColors = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    danger: 'text-red-600 bg-red-50',
    info: 'text-blue-600 bg-blue-50'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <Card className={`p-4 ${statusColors[status]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trendValue && TrendIcon && (
            <div className="flex items-center gap-1 mt-2">
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        {status === 'success' && <CheckCircle className="h-5 w-5" />}
        {status === 'warning' && <AlertTriangle className="h-5 w-5" />}
        {status === 'danger' && <AlertTriangle className="h-5 w-5" />}
      </div>
    </Card>
  );
}

export function SimpleBarChart({ data, title }: { data: DataPoint[], title: string }) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        {title}
      </h4>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">{item.value}</span>
            </div>
            <Progress 
              value={(item.value / maxValue) * 100} 
              className="h-2"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DataVisualization({ data }: { data: ChartData }) {
  if (data.type === 'metric') {
    return <MetricCard {...(data.data as MetricCardProps)} />;
  }

  if (data.type === 'bar' || data.type === 'progress') {
    return <SimpleBarChart data={data.data as DataPoint[]} title={data.title} />;
  }

  return null;
}
