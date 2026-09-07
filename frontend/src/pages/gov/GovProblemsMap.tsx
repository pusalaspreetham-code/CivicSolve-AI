import React, { useEffect, useState } from 'react';
import { govProblemService } from '../../services/govProblemService';
import ProblemMap from '../../components/ProblemMap';
import { Loader2, Filter } from 'lucide-react';

export default function GovProblemsMap() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ severity: '', domain: '' });

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const data = await govProblemService.getProblems(
          filters.severity || filters.domain ? filters : undefined
        );
        setProblems(data);
      } catch (error) {
        console.error('Failed to fetch problems for map', error);
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Geographic Overview</h1>
          <p className="text-slate-500 font-medium mt-1">Map of reported issues in your jurisdiction</p>
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
              name="domain"
              value={filters.domain}
              onChange={handleFilterChange}
              className="input bg-white pl-9 text-sm focus:ring-emerald-500 appearance-none pr-8 w-full"
            >
              <option value="">All Domains</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Water">Water</option>
              <option value="Electricity">Electricity</option>
            </select>
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="card flex-1 overflow-hidden relative shadow-sm border-slate-200">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          </div>
        ) : null}
        <ProblemMap markers={(problems || []).map(p => ({
          location: { latitude: p.latitude || p.locations?.[0]?.latitude, longitude: p.longitude || p.locations?.[0]?.longitude },
          title: p.title || p.problem_title,
          severity: p.severity,
          problemId: p.id
        })).filter(m => m.location.latitude)} />
      </div>
    </div>
  );
}
