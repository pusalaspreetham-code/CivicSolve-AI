import React, { useEffect, useState } from 'react';
import { govProblemService } from '../../services/govProblemService';
import GovProblemCard from '../../components/gov/GovProblemCard';
import { Loader2, Search, Filter } from 'lucide-react';

export default function GovProblems() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ severity: '', actionStatus: '' });

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const data = await govProblemService.getProblems(
          filters.severity || filters.actionStatus ? filters : undefined
        );
        setProblems(data);
      } catch (error) {
        console.error('Failed to fetch problems', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Problems in Your Department</h1>
          <p className="text-slate-500 font-medium mt-1">Manage and respond to citizen reports</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <select
              name="severity"
              value={filters.severity}
              onChange={handleFilterChange}
              className="input bg-white pl-9 text-sm focus:ring-emerald-500 appearance-none pr-8 w-full"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          
          <div className="relative flex-1 sm:flex-none">
            <select
              name="actionStatus"
              value={filters.actionStatus}
              onChange={handleFilterChange}
              className="input bg-white pl-9 text-sm focus:ring-emerald-500 appearance-none pr-8 w-full"
            >
              <option value="">All Statuses</option>
              <option value="NO_ACTION">No Action</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BUDGET_ALLOCATED">Budget Allocated</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        </div>
      ) : problems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
          {problems.map((problem) => (
            <GovProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center bg-slate-50 border-dashed border-2">
          <Search className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No problems found</h3>
          <p className="text-slate-500 mt-1">Try adjusting your filters or check back later.</p>
        </div>
      )}
    </div>
  );
}
