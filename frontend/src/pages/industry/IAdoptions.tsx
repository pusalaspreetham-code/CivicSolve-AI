import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Clock,
  Sparkles,
  Rocket,
  CheckCircle2,
  Compass,
  ArrowRight,
  IndianRupee,
  FileText,
  Loader2,
} from "lucide-react";
import * as industryService from "../../services/industryService";
import { useToast } from "../../context/ToastContext";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import SeverityBadge from "../../components/SeverityBadge";
import { IndustryAdoptionItem, AdoptionStatus } from "../../types/industry";

const ADOPTION_STATUSES: { id: AdoptionStatus; label: string }[] = [
  { id: "EVALUATING", label: "Evaluating" },
  { id: "ACTIVE", label: "Active Mentorship" },
  { id: "PILOT_DEPLOYED", label: "Pilot Deployed" },
  { id: "RESOLVED", label: "Resolved" },
];

const IAdoptions = () => {
  const { showToast } = useToast();
  const [adoptions, setAdoptions] = useState<IndustryAdoptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Editing state
  const [editingAdoption, setEditingAdoption] = useState<IndustryAdoptionItem | null>(null);
  const [editStatus, setEditStatus] = useState<AdoptionStatus>("ACTIVE");
  const [editNotes, setEditNotes] = useState("");
  const [editBudget, setEditBudget] = useState<number | string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdoptions();
  }, []);

  const fetchAdoptions = async () => {
    setLoading(true);
    try {
      const data = await industryService.getMyAdoptions();
      setAdoptions(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load adopted projects.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdoption) return;
    setSaving(true);
    try {
      await industryService.updateAdoptionStatus(editingAdoption.id, {
        status: editStatus,
        notes: editNotes,
        budgetEstimate: Number(editBudget) || 0,
      });
      showToast("Adoption details updated successfully!", "success");
      setEditingAdoption(null);
      await fetchAdoptions();
    } catch (err: any) {
      showToast(err.message || "Failed to update adoption.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredAdoptions =
    statusFilter === "ALL"
      ? adoptions
      : adoptions.filter((a) => a.status === statusFilter);

  const getStatusBadge = (status: AdoptionStatus) => {
    switch (status) {
      case "EVALUATING":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ACTIVE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PILOT_DEPLOYED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "RESOLVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Adopted Civic Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track corporate sponsorships, mentorship roadmaps, and deployment milestones
          </p>
        </div>
        <Link
          to="/industry/problems"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition self-start sm:self-auto"
        >
          <Compass size={16} /> Adopt Another Problem
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            statusFilter === "ALL"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Projects ({adoptions.length})
        </button>
        {ADOPTION_STATUSES.map((s) => {
          const count = adoptions.filter((a) => a.status === s.id).length;
          return (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === s.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Projects List */}
      {loading ? (
        <Loading label="Loading your adopted projects..." />
      ) : filteredAdoptions.length === 0 ? (
        <EmptyState
          title="No adopted projects found"
          description={
            statusFilter === "ALL"
              ? "Your company has not adopted any civic problems yet. Browse the catalog to get started."
              : `No adopted projects currently in '${statusFilter.replace("_", " ")}' stage.`
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredAdoptions.map((item) => (
            <div
              key={item.id}
              className="card p-5 md:p-6 hover:shadow-md transition space-y-4 border border-slate-200"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      #{item.problem_id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {item.domain}
                    </span>
                    <SeverityBadge severity={item.severity} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{item.problem_title}</h3>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${getStatusBadge(item.status)}`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                  <button
                    onClick={() => {
                      setEditingAdoption(item);
                      setEditStatus(item.status);
                      setEditNotes(item.notes || "");
                      setEditBudget(item.budget_estimate || "");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Commitment Details Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <p className="text-slate-400 text-[11px]">Commitment Type</p>
                  <p className="font-bold text-slate-800 uppercase mt-0.5">
                    {item.commitment_type.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Grant / Budget</p>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    {Number(item.budget_estimate) > 0
                      ? `₹${Number(item.budget_estimate).toLocaleString("en-IN")}`
                      : "Non-monetary (Mentorship / Lab)"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Citizen Reports</p>
                  <p className="font-bold text-slate-800 mt-0.5">{item.report_count} citizens</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[11px]">Student Solutions</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {item.solution_count > 0 ? (
                      <span className="text-emerald-700">{item.solution_count} ready for review</span>
                    ) : (
                      "Under development"
                    )}
                  </p>
                </div>
              </div>

              {/* Progress Milestones Tracker */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Milestone Progress</p>
                <div className="grid grid-cols-4 gap-1 sm:gap-2">
                  {ADOPTION_STATUSES.map((step, idx) => {
                    const stepOrder = ["EVALUATING", "ACTIVE", "PILOT_DEPLOYED", "RESOLVED"];
                    const currentIdx = stepOrder.indexOf(item.status);
                    const isPassed = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;
                    return (
                      <div
                        key={step.id}
                        className={`text-center py-2 px-1 rounded-lg border text-[11px] font-bold transition ${
                          isCurrent
                            ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                            : isPassed
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                      >
                        {step.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <div className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                  <FileText size={15} className="text-amber-700 shrink-0 mt-0.5" />
                  <p className="italic leading-relaxed">{item.notes}</p>
                </div>
              )}

              {/* Link to detail */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <Link
                  to={`/industry/problems/${item.problem_id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                >
                  View Problem Details & Student Solutions <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingAdoption && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Update Project Milestone</h2>
              <p className="text-xs text-slate-500 mt-1">{editingAdoption.problem_title}</p>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-4">
              <div>
                <label className="label">Status Milestone</label>
                <select
                  className="input"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AdoptionStatus)}
                >
                  {ADOPTION_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Budget / Grant Allocation in INR (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    className="input pl-8"
                    placeholder="e.g. 50000"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Milestone Notes / Field Progress</label>
                <textarea
                  className="input min-h-[90px]"
                  placeholder="Share updates on pilot deployment, lab trials, or mentorship milestones..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAdoption(null)}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition disabled:opacity-50"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? "Saving..." : "Save Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IAdoptions;
