import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Loader2 } from "lucide-react";
import { UniversityRegisterFormData } from "../../types/university";
import * as universityAuthService from "../../services/universityAuthService";
import { useToast } from "../../context/ToastContext";

const emptyForm: UniversityRegisterFormData = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  contactPerson: "",
  phone: "",
  city: "",
  state: "",
};

const URegister = () => {
  const [form, setForm] = useState<UniversityRegisterFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const update = (key: keyof UniversityRegisterFormData, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email.toLowerCase().trim().endsWith(".edu.in")) {
      setError('Your official university email must end with ".edu.in" (e.g. admin@yourcollege.edu.in).');
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
      await universityAuthService.sendOtp(form.email);
      showToast("Verification code sent to your institutional email.", "success");
      navigate("/university/verify-otp", { state: { form } });
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
          <div className="h-12 w-12 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-3">
            <Building2 size={24} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Register your University portal</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Track your students' civic engagement across CivicSolve's problem network
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">University / Institution Name</label>
              <input required className="input" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Official Institutional Email</label>
              <input
                type="email"
                required
                className="input"
                placeholder="admin@yourcollege.edu.in"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">Must end with .edu.in — used to verify and link your students.</p>
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
                value={form.contactPerson}
                onChange={(e) => update("contactPerson", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input required className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <label className="label">City</label>
              <input required className="input" value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div>
              <label className="label">State</label>
              <input required className="input" value={form.state} onChange={(e) => update("state", e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Sending OTP..." : "Send OTP"}
          </button>

          <p className="text-sm text-center text-slate-500">
            Already registered?{" "}
            <Link to="/university/login" className="text-violet-600 font-medium">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default URegister;
