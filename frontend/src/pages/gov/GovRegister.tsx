import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { govAuthService } from '../../services/govAuthService';
import { DEPARTMENTS, DESIGNATIONS, GovRegisterFormData } from '../../types/government';

export default function GovRegister() {
  const [formData, setFormData] = useState<GovRegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: DEPARTMENTS[0],
    designation: DESIGNATIONS[0],
    jurisdiction_city: '',
    jurisdiction_state: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await govAuthService.sendOtp(formData.email);
      showToast('OTP sent to your email', 'success');
      navigate('/government/verify-otp', { state: { email: formData.email, formData } });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to initiate registration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-md">
            <Landmark size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2 text-center">
            Create your Government Account
          </h1>
          <p className="text-slate-500 text-sm font-medium text-center">
            Register to monitor and resolve civic issues in your jurisdiction
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 md:p-8 shadow-xl shadow-emerald-900/5 border-emerald-100/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="label">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input focus:ring-emerald-500" required />
            </div>
            <div>
              <label className="label">Official Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input focus:ring-emerald-500" placeholder="name@gov.in" required />
            </div>
            
            <div>
              <label className="label">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="input focus:ring-emerald-500" required />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input focus:ring-emerald-500" required />
            </div>

            <div>
              <label className="label">Department</label>
              <select name="department" value={formData.department} onChange={handleChange} className="input focus:ring-emerald-500 bg-white" required>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Designation</label>
              <select name="designation" value={formData.designation} onChange={handleChange} className="input focus:ring-emerald-500 bg-white" required>
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Jurisdiction City</label>
              <input type="text" name="jurisdiction_city" value={formData.jurisdiction_city} onChange={handleChange} className="input focus:ring-emerald-500" required />
            </div>
            <div>
              <label className="label">Jurisdiction State</label>
              <input type="text" name="jurisdiction_state" value={formData.jurisdiction_state} onChange={handleChange} className="input focus:ring-emerald-500" required />
            </div>
            
            <div className="md:col-span-2">
              <label className="label">Phone Number (Optional)</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input focus:ring-emerald-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Continue to Verification'}
          </button>
          
          <div className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/government/login" className="font-bold text-emerald-600 hover:text-emerald-700">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
