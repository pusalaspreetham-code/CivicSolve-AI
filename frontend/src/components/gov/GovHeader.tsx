import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Landmark, Menu, X, LayoutDashboard, ListChecks, Map, User, LogOut } from 'lucide-react';
import { useGovAuth } from '../../context/GovAuthContext';

export default function GovHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, govUser } = useGovAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/government/login');
  };

  const navItems = [
    { to: '/government/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/government/problems', icon: ListChecks, label: 'Problems' },
    { to: '/government/problems/map', icon: Map, label: 'Problem Map' },
    { to: '/government/profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center">
              <Landmark size={18} />
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-none">CivicSolve AI</div>
              <div className="text-[10px] font-semibold text-emerald-600 tracking-wider uppercase mt-0.5">Government</div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm mt-16">
          <div className="bg-white h-full w-64 shadow-xl flex flex-col absolute right-0">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                {govUser?.name?.charAt(0) || 'G'}
              </div>
              <div className="overflow-hidden">
                <div className="font-medium text-slate-900 truncate">{govUser?.name}</div>
                <div className="text-xs text-slate-500 truncate">{govUser?.department}</div>
              </div>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 w-full transition-colors"
              >
                <LogOut size={18} />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
