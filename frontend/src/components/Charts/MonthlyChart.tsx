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
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }} barCategoryGap="20%">
          <XAxis
            dataKey="name"
            tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.20)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            unit=" kWh"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.7)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.4)' }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          {consumption && (
            <Legend
              wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}
              iconSize={8}
              iconType="circle"
            />
          )}
          <Bar
            dataKey="production"
            name="Production"
            fill="#d97706"
            radius={[3, 3, 0, 0]}
            fillOpacity={0.85}
          />
          {consumption && (
            <Bar
              dataKey="consumption"
              name="Consumption"
              fill="#3b82f6"
              radius={[3, 3, 0, 0]}
              fillOpacity={0.45}
            />
          )}
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
