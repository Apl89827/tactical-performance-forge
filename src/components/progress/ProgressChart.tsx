import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, ReferenceLine,
} from "recharts";

interface ProgressChartProps {
  data: any[];
  dataKey: string;
  xKey?: string;
  color?: string;
  gradient?: boolean;
  lowerIsBetter?: boolean;
  formatValue?: (value: number) => string;
  targetValue?: number;
  targetLabel?: string;
}
const ProgressChart = ({ data, dataKey, xKey = "date", color = "hsl(var(--primary))", gradient = true, lowerIsBetter = false, formatValue, targetValue, targetLabel }: ProgressChartProps) => {
  if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data available</div>;
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const value = payload[0].value;
      return <div className="bg-card border border-border rounded-lg px-3 py-2"><p className="text-sm font-medium">{formatValue ? formatValue(value) : value}</p>{targetValue !== undefined && <p className="text-xs text-muted-foreground mt-0.5">Target: {formatValue ? formatValue(targetValue) : targetValue}</p>}</div>;
    }
    return null;
  };
  const values = data.map((d) => d[dataKey]).filter(Boolean);
  const allValues = targetValue !== undefined ? [...values, targetValue] : values;
  const minVal = Math.min(...allValues), maxVal = Math.max(...allValues);
  const pad = (maxVal - minVal) * 0.2 || 5;
  const domain = [minVal - pad, maxVal + pad];
  const targetLineColor = "#F59E0B";
  const sharedProps = { data, margin: { top: 8, right: 8, left: 0, bottom: 0 } };
  const refLine = targetValue !== undefined ? <ReferenceLine y={targetValue} stroke={targetLineColor} strokeDasharray="4 3" strokeWidth={1.5} label={{ value: targetLabel || "Target", position: "insideTopRight", fontSize: 9, fill: targetLineColor, fontWeight: 500 }} /> : null;
  const showTicks = data.length <= 5;
  if (gradient) return <ResponsiveContainer width="100%" height={160}><AreaChart {...sharedProps}><defs><linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.3} /><stop offset="95%" stopColor={color} stopOpacity={0} /></linearGradient></defs><XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={showTicks ? { fontSize: 10, fill: "hsl(var(--muted-foreground))" } : false} /><YAxis hide domain={domain} reversed={lowerIsBetter} /><Tooltip content={<CustomTooltip />} />{refLine}<Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#gradient-${dataKey})`} /></AreaChart></ResponsiveContainer>;
  return <ResponsiveContainer width="100%" height={160}><LineChart {...sharedProps}><XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={showTicks ? { fontSize: 10, fill: "hsl(var(--muted-foreground))" } : false} /><YAxis hide domain={domain} /><Tooltip content={<CustomTooltip />} />{refLine}<Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color, strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer>;
};
export default ProgressChart;
