import React from 'react';
import { GovernmentAction } from '../../types/government';
import { CheckCircle2, AlertTriangle, Clock, Banknote, FileText } from 'lucide-react';

interface ActionTimelineProps {
  actions: GovernmentAction[];
}

export default function ActionTimeline({ actions }: ActionTimelineProps) {
  if (!actions || actions.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <p className="text-sm text-slate-500">No actions recorded yet.</p>
      </div>
    );
  }

  const getActionConfig = (type: string) => {
    switch (type) {
      case 'ACKNOWLEDGED': return { color: 'bg-blue-500', icon: FileText, label: 'Acknowledged' };
      case 'IN_PROGRESS': return { color: 'bg-amber-500', icon: Clock, label: 'In Progress' };
      case 'BUDGET_ALLOCATED': return { color: 'bg-violet-500', icon: Banknote, label: 'Budget Allocated' };
      case 'RESOLVED': return { color: 'bg-emerald-500', icon: CheckCircle2, label: 'Resolved' };
      case 'REJECTED': return { color: 'bg-red-500', icon: AlertTriangle, label: 'Rejected' };
      default: return { color: 'bg-slate-500', icon: FileText, label: type };
    }
  };

  return (
    <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-2">
      {actions.map((action) => {
        const config = getActionConfig(action.action_type);
        const Icon = config.icon;

        return (
          <div key={action.id} className="relative pl-6">
            <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ${config.color} ring-4 ring-white flex items-center justify-center`} />
            
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${config.color.replace('bg-', 'text-').replace('500', '700')} bg-opacity-10`}>
                  {config.label}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {new Date(action.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              
              <p className="text-sm text-slate-800 mb-3 whitespace-pre-wrap">{action.remarks}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-md">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                    {(action.gov_user_name || action.official_name)?.charAt(0) || 'U'}
                  </span>
                  <span>{action.gov_user_name || action.official_name} • {action.gov_user_designation || action.official_designation}</span>
                </div>
                
                {action.budget_estimate && (
                  <div className="flex items-center gap-1 text-slate-600">
                    <Banknote className="h-3.5 w-3.5" />
                    <span>₹{action.budget_estimate.toLocaleString()}</span>
                  </div>
                )}
                
                {action.timeline_days && (
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{action.timeline_days} days</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
