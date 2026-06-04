import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap="25%">
          <XAxis
            dataKey="name"
            tick={{ fill: '#52525b', fontSize: 10 }}
            axisLine={{ stroke: '#27272a' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#52525b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            unit=" kWh"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#a1a1aa',
            }}
            labelStyle={{ color: '#71717a' }}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          {consumption && (
            <Legend
              wrapperStyle={{ fontSize: '10px', color: '#71717a' }}
              iconSize={6}
              iconType="square"
            />
          )}
          <Bar dataKey="production" name="Production" fill="#a1a1aa" radius={[2, 2, 0, 0]} />
          {consumption && (
            <Bar dataKey="consumption" name="Consumption" fill="#3f3f46" radius={[2, 2, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
