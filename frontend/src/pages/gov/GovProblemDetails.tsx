import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, Users, AlertTriangle, Send } from 'lucide-react';
import { govProblemService } from '../../services/govProblemService';
import { useToast } from '../../context/ToastContext';
import AiBriefPanel from '../../components/gov/AiBriefPanel';
import ActionTimeline from '../../components/gov/ActionTimeline';
import ProblemMap from '../../components/ProblemMap';
import { GovStudent } from '../../types/government';

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

  const [students, setStudents] = useState<GovStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [removeModal, setRemoveModal] = useState<{ studentId: number; name: string } | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removing, setRemoving] = useState(false);

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

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (id) {
          const data = await govProblemService.getStudents(id);
          setStudents(data);
        }
      } catch (err) {
        console.error('Failed to fetch students', err);
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
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
      if (['RESOLVED', 'DISMISSED_FAKE', 'DISMISSED_DUPLICATE', 'CLOSED_EXTERNAL'].includes(actionForm.action_type)) {
        const updatedProblem = await govProblemService.getProblemById(id!);
        setProblem(updatedProblem);
      } else {
        setProblem({ ...problem, actionStatus: actionForm.action_type });
      }
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
              
              {problem.status && problem.status !== 'OPEN' && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  problem.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                  problem.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                  problem.status === 'DISMISSED_FAKE' ? 'bg-red-100 text-red-700' :
                  problem.status === 'DISMISSED_DUPLICATE' ? 'bg-orange-100 text-orange-700' :
                  problem.status === 'CLOSED_EXTERNAL' ? 'bg-slate-100 text-slate-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {problem.status.replace(/_/g, ' ')}
                </span>
              )}
              
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

          {/* Students Working on This */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="text-emerald-600 h-5 w-5" /> Students Assigned ({students.length})
            </h3>
            {studentsLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
            ) : students.length === 0 ? (
              <p className="text-sm text-slate-500">No students currently assigned to this problem.</p>
            ) : (
              <div className="space-y-3">
                {students.map((s) => (
                  <div key={s.studentId} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm text-slate-900">{s.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.college} • {s.branch} • {s.yearOfStudy}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                            s.status === 'WORKING' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>{s.status}</span>
                          <span className="text-xs text-slate-400">Joined {new Date(s.joinedAt).toLocaleDateString()}</span>
                        </div>
                        {s.contact && (
                          <p className="text-xs text-slate-500 mt-1">📧 {s.contact.email} {s.contact.phone && `• 📞 ${s.contact.phone}`}</p>
                        )}
                      </div>
                      {!['RESOLVED', 'DISMISSED_FAKE', 'DISMISSED_DUPLICATE', 'CLOSED_EXTERNAL'].includes(problem?.status) && (
                        <button
                          onClick={() => setRemoveModal({ studentId: s.studentId, name: s.name })}
                          className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {s.solutionText && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-500 mb-1">Solution Submitted:</p>
                        <p className="text-xs text-slate-700 line-clamp-3">{s.solutionText}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Take Action Form */}
          {['RESOLVED', 'DISMISSED_FAKE', 'DISMISSED_DUPLICATE', 'CLOSED_EXTERNAL'].includes(problem?.status) ? (
            <div className="card p-6 border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-700 mb-2">Case Closed</h3>
              <p className="text-sm text-slate-600">
                This case has been closed as <strong>{problem.status.replace(/_/g, ' ').toLowerCase()}</strong>.
              </p>
              {problem.status_reason && (
                <p className="text-sm text-slate-500 mt-2 bg-white p-3 rounded-lg border border-slate-100">{problem.status_reason}</p>
              )}
            </div>
          ) : (
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
                    <option value="DISMISSED_FAKE">Dismiss — Fake Report</option>
                    <option value="DISMISSED_DUPLICATE">Dismiss — Duplicate</option>
                    <option value="CLOSED_EXTERNAL">Close — Solved Externally</option>
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
          )}
        </div>
      </div>

      {/* Remove Student Modal */}
      {removeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Remove Student</h3>
            <p className="text-sm text-slate-600 mb-4">
              Remove <strong>{removeModal.name}</strong> from this case? They will see the reason.
            </p>
            <textarea
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="input focus:ring-emerald-500 min-h-[80px] resize-y mb-4"
              placeholder="Reason for removal (min 10 characters)..."
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setRemoveModal(null); setRemoveReason(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button
                onClick={async () => {
                  if (removeReason.trim().length < 10) { showToast('Reason must be at least 10 characters', 'error'); return; }
                  setRemoving(true);
                  try {
                    await govProblemService.removeStudent(id!, removeModal.studentId, removeReason);
                    setStudents(students.filter(s => s.studentId !== removeModal.studentId));
                    setRemoveModal(null);
                    setRemoveReason('');
                    showToast('Student removed from case', 'success');
                  } catch (err: any) {
                    showToast(err.response?.data?.message || 'Failed to remove student', 'error');
                  } finally {
                    setRemoving(false);
                  }
                }}
                disabled={removing || removeReason.trim().length < 10}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {removing ? 'Removing...' : 'Remove Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
