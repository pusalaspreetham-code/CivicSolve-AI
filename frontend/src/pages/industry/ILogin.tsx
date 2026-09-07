import { useState, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Wrench, Loader2 } from "lucide-react";
import { useIndustryAuth } from "../../context/IndustryAuthContext";
import { useToast } from "../../context/ToastContext";

const ILogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { login } = useIndustryAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      showToast("Welcome back!", "success");
      const from = (location.state as any)?.from;
      const destination = from ? `${from.pathname || ""}${from.search || ""}` : "/industry/dashboard";
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-3 shadow-md shadow-amber-500/20">
            <Wrench size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">CivicSolve AI — Industry Portal</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Sign in to sponsor civic projects, mentor students, and pilot real solutions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="label">Corporate Email Address</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lead@company.com"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-600 transition disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Signing In..." : "Sign In"}
          </button>

          <p className="text-sm text-center text-slate-500">
            New corporate partner?{" "}
            <Link to="/industry/register" className="text-amber-700 font-bold hover:underline">
              Register your company
            </Link>
          </p>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-400">
            <Link to="/student/login" className="hover:text-slate-600">Student login</Link>
            <Link to="/university/login" className="hover:text-slate-600">University login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ILogin;
