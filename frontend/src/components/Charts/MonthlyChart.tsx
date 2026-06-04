import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SimulationResult } from '../../types';

interface MonthlyChartProps {
  result: SimulationResult;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MonthlyChart({ result }: MonthlyChartProps) {
  const data = MONTHS.map((name, i) => ({
    name,
    kwh: Math.round(result.getMonthly(i).energyKwh),
  }));

  const maxKwh = Math.max(...data.map((d) => d.kwh));

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#737373', fontSize: 10 }}
            axisLine={{ stroke: '#262626' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#737373', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            unit=" kWh"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#171717',
              border: '1px solid #262626',
              borderRadius: '4px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#a3a3a3' }}
            formatter={(value) => [`${value} kWh`, 'Production']}
          />
          <Bar dataKey="kwh" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.kwh === maxKwh ? '#d97706' : '#525252'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
