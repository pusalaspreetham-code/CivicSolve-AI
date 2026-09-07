import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Landmark, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { govAuthService } from '../../services/govAuthService';

export default function GovVerifyOtp() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const email = location.state?.email;
  const formData = location.state?.formData;

  if (!email || !formData) {
    return <Navigate to="/government/register" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      showToast('Please enter a valid OTP', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await govAuthService.registerGovUser(formData, otp);
      showToast('Account verified! Please log in.', 'success');
      navigate('/government/login', { replace: true });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md">
            <Landmark size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2 text-center">
            Verify your identity
          </h1>
          <p className="text-slate-500 text-sm font-medium text-center">
            We've sent a code to <span className="font-bold text-slate-800">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-5 shadow-xl shadow-emerald-900/5 border-emerald-100/50">
          <div>
            <label className="label">Verification Code (OTP)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input pl-10 focus:ring-emerald-500 text-center tracking-[0.5em] font-bold text-lg"
                placeholder="000000"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Verify Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
