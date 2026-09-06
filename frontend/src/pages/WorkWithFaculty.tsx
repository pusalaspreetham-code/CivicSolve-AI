import { useEffect, useState, FormEvent } from "react";
import { GraduationCap, Mail, BookOpen, Send, Clock, CheckCircle2, XCircle, X } from "lucide-react";
import * as facultyService from "../services/facultyService";
import * as problemService from "../services/problemService";
import { Faculty, GuidanceRequest } from "../types/faculty";
import { MyProblem } from "../types/problem";
import { useToast } from "../context/ToastContext";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DENIED: "bg-red-50 text-red-700 border-red-200",
};

const statusIcon: Record<string, JSX.Element> = {
  PENDING: <Clock size={13} />,
  ACCEPTED: <CheckCircle2 size={13} />,
  DENIED: <XCircle size={13} />,
};

const WorkWithFaculty = () => {
  const { showToast } = useToast();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [myProblems, setMyProblems] = useState<MyProblem[]>([]);
  const [requests, setRequests] = useState<GuidanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [wantsGuidance, setWantsGuidance] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [facultyList, problems, requestList] = await Promise.all([
        facultyService.getFaculty(),
        problemService.getMyProblems(),
        facultyService.getMyGuidanceRequests(),
      ]);
      setFaculty(facultyList);
      setMyProblems(problems);
      setRequests(requestList);
    } catch (err: any) {
      showToast(err.message || "Could not load faculty guidance data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openRequestForm = (f: Faculty) => {
    setSelectedFaculty(f);
    setSelectedProblemId(myProblems[0] ? String(myProblems[0].problem_id) : "");
    setMessage("");
    setWantsGuidance(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    if (!selectedProblemId) {
      showToast("Please select a problem you want guidance for.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await facultyService.requestGuidance(selectedFaculty.id, Number(selectedProblemId), message.trim() || undefined);
      showToast(res.message, "success");
      setWantsGuidance(false);
      setSelectedFaculty(null);
      await load();
    } catch (err: any) {
      showToast(err.message || "Could not send guidance request.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading label="Loading faculty guidance options..." />;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Work With Faculty</h1>
        <p className="text-slate-500 mt-1">
          Completely optional — want to work under faculty guidance? Pick a faculty member and the problem you'd like help
          with. The faculty member accepts or declines directly from their email.
        </p>
      </div>

      {/* Faculty directory */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Available Faculty</h2>
        {faculty.length === 0 ? (
          <EmptyState
            title="No faculty members listed yet"
            description="Your university hasn't added any faculty for guidance yet. Check back later."
            icon={<GraduationCap size={22} />}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {faculty.map((f) => (
              <div key={f.id} className="card p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{f.name}</p>
                    <p className="text-xs text-slate-500">{f.department}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 flex items-start gap-1.5">
                  <BookOpen size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  {f.expertise}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Mail size={12} className="text-slate-400" />
                  {f.email}
                </p>
                {f.university_name && <p className="text-xs text-slate-400">{f.university_name}</p>}
                <button onClick={() => openRequestForm(f)} className="btn-primary text-xs px-3 py-1.5 mt-1">
                  Want to work under faculty guidance?
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Guidance request modal */}
      {wantsGuidance && selectedFaculty && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="card w-full max-w-md p-6 space-y-4 relative">
            <button
              type="button"
              onClick={() => setWantsGuidance(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
            <div>
              <h3 className="font-semibold text-slate-900">Request guidance from {selectedFaculty.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{selectedFaculty.department} &middot; {selectedFaculty.expertise}</p>
            </div>

            {myProblems.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                You haven't taken up a problem yet. Take a problem from "My Problems" first, then come back to request
                guidance for it.
              </p>
            ) : (
              <>
                <div>
                  <label className="label">Problem you want guidance for</label>
                  <select className="input" value={selectedProblemId} onChange={(e) => setSelectedProblemId(e.target.value)}>
                    {myProblems.map((p) => (
                      <option key={p.problem_id} value={p.problem_id}>
                        #{p.problem_id} — {p.problem_title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Message (optional)</label>
                  <textarea
                    className="input min-h-[80px]"
                    placeholder="Briefly tell the faculty member what kind of help you're looking for..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Send size={14} />
                  {submitting ? "Sending..." : "Send Request"}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* My requests */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">My Guidance Requests</h2>
        {requests.length === 0 ? (
          <EmptyState
            title="No guidance requests yet"
            description="Faculty guidance is completely optional. Request it any time from the directory above."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="card p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{r.faculty_name}</p>
                  <p className="text-xs text-slate-500">{r.department} &middot; {r.expertise}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Problem: <span className="font-medium">{r.problem_title}</span>
                  </p>
                  {r.team_name && <p className="text-xs text-slate-400">Team: {r.team_name}</p>}
                  <p className="text-xs text-slate-400 mt-1">Requested {new Date(r.requested_at).toLocaleDateString()}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border shrink-0 ${statusStyles[r.status]}`}
                >
                  {statusIcon[r.status]}
                  {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default WorkWithFaculty;
