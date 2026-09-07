import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { govProblemService } from '../../services/govProblemService';
import { AiBrief } from '../../types/government';

interface AiBriefPanelProps {
  problemId: number | string;
}

export default function AiBriefPanel({ problemId }: AiBriefPanelProps) {
  const [brief, setBrief] = useState<AiBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrief = async () => {
      try {
        setLoading(true);
        const data = await govProblemService.getAiBrief(problemId);
        setBrief(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to generate AI brief.');
      } finally {
        setLoading(false);
      }
    };
    fetchBrief();
  }, [problemId]);

  if (loading) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center h-48 bg-slate-50/50">
        <Loader2 className="h-6 w-6 text-emerald-600 animate-spin mb-2" />
        <p className="text-sm text-slate-500 font-medium">Generating AI Brief...</p>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="card p-6 bg-slate-50 border-dashed">
        <div className="flex items-center gap-2 text-slate-500 mb-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-bold">AI Executive Brief</h3>
        </div>
        <p className="text-sm text-slate-500">Brief not available yet.</p>
      </div>
    );
  }

  const scoreColor = brief.priority_score >= 7 ? 'text-red-600 bg-red-50' : brief.priority_score >= 4 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';

  return (
    <div className="card overflow-hidden">
      <div className="bg-emerald-950 px-5 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h3 className="font-bold text-sm">AI Executive Brief</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-200/70 uppercase tracking-wider font-semibold">Priority Score</span>
          <span className={`px-2 py-0.5 rounded font-black ${scoreColor}`}>{brief.priority_score}/10</span>
        </div>
      </div>
      
      <div className="p-5 space-y-5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Impact Assessment</h4>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{brief.impact_assessment}</p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Recommended Actions</h4>
          <ul className="space-y-2">
            {brief.recommended_actions.map((action, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  {i + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Resource Estimate</h4>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{brief.resource_estimate}</p>
        </div>
      </div>
    </div>
  );
}
