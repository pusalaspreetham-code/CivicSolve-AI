import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ListChecks, Globe2, Map, ClipboardList, User, LogOut, ShieldCheck, Users } from "lucide-react";import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const navItems = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/problems", label: "Problems", icon: ListChecks },
  { to: "/student/problems/all", label: "All Problems", icon: Globe2 },
  { to: "/student/problems/map", label: "Problem Map", icon: Map },
  { to: "/student/my-problems", label: "My Problems", icon: ClipboardList },
  { to: "/student/my-teams", label: "My Teams", icon: Users },
  { to: "/student/profile", label: "Profile", icon: User },
];

const Sidebar = () => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast("You have been logged out.", "success");
    navigate("/student/login");
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-200">
        <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
          <ShieldCheck size={18} />
        </div>
        <span className="font-semibold text-slate-900">CivicSolve AI</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/student/problems"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
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
  );
};

export default Sidebar;
