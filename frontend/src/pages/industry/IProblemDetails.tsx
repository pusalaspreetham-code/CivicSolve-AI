import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  CheckCircle2,
  Clock,
  Rocket,
  Star,
  DollarSign,
  FileText,
  ShieldCheck,
  Send,
  MessageSquare,
  Sparkles,
  Loader2,
  IndianRupee,
} from "lucide-react";
import * as industryService from "../../services/industryService";
import { useToast } from "../../context/ToastContext";
import SeverityBadge from "../../components/SeverityBadge";
import ProblemMap from "../../components/ProblemMap";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import {
  IndustryProblemDetail,
  CommitmentType,
  AdoptionStatus,
  StudentSolution,
} from "../../types/industry";

const COMMITMENT_TYPES: { id: CommitmentType; label: string; description: string }[] = [
  {
    id: "MENTORSHIP",
    label: "Technical Mentorship",
    description: "Provide engineering guidance, architecture reviews, and domain advisory to student teams.",
  },
  {
    id: "PILOT_FUNDING",
    label: "Pilot Project Funding",
    description: "Provide grant or milestone funding for prototypes, field tests, or pilot implementations.",
  },
  {
    id: "HARDWARE_RESOURCES",
    label: "Hardware / Lab Resources",
    description: "Supply sensors, IoT hardware, testing equipment, or cloud compute infrastructure.",
  },
  {
    id: "FIELD_DEPLOYMENT",
    label: "Field Deployment & Scaling",
    description: "Deploy the solution in real municipal, industrial, or commercial operational environments.",
  },
];

const ADOPTION_STATUSES: { id: AdoptionStatus; label: string }[] = [
  { id: "EVALUATING", label: "Evaluating / Feasibility Check" },
  { id: "ACTIVE", label: "Active Mentorship & Development" },
  { id: "PILOT_DEPLOYED", label: "Pilot Deployed in Field" },
  { id: "RESOLVED", label: "Resolved / Operational" },
];

const IProblemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState<IndustryProblemDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Adoption Form State
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [commitmentType, setCommitmentType] = useState<CommitmentType>("MENTORSHIP");
  const [adoptionNotes, setAdoptionNotes] = useState("");
  const [budgetEstimate, setBudgetEstimate] = useState<number | string>("");
  const [submittingAdoption, setSubmittingAdoption] = useState(false);

  // Status Update State (for already adopted problems)
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<AdoptionStatus>("ACTIVE");
  const [statusNotes, setStatusNotes] = useState("");
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Review Form State
  const [reviewingSolutionId, setReviewingSolutionId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [pilotInterest, setPilotInterest] = useState<boolean>(false);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    loadDetails();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await industryService.getProblemDetails(id as string);
      setData(res);
      if (res.myAdoption) {
        setCommitmentType(res.myAdoption.commitment_type);
        setAdoptionNotes(res.myAdoption.notes || "");
        setBudgetEstimate(res.myAdoption.budget_estimate || "");
        setNewStatus(res.myAdoption.status);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load problem details.", "error");
      navigate("/industry/problems");
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdoption(true);
    try {
      const res = await industryService.adoptProblem(id as string, {
        commitmentType,
        notes: adoptionNotes,
        budgetEstimate: Number(budgetEstimate) || 0,
      });
      showToast(res.message || "Problem adopted successfully!", "success");
      setShowAdoptModal(false);
      await loadDetails();
    } catch (err: any) {
      showToast(err.message || "Could not adopt problem.", "error");
    } finally {
      setSubmittingAdoption(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.myAdoption) return;
    setSubmittingStatus(true);
    try {
      const res = await industryService.updateAdoptionStatus(data.myAdoption.id, {
        status: newStatus,
        notes: statusNotes || data.myAdoption.notes || undefined,
        budgetEstimate: Number(budgetEstimate) || data.myAdoption.budget_estimate,
      });
      showToast(res.message || "Status updated.", "success");
      setShowStatusModal(false);
      await loadDetails();
    } catch (err: any) {
      showToast(err.message || "Failed to update adoption status.", "error");
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSolutionId) return;
    if (reviewText.trim().length < 10) {
      showToast("Review text must be at least 10 characters.", "error");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await industryService.submitSolutionReview(reviewingSolutionId, {
        reviewText,
        rating: reviewRating,
        pilotInterest,
      });
      showToast(res.message || "Review submitted successfully!", "success");
      setReviewingSolutionId(null);
      setReviewText("");
      setReviewRating(5);
      setPilotInterest(false);
      await loadDetails();
    } catch (err: any) {
      showToast(err.message || "Could not submit review.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Loading label="Loading civic problem details & solutions..." />;
  if (!data || !data.problem) return null;

  const { problem, myAdoption, allAdoptions, studentSolutions, teams } = data;

  const markers = (problem.locations || []).map((loc) => ({
    location: loc,
    title: problem.problem_title,
    severity: problem.severity,
  }));

  return (
    <div className="space-y-8">
      {/* Back button & ID */}
      <div className="flex items-center justify-between">
        <Link
          to="/industry/problems"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} /> Back to Problems Catalog
        </Link>
        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          Problem #{problem.id}
        </span>
      </div>

      {/* Main Header Card */}
      <div className="card p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {problem.domain}
              </span>
              <SeverityBadge severity={problem.severity} />
              <span className="text-xs text-slate-500 font-medium">
                {problem.report_count} citizen report{problem.report_count !== 1 ? "s" : ""}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {problem.problem_title}
            </h1>
          </div>

          {/* Adoption Callout / Button */}
          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {myAdoption ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                  <p className="font-bold text-amber-900">Adopted by your company</p>
                  <p className="text-amber-700 capitalize">
                    {myAdoption.commitment_type.replace("_", " ")} &middot;{" "}
                    <strong className="uppercase">{myAdoption.status.replace("_", " ")}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewStatus(myAdoption.status);
                    setStatusNotes(myAdoption.notes || "");
                    setShowStatusModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                >
                  Update Milestone / Status
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAdoptModal(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition"
              >
                <Briefcase size={16} /> Adopt / Sponsor This Problem
              </button>
            )}
          </div>
        </div>

        {/* Problem Statement */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Problem Statement</h2>
          <p className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap">
            {problem.problem_description}
          </p>
        </div>

        {/* Responsible Academic Fields from AI */}
        {problem.responsible_fields && problem.responsible_fields.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Target Academic Fields (AI Classified)
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {problem.responsible_fields.map((field) => (
                <span
                  key={field}
                  className="text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-semibold"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Image Attachment if any */}
        {problem.image_path && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Citizen Evidence</h2>
            <div className="max-w-md rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img src={problem.image_path} alt="Citizen Evidence" className="w-full object-cover max-h-64" />
              {problem.image_description && (
                <p className="p-3 text-xs text-slate-600 italic bg-white border-t border-slate-200">
                  AI Vision Analysis: {problem.image_description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Geolocation Map */}
      <div className="card p-5 space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MapPin size={18} className="text-amber-600" />
          Reported Locations ({problem.locations?.length || 0})
        </h2>
        <ProblemMap markers={markers} height="320px" />
      </div>

      {/* Student Solutions & Technical Proposals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Award size={20} className="text-amber-600" />
              Student Innovations & Technical Proposals ({studentSolutions.length})
            </h2>
            <p className="text-xs text-slate-500">
              Review solution write-ups, provide professional technical mentorship, and flag solutions for corporate pilot adoption
            </p>
          </div>
        </div>

        {studentSolutions.length === 0 ? (
          <EmptyState
            title="No students have submitted solutions yet"
            description="Engineering students working on this problem will submit architectural proposals and solution write-ups here."
          />
        ) : (
          <div className="space-y-4">
            {studentSolutions.map((sol) => {
              const hasText = sol.solution_text && sol.solution_text.trim().length > 0;
              return (
                <div
                  key={sol.student_problem_id}
                  className={`card p-5 border ${
                    hasText ? "border-amber-200 bg-white" : "border-slate-200 bg-slate-50/70"
                  } space-y-4`}
                >
                  {/* Student Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm border border-amber-200">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{sol.student_name}</p>
                        <p className="text-xs text-slate-500">
                          {sol.college} &middot; {sol.branch} ({sol.year_of_study})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          sol.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {sol.status}
                      </span>
                      {hasText && (
                        <button
                          onClick={() => {
                            setReviewingSolutionId(sol.student_problem_id);
                            setReviewText("");
                            setReviewRating(5);
                            setPilotInterest(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm"
                        >
                          <MessageSquare size={13} /> Technical Review
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Solution Text */}
                  {hasText ? (
                    <div className="space-y-1.5 bg-amber-50/40 p-4 rounded-xl border border-amber-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                          <FileText size={13} /> Proposed Solution & Methodology
                        </span>
                        {sol.solution_submitted_at && (
                          <span className="text-[11px] text-slate-400">
                            Submitted: {new Date(sol.solution_submitted_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {sol.solution_text}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Student is currently actively researching and working on this problem; solution write-up in progress.
                    </p>
                  )}

                  {/* Existing Industry Reviews */}
                  {sol.reviews && sol.reviews.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={13} className="text-amber-500" /> Industry Technical Reviews ({sol.reviews.length})
                      </p>
                      <div className="space-y-2">
                        {sol.reviews.map((rev) => (
                          <div key={rev.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">{rev.company_name}</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    size={12}
                                    className={s <= rev.rating ? "text-amber-500 fill-amber-500" : "text-slate-300"}
                                  />
                                ))}
                                {rev.pilot_interest && (
                                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                    Flagged for Pilot
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-slate-600 italic">"{rev.review_text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Student Teams Working on This Problem */}
      {teams && teams.length > 0 && (
        <section className="card p-5 space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-amber-600" />
            Active Student Collaboration Teams ({teams.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {teams.map((t) => (
              <div key={t.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                <p className="text-xs text-slate-500">
                  Lead: <strong className="text-slate-700">{t.leader_name}</strong>
                </p>
                <p className="text-xs text-slate-500">
                  Members: <strong className="text-slate-700">{t.member_count} / {t.max_members}</strong>
                </p>
                {t.can_message && (
                  <button
                    onClick={() => navigate(`/industry/messages?team=${t.id}`)}
                    className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
                  >
                    <MessageSquare size={12} /> Message Team
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Other Industry Adoptions */}
      {allAdoptions && allAdoptions.length > 0 && (
        <section className="card p-5 space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase size={18} className="text-blue-600" />
            Other Industry Partners Supporting This Problem ({allAdoptions.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allAdoptions.map((adp) => (
              <div key={adp.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{adp.company_name}</p>
                  <p className="text-slate-500">{adp.sector}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 uppercase block">{adp.commitment_type.replace("_", " ")}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{adp.status.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ADOPT PROBLEM MODAL */}
      {showAdoptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Adopt / Sponsor Problem</h2>
              <p className="text-xs text-slate-500 mt-1">
                Commit corporate resources, pilot funding, or engineering mentorship to solve this challenge.
              </p>
            </div>

            <form onSubmit={handleAdoptSubmit} className="space-y-4">
              <div>
                <label className="label">Select Commitment Type</label>
                <div className="space-y-2 mt-1">
                  {COMMITMENT_TYPES.map((ct) => (
                    <label
                      key={ct.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        commitmentType === ct.id
                          ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-400"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="commitmentType"
                        value={ct.id}
                        checked={commitmentType === ct.id}
                        onChange={() => setCommitmentType(ct.id)}
                        className="mt-1 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <p className="font-bold text-sm text-slate-900">{ct.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{ct.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Estimated Budget / Grant Amount in INR (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    className="input pl-8"
                    placeholder="e.g. 50000"
                    value={budgetEstimate}
                    onChange={(e) => setBudgetEstimate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Adoption Notes & Support Proposal (Optional)</label>
                <textarea
                  className="input min-h-[90px]"
                  placeholder="Describe your corporate pilot scope, lab availability, or mentorship schedule..."
                  value={adoptionNotes}
                  onChange={(e) => setAdoptionNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdoptModal(false)}
                  className="btn-secondary"
                  disabled={submittingAdoption}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdoption}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition disabled:opacity-50"
                >
                  {submittingAdoption && <Loader2 size={16} className="animate-spin" />}
                  {submittingAdoption ? "Confirming..." : "Confirm Problem Adoption"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Update Adoption Status</h2>
              <p className="text-xs text-slate-500 mt-1">Advance project implementation milestones</p>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="label">Current Milestone Status</label>
                <select
                  className="input"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AdoptionStatus)}
                >
                  {ADOPTION_STATUSES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Milestone Notes</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Share progress updates, field trial results, or pilot feedback..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="btn-secondary"
                  disabled={submittingStatus}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition disabled:opacity-50"
                >
                  {submittingStatus ? "Updating..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW STUDENT SOLUTION MODAL */}
      {reviewingSolutionId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Review Student Solution</h2>
              <p className="text-xs text-slate-500 mt-1">Provide professional feedback and assess for corporate pilot</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="label">Technical Rating</label>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-500 transition"
                    >
                      <Star
                        size={24}
                        className={star <= reviewRating ? "text-amber-500 fill-amber-500" : "text-slate-300"}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{reviewRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="label">Technical Feedback</label>
                <textarea
                  required
                  className="input min-h-[100px]"
                  placeholder="Assess feasibility, architecture, potential challenges, and suggested improvements..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">Minimum 10 characters.</p>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pilotInterest}
                  onChange={(e) => setPilotInterest(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-emerald-600 border-emerald-300 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-bold text-xs text-emerald-900">Flag for Live Corporate Pilot</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Our company is interested in deploying or sponsoring this student's solution in the field.
                  </p>
                </div>
              </label>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingSolutionId(null)}
                  className="btn-secondary"
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition disabled:opacity-50"
                >
                  {submittingReview && <Loader2 size={16} className="animate-spin" />}
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IProblemDetails;
