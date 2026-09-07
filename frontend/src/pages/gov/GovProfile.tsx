import React, { useState } from 'react';
import { useGovAuth } from '../../context/GovAuthContext';
import { govService } from '../../services/govService';
import { useToast } from '../../context/ToastContext';
import { Loader2, ShieldCheck, User } from 'lucide-react';
import { DESIGNATIONS } from '../../types/government';

export default function GovProfile() {
  const { govUser, refreshGovUser } = useGovAuth();
  const { showToast } = useToast();

  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: govUser?.name || '',
    designation: govUser?.designation || '',
    jurisdiction_city: govUser?.jurisdiction_city || '',
    jurisdiction_state: govUser?.jurisdiction_state || '',
    phone: govUser?.phone || '',
  });

  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await govService.updateMe(profileForm);
      await refreshGovUser();
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePwdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setIsChangingPwd(true);
    try {
      await govService.changePassword(
        pwdForm.currentPassword,
        pwdForm.newPassword,
        pwdForm.confirmPassword
      );
      showToast('Password changed successfully', 'success');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setIsChangingPwd(false);
    }
  };

  if (!govUser) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Government Profile</h1>
        <p className="text-slate-500 font-medium mt-1">Manage your official account settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <User className="h-6 w-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="input focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="label">Official Email</label>
                  <input
                    type="email"
                    value={govUser.email}
                    disabled
                    className="input bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed.</p>
                </div>
                
                <div>
                  <label className="label">Department</label>
                  <input
                    type="text"
                    value={govUser.department}
                    disabled
                    className="input bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="label">Designation</label>
                  <select
                    value={profileForm.designation}
                    onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                    className="input focus:ring-emerald-500 bg-white"
                  >
                    {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label">Jurisdiction City</label>
                  <input
                    type="text"
                    value={profileForm.jurisdiction_city}
                    onChange={(e) => setProfileForm({ ...profileForm, jurisdiction_city: e.target.value })}
                    className="input focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="label">Jurisdiction State</label>
                  <input
                    type="text"
                    value={profileForm.jurisdiction_state}
                    onChange={(e) => setProfileForm({ ...profileForm, jurisdiction_state: e.target.value })}
                    className="input focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="input focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-colors bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                  {isUpdating ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Security</h2>
            </div>
            
            <form onSubmit={handlePwdSubmit} className="space-y-4">
              <div>
                <label className="label text-xs">Current Password</label>
                <input
                  type="password"
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  className="input focus:ring-emerald-500 text-sm py-1.5"
                  required
                />
              </div>
              <div>
                <label className="label text-xs">New Password</label>
                <input
                  type="password"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  className="input focus:ring-emerald-500 text-sm py-1.5"
                  required
                />
              </div>
              <div>
                <label className="label text-xs">Confirm New Password</label>
                <input
                  type="password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  className="input focus:ring-emerald-500 text-sm py-1.5"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isChangingPwd}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isChangingPwd ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
              </button>
            </form>
          </div>
          
          <div className="card p-6 bg-emerald-50/50 border-emerald-100">
            <h3 className="text-sm font-bold text-emerald-900 mb-2">Account Status</h3>
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Government Official</span>
            </div>
            <p className="text-xs text-emerald-600/80 mt-2">
              Joined {new Date(govUser.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
