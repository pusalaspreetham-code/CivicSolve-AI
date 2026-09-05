import { useState, useEffect, FormEvent } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Building2, Loader2 } from "lucide-react";
import * as universityAuthService from "../../services/universityAuthService";
import { useToast } from "../../context/ToastContext";
import { UniversityRegisterFormData } from "../../types/university";

const RESEND_COOLDOWN = 60;

const UVerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const form = (location.state as { form?: UniversityRegisterFormData })?.form;

  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!form) {
    return <Navigate to="/university/register" replace />;
  }

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }
    setSubmitting(true);
    try {
      await universityAuthService.registerUniversity(form, otp);
      showToast("University portal created! Please log in.", "success");
      navigate("/university/login");
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResending(true);
    try {
      await universityAuthService.sendOtp(form.email);
      showToast("A new code has been sent.", "success");
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err.message || "Could not resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-3">
            <Building2 size={24} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Verify your institutional email</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            We sent a 6-digit code to <span className="font-medium text-slate-700">{form.email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="card p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <div>
            <label className="label">Verification Code</label>
            <input
              className="input tracking-[0.5em] text-center text-lg"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Verifying..." : "Verify & Create Portal"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="btn-secondary w-full"
          >
            {resending ? "Resending..." : cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend Code"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UVerifyOtp;
