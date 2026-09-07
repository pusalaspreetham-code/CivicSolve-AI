import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Users, AlertTriangle, Send } from 'lucide-react';
import { govProblemService } from '../../services/govProblemService';
import { useToast } from '../../context/ToastContext';
import AiBriefPanel from '../../components/gov/AiBriefPanel';
import ActionTimeline from '../../components/gov/ActionTimeline';
import ProblemMap from '../../components/ProblemMap';

export default function GovProblemDetails() {
  const { id } = useParams();
  const { showToast } = useToast();
  
  const [problem, setProblem] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionForm, setActionForm] = useState({
    action_type: 'ACKNOWLEDGED',
    remarks: '',
    budget_estimate: '',
    timeline_days: '',
  });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        if (id) {
          const [probData, actionsData] = await Promise.all([
            govProblemService.getProblemById(id),
            govProblemService.getActions(id)
          ]);
          setProblem(probData);
          setActions(actionsData);
        }
      } catch (error) {
        console.error('Failed to fetch problem details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || actionForm.remarks.length < 10) {
      showToast('Please provide detailed remarks (min 10 chars)', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        action_type: actionForm.action_type,
        remarks: actionForm.remarks,
        budget_estimate: actionForm.budget_estimate ? Number(actionForm.budget_estimate) : null,
        timeline_days: actionForm.timeline_days ? Number(actionForm.timeline_days) : null,
      };
      
      const newAction = await govProblemService.createAction(id, payload);
      setActions([newAction, ...actions]);
      
      // Reset form
      setActionForm({
        action_type: 'ACKNOWLEDGED',
        remarks: '',
        budget_estimate: '',
        timeline_days: '',
      });
      showToast('Action recorded successfully', 'success');
      
      // Update local problem state to reflect new status
      setProblem({ ...problem, actionStatus: actionForm.action_type });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to record action', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900">Problem not found</h2>
        <Link to="/government/problems" className="text-emerald-600 mt-2 inline-block">Back to problems</Link>
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    const s = severity?.toUpperCase() || 'LOW';
    if (s === 'CRITICAL') return <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded"><AlertTriangle className="h-3 w-3" /> Critical</span>;
    if (s === 'HIGH') return <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded"><AlertTriangle className="h-3 w-3" /> High</span>;
    if (s === 'MEDIUM') return <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">Medium</span>;
    return <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">Low</span>;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/government/problems" className="p-2 -ml-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Problem Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {problem.domain || 'Uncategorized'}
              </span>
              {getSeverityBadge(problem.severity)}
              
              <div className="flex items-center gap-4 ml-auto text-sm font-medium text-slate-600">
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {problem.reportCount || problem.report_count || 1} citizens</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {problem.locationCount || problem.location_count || 1} spots</span>
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-4">{problem.problem_title || problem.title}</h2>
            <div className="prose prose-slate max-w-none text-slate-700">
              <p className="whitespace-pre-wrap leading-relaxed">{problem.problem_description || problem.description}</p>
            </div>
            
            {(problem.aiCategory || problem.ai_category) && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Responsible Body Suggestion</h4>
                <p className="text-sm font-medium text-slate-800">{problem.aiCategory || problem.ai_category}</p>
              </div>
            )}
          </div>

          {/* Map View */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="text-emerald-600 h-5 w-5" /> Locations
            </h3>
            <div className="h-[400px] rounded-xl overflow-hidden border border-slate-200">
              <ProblemMap markers={[{
                location: { latitude: problem.locations?.[0]?.latitude || 0, longitude: problem.locations?.[0]?.longitude || 0 },
                title: problem.title || problem.problem_title,
                severity: problem.severity,
                problemId: problem.id
              }].filter(m => m.location.latitude !== 0)} />
            </div>
          </div>

          {/* Action History */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Action History</h3>
            <ActionTimeline actions={actions} />
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Briefing */}
          <AiBriefPanel problemId={id || ''} />

          {/* Take Action Form */}
          <div className="card p-6 border-emerald-200 bg-emerald-50/30">
            <h3 className="text-lg font-bold text-emerald-900 mb-4">Record Official Action</h3>
            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="label text-emerald-900">Action Type</label>
                <select
                  value={actionForm.action_type}
                  onChange={(e) => setActionForm({ ...actionForm, action_type: e.target.value })}
                  className="input focus:ring-emerald-500 bg-white"
                  required
                >
                  <option value="ACKNOWLEDGED">Acknowledge Issue</option>
                  <option value="IN_PROGRESS">Mark as In Progress</option>
                  <option value="BUDGET_ALLOCATED">Budget Allocated</option>
                  <option value="RESOLVED">Mark as Resolved</option>
                  <option value="REJECTED">Reject / Invalid</option>
                </select>
              </div>
              
              <div>
                <label className="label text-emerald-900">Official Remarks (min 10 chars)</label>
                <textarea
                  value={actionForm.remarks}
                  onChange={(e) => setActionForm({ ...actionForm, remarks: e.target.value })}
                  className="input focus:ring-emerald-500 min-h-[100px] resize-y"
                  placeholder="Provide official statement or update..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-emerald-900 text-xs">Est. Budget (₹)</label>
                  <input
                    type="number"
                    value={actionForm.budget_estimate}
                    onChange={(e) => setActionForm({ ...actionForm, budget_estimate: e.target.value })}
                    className="input focus:ring-emerald-500 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="label text-emerald-900 text-xs">Timeline (Days)</label>
                  <input
                    type="number"
                    value={actionForm.timeline_days}
                    onChange={(e) => setActionForm({ ...actionForm, timeline_days: e.target.value })}
                    className="input focus:ring-emerald-500 text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} /> Record Action
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
