import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Compass, Briefcase, LogOut, Wrench, MessageSquare } from "lucide-react";
import { useIndustryAuth } from "../context/IndustryAuthContext";
import { useToast } from "../context/ToastContext";

const navItems = [
  { to: "/industry/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/industry/problems", label: "Explore Problems", icon: Compass },
  { to: "/industry/adoptions", label: "Adopted Projects", icon: Briefcase },
  { to: "/industry/messages", label: "Messages", icon: MessageSquare },
];

const IndustryLayout = () => {
  const { industry, logout } = useIndustryAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast("You have been logged out.", "success");
    navigate("/industry/login");
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-200">
          <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Wrench size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">CivicSolve AI</span>
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Industry Portal</span>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 bg-amber-50/50">
          <p className="text-xs font-semibold text-slate-900 truncate">{industry?.company_name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
            {industry?.sector}
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-slate-200 bg-white px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
          <div className="md:hidden flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Wrench size={15} />
            </div>
            <span className="font-bold text-sm text-slate-900">Industry Portal</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span>Official Domain:</span>
            <span className="font-mono font-medium text-slate-800">@{industry?.domain}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900 leading-tight">{industry?.contact_person}</p>
              <p className="text-xs text-slate-500">{industry?.designation}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-black text-amber-700">
              {industry?.company_name?.charAt(0) || "I"}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default IndustryLayout;
