import { useState, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Building2, Loader2 } from "lucide-react";
import { useUniversityAuth } from "../../context/UniversityAuthContext";
import { useToast } from "../../context/ToastContext";

const ULogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { login } = useUniversityAuth();
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
      const destination = from ? `${from.pathname || ""}${from.search || ""}` : "/university/dashboard";
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
          <div className="h-12 w-12 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-3">
            <Building2 size={24} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">CivicSolve AI — University Portal</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">Log in to see engagement from your students</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <div>
            <label className="label">Institutional Email</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourcollege.edu.in"
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

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Logging in..." : "Log In"}
          </button>

          <p className="text-sm text-center text-slate-500">
            Don't have a university portal yet?{" "}
            <Link to="/university/register" className="text-violet-600 font-medium">
              Register
            </Link>
          </p>
          <p className="text-xs text-center text-slate-400">
            <Link to="/student/login" className="hover:text-slate-600">Are you a student? Log in here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ULogin;
