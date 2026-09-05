import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: string;
}

const StatCard = ({ label, value, icon: Icon, accent = "text-brand-600 bg-brand-50" }: Props) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${accent}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </div>
);

export default StatCard;
