import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const AdminUserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState<'REJECT' | 'SUSPEND' | null>(null);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getGovUser(id!);
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      showToast('Failed to fetch user details', 'error');
      navigate('/admin/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this user?')) return;
    
    setIsSubmitting(true);
    try {
      const data = await adminService.approveGovUser(id!);
      if (data.success) {
        showToast('User approved successfully', 'success');
        navigate('/admin/dashboard');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to approve user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionWithReason = async () => {
    if (actionReason.length < 10) {
      showToast('Reason must be at least 10 characters long', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (showReasonInput === 'REJECT') {
        const data = await adminService.rejectGovUser(id!, actionReason);
        if (data.success) showToast('User rejected successfully', 'success');
      } else if (showReasonInput === 'SUSPEND') {
        const data = await adminService.suspendGovUser(id!, actionReason);
        if (data.success) showToast('User suspended successfully', 'success');
      }
      navigate('/admin/dashboard');
    } catch (error: any) {
      showToast(error.response?.data?.message || `Failed to ${showReasonInput.toLowerCase()} user`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-white">
            <h3 className="text-xl leading-6 font-medium text-gray-900">
              Government User Application
            </h3>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
              ${user.account_status === 'PENDING' ? 'bg-amber-100 text-amber-800' : ''}
              ${user.account_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : ''}
              ${user.account_status === 'REJECTED' ? 'bg-red-100 text-red-800' : ''}
              ${user.account_status === 'SUSPENDED' ? 'bg-slate-100 text-slate-800' : ''}
            `}>
              {user.account_status}
            </span>
          </div>
          
          <div className="px-6 py-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.phone}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Employee ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.employee_id}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.department}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Designation</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.designation}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Jurisdiction City</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.jurisdiction_city || 'N/A'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Jurisdiction State</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.jurisdiction_state}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Office Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.office_address}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Justification</dt>
                <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-4 rounded-md border border-gray-100">
                  {user.justification}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Application Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(user.created_at).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
            {showReasonInput ? (
              <div className="flex-1 mr-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for {showReasonInput.toLowerCase()} (min 10 chars)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={`Please provide a reason...`}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowReasonInput(null);
                      setActionReason('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleActionWithReason}
                    disabled={isSubmitting}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white flex items-center
                      ${showReasonInput === 'REJECT' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}
                      disabled:opacity-50`}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Confirm {showReasonInput}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {(user.account_status === 'PENDING' || user.account_status === 'REJECTED' || user.account_status === 'SUSPENDED') && (
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none flex items-center disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                )}
                
                {user.account_status === 'PENDING' && (
                  <button
                    onClick={() => setShowReasonInput('REJECT')}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none flex items-center disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                )}
                
                {user.account_status === 'APPROVED' && (
                  <button
                    onClick={() => setShowReasonInput('SUSPEND')}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none flex items-center disabled:opacity-50"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Suspend
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
