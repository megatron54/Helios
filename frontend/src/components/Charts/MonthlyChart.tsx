import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { SimulationResult, ConsumptionProfile } from '../../types';

interface MonthlyChartProps {
  result: SimulationResult;
  consumption?: ConsumptionProfile;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MonthlyChart({ result, consumption }: MonthlyChartProps) {
  const data = MONTHS.map((name, i) => {
    const entry: Record<string, string | number> = {
      name,
      production: Math.round(result.getMonthly(i).energyKwh),
    };
    if (consumption) {
      entry.consumption = Math.round(consumption.monthlyKwh[i]);
    }
    return entry;
  });

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
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#a3a3a3' }}
          />
          {consumption && (
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#a3a3a3' }}
              iconSize={8}
            />
          )}
          <Bar
            dataKey="production"
            name="Production"
            fill="#d97706"
            radius={[2, 2, 0, 0]}
          />
          {consumption && (
            <Bar
              dataKey="consumption"
              name="Consumption"
              fill="#3b82f6"
              radius={[2, 2, 0, 0]}
              opacity={0.6}
            />
          )}
          <ReferenceLine y={0} stroke="#262626" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
