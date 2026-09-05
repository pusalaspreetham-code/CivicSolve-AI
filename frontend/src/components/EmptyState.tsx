import { Inbox } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

const EmptyState = ({ title, description, icon, action }: Props) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-4 card">
    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
      {icon || <Inbox size={22} />}
    </div>
    <h3 className="text-slate-800 font-medium">{title}</h3>
    {description && <p className="text-slate-500 text-sm mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
