import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react";
import { BRANCHES, YEARS, RegisterFormData } from "../types/auth";
import * as authService from "../services/authService";
import { useToast } from "../context/ToastContext";

const emptyForm: RegisterFormData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  college: "",
  branch: "",
  year_of_study: "",
  phone: "",
  city: "",
};

const Register = () => {
  const [form, setForm] = useState<RegisterFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const update = (key: keyof RegisterFormData, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!form.branch) {
      setError("Please select your branch.");
      return;
    }
    if (!form.year_of_study) {
      setError("Please select your year of study.");
      return;
    }

    setSubmitting(true);
    try {
      await authService.sendOtp(form.email);
      showToast("Verification code sent to your email.", "success");
      navigate("/student/verify-otp", { state: { form } });
    } catch (err: any) {
      setError(err.message || "Could not send OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-brand-600 text-white flex items-center justify-center mb-3">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Create your Student Account</h1>
          <p className="text-sm text-slate-500 mt-1">Solve real civic problems matched to your academic branch</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input required className="input" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                required
                className="input"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
            </div>
            <div>
              <label className="label">College / University</label>
              <input
                required
                className="input"
                value={form.college}
                onChange={(e) => update("college", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Branch</label>
              <select required className="input" value={form.branch} onChange={(e) => update("branch", e.target.value)}>
                <option value="">Select branch</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Year of Study</label>
              <select
                required
                className="input"
                value={form.year_of_study}
                onChange={(e) => update("year_of_study", e.target.value)}
              >
                <option value="">Select year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input required className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">City</label>
              <input required className="input" value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Sending OTP..." : "Send OTP"}
          </button>

          <p className="text-sm text-center text-slate-500">
            Already have an account?{" "}
            <Link to="/student/login" className="text-brand-600 font-medium">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
