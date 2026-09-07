import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Landmark, Loader2, Eye, EyeOff } from 'lucide-react';
import { useGovAuth } from '../../context/GovAuthContext';
import { useToast } from '../../context/ToastContext';
import { govAuthService } from '../../services/govAuthService';

export default function GovLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useGovAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const from = location.state?.from?.pathname || '/government/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const data = await govAuthService.login(email, password);
      login(data.token, data.user);
      showToast('Welcome back!', 'success');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log in');
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
            CivicSolve AI <span className="text-emerald-600">—</span> Government Portal
          </h1>
          <p className="text-slate-500 text-sm font-medium text-center">
            Log in to manage civic problems in your jurisdiction
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-5 shadow-xl shadow-emerald-900/5 border-emerald-100/50">
          {error && (
            <div className={`rounded-lg p-3 mb-1 text-sm font-medium ${
              error.includes('awaiting') ? 'bg-amber-50 border border-amber-200 text-amber-800' :
              error.includes('not approved') ? 'bg-red-50 border border-red-200 text-red-700' :
              error.includes('suspended') ? 'bg-slate-100 border border-slate-300 text-slate-700' :
              'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          <div>
            <label className="label">Official Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input focus:ring-emerald-500"
              placeholder="name@gov.in"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Password</label>
              <Link to="/government/forgot-password" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input focus:ring-emerald-500 pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Log in to Portal'}
          </button>
          
          <div className="text-center text-sm text-slate-500 mt-4">
            Don't have a government account?{' '}
            <Link to="/government/register" className="font-bold text-emerald-600 hover:text-emerald-700">
              Apply for access
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
