import { TrendingUp, TrendingDown } from "lucide-react";
import { ReactNode } from "react";
interface StatCardProps { title: string; value: string | number; subtitle?: string; change?: number; lowerIsBetter?: boolean; icon?: ReactNode; children?: ReactNode; }
const StatCard = ({ title, value, subtitle, change, lowerIsBetter = false, icon, children }: StatCardProps) => {
  const getChangeDisplay = () => {
    if (change === undefined || change === 0) return null;
    const isPositive = lowerIsBetter ? change < 0 : change > 0;
    const absChange = Math.abs(change);
    return ( <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}> {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />} <span>{absChange.toFixed(1)}%</span> </div> );
  };
  return ( <div className="bg-card rounded-xl border border-border p-4"> <div className="flex items-center justify-between mb-2"> <div className="flex items-center gap-2"> {icon} <h3 className="font-medium">{title}</h3> </div> {getChangeDisplay()} </div> <div className="mb-3"> <div className="text-2xl font-bold">{value}</div> {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>} </div> {children && <div>{children}</div>} </div> );
};
export default StatCard;
