import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { govProblemService } from '../../services/govProblemService';
import { GovProblem } from '../../types/government';
import {
  Loader2, MapPin, Users, CheckCircle2, XCircle, ShieldCheck,
  Gauge, AlertTriangle, Inbox,
} from 'lucide-react';

function priorityColor(score: number) {
  if (score >= 75) return { text: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-600/20', bar: 'bg-red-500' };
  if (score >= 50) return { text: 'text-orange-700', bg: 'bg-orange-50', ring: 'ring-orange-600/20', bar: 'bg-orange-500' };
  if (score >= 25) return { text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-600/20', bar: 'bg-amber-500' };
  return { text: 'text-slate-600', bg: 'bg-slate-50', ring: 'ring-slate-500/20', bar: 'bg-slate-400' };
}

function PriorityBadge({ score }: { score: number }) {
  const c = priorityColor(score);
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${c.bg} ${c.text} ring-1 ring-inset ${c.ring}`}>
        <Gauge size={12} /> {Math.round(score)} priority
      </span>
      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${c.bar}`} style={{ width: `${Math.min(100, Math.max(4, score))}%` }} />
      </div>
    </div>
  );
}

interface RejectModalState {
  problem: GovProblem;
}

export default function GovPendingApprovals() {
  const [problems, setProblems] = useState<GovProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<RejectModalState | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await govProblemService.getPendingProblems();
      setProblems(data);
    } catch (e) {
      console.error('Failed to fetch pending problems', e);
      setError('Could not load the approval queue. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (problem: GovProblem) => {
    setBusyId(problem.id);
    try {
      await govProblemService.approveProblem(problem.id);
      setProblems((prev) => prev.filter((p) => p.id !== problem.id));
    } catch (e) {
      console.error('Approve failed', e);
      setError('Approval failed. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectModal || rejectReason.trim().length < 5) return;
    setBusyId(rejectModal.problem.id);
    try {
      await govProblemService.rejectProblem(rejectModal.problem.id, rejectReason.trim());
      setProblems((prev) => prev.filter((p) => p.id !== rejectModal.problem.id));
      setRejectModal(null);
      setRejectReason('');
    } catch (e) {
      console.error('Reject failed', e);
      setError('Rejection failed. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck size={14} /> Approval queue
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pending Approvals</h1>
        <p className="text-slate-500 font-medium mt-1 max-w-2xl">
          These problems cleared the AI pipeline's priority check but are not visible to
          students or universities yet. Approve to publish them to the student portal, or
          reject with a reason. Sorted by priority score, highest first.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm font-medium px-4 py-3 ring-1 ring-inset ring-red-600/10">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        </div>
      ) : problems.length === 0 ? (
        <div className="card p-12 text-center bg-slate-50 border-dashed border-2">
          <Inbox className="mx-auto h-12 w-12 text-emerald-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Queue is empty</h3>
          <p className="text-slate-500 mt-1">
            Nothing is waiting on a decision right now. New citizen reports that clear the
            priority threshold will show up here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {problems.map((problem) => {
            const c = priorityColor(problem.priority_score);
            const busy = busyId === problem.id;
            return (
              <div key={problem.id} className="card p-5 md:p-6 flex flex-col md:flex-row gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {problem.domain || 'Uncategorized'}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${c.text}`}>
                      <AlertTriangle className="h-3 w-3" /> {problem.severity || 'Unknown'} severity
                    </span>
                    <PriorityBadge score={problem.priority_score} />
                  </div>

                  <Link to={`/government/problems/${problem.id}`} className="block">
                    <h3 className="text-lg font-bold text-slate-900 mb-1.5 hover:text-emerald-700 transition-colors">
                      {problem.problem_title}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{problem.problem_description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{problem.report_count || 1} citizen report{(problem.report_count || 1) > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{problem.location_count || 1} location{(problem.location_count || 1) > 1 ? 's' : ''}</span>
                    </div>
                    <span>Submitted {new Date(problem.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 md:w-44 shrink-0">
                  <button
                    onClick={() => handleApprove(problem)}
                    disabled={busy}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => { setRejectModal({ problem }); setRejectReason(''); }}
                    disabled={busy}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors bg-white text-red-700 border border-red-200 hover:bg-red-50 disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <Link
                    to={`/government/problems/${problem.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                  >
                    Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Reject this problem?</h3>
            <p className="text-sm text-slate-500 mb-4">
              "{rejectModal.problem.problem_title}" will not be shown to students or universities.
              This is logged in the audit trail.
            </p>
            <textarea
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (min. 5 characters)…"
              rows={3}
              className="input w-full text-sm mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={rejectReason.trim().length < 5 || busyId === rejectModal.problem.id}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busyId === rejectModal.problem.id ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
