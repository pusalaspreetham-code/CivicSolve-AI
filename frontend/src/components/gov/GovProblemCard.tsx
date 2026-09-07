import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, AlertTriangle } from 'lucide-react';

interface GovProblemCardProps {
  problem: any;
}

export default function GovProblemCard({ problem }: GovProblemCardProps) {
  const getActionBadge = (status: string) => {
    switch (status) {
      case 'ACKNOWLEDGED':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10">Acknowledged</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-700/10">In Progress</span>;
      case 'BUDGET_ALLOCATED':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-700/10">Budget Allocated</span>;
      case 'RESOLVED':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-700/10">Resolved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-700/10">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10">No Action</span>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const s = severity?.toUpperCase() || 'LOW';
    if (s === 'CRITICAL') return <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700"><AlertTriangle className="h-3 w-3" /> Critical</span>;
    if (s === 'HIGH') return <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700"><AlertTriangle className="h-3 w-3" /> High</span>;
    if (s === 'MEDIUM') return <span className="text-xs font-bold text-amber-700">Medium</span>;
    return <span className="text-xs font-bold text-emerald-700">Low</span>;
  };

  return (
    <div className="card p-5 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {problem.domain || 'Uncategorized'}
          </span>
          {getSeverityBadge(problem.severity)}
        </div>
        {getActionBadge(problem.actionStatus || problem.action_status)}
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{problem.title}</h3>
      <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-1">{problem.description}</p>

      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          <span>{problem.reportCount || problem.report_count || 1} citizens</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          <span>{problem.locationCount || problem.location_count || 1} spots</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-slate-400">
          Updated {new Date(problem.updatedAt || problem.updated_at || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <Link
          to={`/government/problems/${problem.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
