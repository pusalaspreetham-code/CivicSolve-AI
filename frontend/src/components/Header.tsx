import { Menu, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const navItems = [
  { to: "/student/dashboard", label: "Dashboard" },
  { to: "/student/problems", label: "Problems" },
  { to: "/student/problems/map", label: "Problem Map" },
  { to: "/student/my-problems", label: "My Problems" },
  { to: "/student/profile", label: "Profile" },
];

// Mobile top bar with a slide-down menu (Sidebar handles desktop nav)
const Header = () => {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast("You have been logged out.", "success");
    navigate("/student/login");
  };

  return (
    <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-brand-600 text-white flex items-center justify-center">
            <ShieldCheck size={16} />
          </div>
          <span className="font-semibold text-slate-900 text-sm">CivicSolve AI</span>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="p-2 text-slate-600">
          <Menu size={20} />
        </button>
      </div>
      {open && (
        <div className="px-4 pb-3 flex flex-col gap-1 border-t border-slate-100 pt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
