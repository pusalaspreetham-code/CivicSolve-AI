import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGovAuth } from '../../context/GovAuthContext';
import { govProblemService } from '../../services/govProblemService';
import { DashboardStats } from '../../types/government';
import { ListChecks, AlertTriangle, ClipboardList, CheckCircle2, Loader2, ClipboardCheck, ArrowRight } from 'lucide-react';
import GovProblemCard from '../../components/gov/GovProblemCard';

export default function GovDashboard() {
  const { govUser } = useGovAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [highPriorityProblems, setHighPriorityProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, problemsData] = await Promise.all([
          govProblemService.getDashboardStats(),
          govProblemService.getProblems()
        ]);
        setStats(statsData);
        setHighPriorityProblems(problemsData.slice(0, 6)); // Top 6 by priority
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome, {govUser?.name}</h1>
        <p className="text-slate-500 font-medium mt-1">
          {govUser?.department} • {govUser?.jurisdiction_city}, {govUser?.jurisdiction_state}
        </p>
      </div>

      {!!stats?.pending_approval && (
        <Link
          to="/government/approvals"
          className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-600 text-white px-6 py-4 shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <p className="font-bold">{stats.pending_approval} problem{stats.pending_approval > 1 ? 's' : ''} waiting on your review</p>
              <p className="text-sm text-emerald-50">These stay hidden from students until you approve them.</p>
            </div>
          </div>
          <ArrowRight size={20} />
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Problems', value: stats?.total_problems || 0, icon: ListChecks, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Approval', value: stats?.pending_approval || 0, icon: ClipboardCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'High Priority', value: stats?.high_priority || 0, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Actions Taken', value: stats?.actions_taken || 0, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Resolved', value: stats?.problems_resolved || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                <p className="text-sm font-semibold text-slate-500 mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Top Priority Issues</h2>
        </div>
        
        {highPriorityProblems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highPriorityProblems.map(p => (
              <GovProblemCard key={p.id} problem={p} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center bg-slate-50 border-dashed border-2">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-900">All clear</h3>
            <p className="text-slate-500 mt-1">No high priority problems in your jurisdiction.</p>
          </div>
        )}
      </div>
    </div>
  );
}
