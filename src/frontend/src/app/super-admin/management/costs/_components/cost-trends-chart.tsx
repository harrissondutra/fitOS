'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendData } from '../_hooks/use-costs';

interface CostTrendsChartProps {
  data: TrendData[];
  height?: number;
}

export function CostTrendsChart({ data, height = 300 }: CostTrendsChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: '2-digit' 
    });
  };

  // Preparar dados para o gráfico
  const chartData = data.map(item => ({
    ...item,
    date: formatDate(item.date),
    total: item.totalCost,
  }));

  // Cores para as categorias
  const categoryColors = [
    '#8B5CF6', // Purple
    '#10B981', // Green
    '#3B82F6', // Blue
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#06B6D4', // Cyan
  ];

  // Extrair categorias únicas
  const categories = Array.from(
    new Set(
      data.flatMap(item => Object.keys(item.categories))
    )
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Custos</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'total' ? 'Total' : name
                ]}
                labelFormatter={(label) => `Período: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Legend />
              
              {/* Linha do total */}
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8884d8"
                strokeWidth={3}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              
              {/* Linhas das categorias */}
              {categories.map((category, index) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={`categories.${category}`}
                  stroke={categoryColors[index % categoryColors.length]}
                  strokeWidth={2}
                  dot={{ fill: categoryColors[index % categoryColors.length], strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                  name={category}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

