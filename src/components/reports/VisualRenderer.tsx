import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VisualRendererProps {
  visual: {
    type: 'bar_chart' | 'pie_chart' | 'line_chart' | 'table' | 'matrix';
    title: string;
    data: any[];
    config: any;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function VisualRenderer({ visual }: VisualRendererProps) {
  const renderChart = () => {
    switch (visual.type) {
      case 'bar_chart':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={visual.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={visual.config.xAxisKey || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={visual.config.dataKey || 'value'} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie_chart':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={visual.data}
                dataKey={visual.config.dataKey || 'value'}
                nameKey={visual.config.nameKey || 'name'}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {visual.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line_chart':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={visual.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={visual.config.xAxisKey || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={visual.config.dataKey || 'value'}
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'table':
        return (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {visual.config.columns?.map((col: string) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visual.data.map((row, idx) => (
                  <TableRow key={idx}>
                    {visual.config.columns?.map((col: string) => (
                      <TableCell key={col}>{row[col]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      default:
        return (
          <div className="p-4 border rounded-lg text-center text-muted-foreground">
            Visual type "{visual.type}" not supported yet
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{visual.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
