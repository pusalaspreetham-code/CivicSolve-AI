import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Landmark, LayoutDashboard, ListChecks, Map, User, LogOut } from 'lucide-react';
import { useGovAuth } from '../../context/GovAuthContext';

export default function GovSidebar() {
  const { logout } = useGovAuth();
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
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 left-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
            <Landmark size={20} />
          </div>
          <div>
            <div className="font-bold text-slate-900 leading-tight">CivicSolve AI</div>
            <div className="text-xs font-semibold text-emerald-600 tracking-wider uppercase">Government</div>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
      </div>

      <div className="mt-auto p-6 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 w-full transition-colors"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </div>
  );
}
