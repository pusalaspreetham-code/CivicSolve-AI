import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, Building2 } from "lucide-react";
import { useUniversityAuth } from "../context/UniversityAuthContext";
import { useToast } from "../context/ToastContext";

const navItems = [
  { to: "/university/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/university/students", label: "Students", icon: Users },
];

const UniversityLayout = () => {
  const { university, logout } = useUniversityAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast("You have been logged out.", "success");
    navigate("/university/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-200">
          <div className="h-8 w-8 rounded-lg bg-violet-600 text-white flex items-center justify-center">
            <Building2 size={18} />
          </div>
          <div>
            <span className="font-semibold text-slate-900 block leading-tight">CivicSolve AI</span>
            <span className="text-xs text-slate-500">University Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50"
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
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="border-b border-slate-200 bg-white px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="md:hidden font-semibold text-slate-900">CivicSolve AI — University</div>
          <div className="ml-auto text-sm font-medium text-slate-700">{university?.name}</div>
        </header>
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UniversityLayout;
