import React from 'react';
import { Building2, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-950 border border-slate-700 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="text-white font-bold text-base">
                Civic<span className="text-orange-400">Solve</span>
              </div>
              <p className="text-slate-400 text-xs">
                Open citizen challenge infrastructure for cross-sector public problem solving.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-300">
            <span className="hover:text-white cursor-pointer transition-colors">Citizen Charter</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Municipal API Docs</span>
            <span className="hover:text-white cursor-pointer transition-colors">Research Consortia</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>
            © {new Date().getFullYear()} CivicSolve Platform Initiative. Module: Citizen Problem Submission (Frontend v1.0).
          </p>
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted Civic Intake Standard</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
