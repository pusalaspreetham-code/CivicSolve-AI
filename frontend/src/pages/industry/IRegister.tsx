import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wrench, Loader2 } from "lucide-react";
import { IndustryRegisterFormData, INDUSTRY_SECTORS } from "../../types/industry";
import * as industryAuthService from "../../services/industryAuthService";
import { useToast } from "../../context/ToastContext";

const emptyForm: IndustryRegisterFormData = {
  companyName: "",
  email: "",
  password: "",
  confirmPassword: "",
  contactPerson: "",
  designation: "",
  phone: "",
  sector: INDUSTRY_SECTORS[0],
  city: "",
  state: "",
  website: "",
};

const IRegister = () => {
  const [form, setForm] = useState<IndustryRegisterFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const update = (key: keyof IndustryRegisterFormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email.includes("@")) {
      setError("Please enter a valid corporate email address.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      await industryAuthService.sendOtp(form.email);
      showToast("Verification code sent to your email.", "success");
      navigate("/industry/verify-otp", { state: { form } });
    } catch (err: any) {
      setError(err.message || "Could not send verification OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-3 shadow-md shadow-amber-500/20">
            <Wrench size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Partner with CivicSolve AI</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Connect corporate engineering, CSR, and pilot funding to civic problem-solvers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Company / Organization Name</label>
              <input
                required
                className="input"
                placeholder="e.g. Tata Power / Infosys / Larsen & Toubro"
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Corporate Work Email</label>
              <input
                type="email"
                required
                className="input"
                placeholder="lead@company.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">We will send a 6-digit verification code to this address.</p>
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
              <label className="label">Contact Person</label>
              <input
                required
                className="input"
                placeholder="Full Name"
                value={form.contactPerson}
                onChange={(e) => update("contactPerson", e.target.value)}
              />
            </div>

            <div>
              <label className="label">Designation / Role</label>
              <input
                required
                className="input"
                placeholder="e.g. CSR Director / R&D Lead"
                value={form.designation}
                onChange={(e) => update("designation", e.target.value)}
              />
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                required
                className="input"
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>

            <div>
              <label className="label">Industry Sector</label>
              <select
                className="input"
                value={form.sector}
                onChange={(e) => update("sector", e.target.value)}
              >
                {INDUSTRY_SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">City</label>
              <input
                required
                className="input"
                placeholder="e.g. Bengaluru"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </div>

            <div>
              <label className="label">State</label>
              <input
                required
                className="input"
                placeholder="e.g. Karnataka"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Company Website (Optional)</label>
              <input
                className="input"
                placeholder="https://company.com"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-600 transition disabled:opacity-50"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Sending Verification Code..." : "Send Verification Code"}
          </button>

          <p className="text-sm text-center text-slate-500">
            Already registered?{" "}
            <Link to="/industry/login" className="text-amber-700 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default IRegister;
