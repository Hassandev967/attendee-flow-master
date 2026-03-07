import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardCheck,
  BarChart3,
  Award,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import vdeLogo from "@/assets/vde-logo.png";

const navigation = [
  { name: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { name: "Formations", href: "/admin/sessions", icon: Calendar },
  { name: "Participants", href: "/admin/participants", icon: Users },
  { name: "Émargement", href: "/admin/emargement", icon: ClipboardCheck },
  { name: "Reporting", href: "/admin/reporting", icon: BarChart3 },
  { name: "Attestations", href: "/admin/attestations", icon: Award },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

const AdminSidebar = ({ open, onClose }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleNavClick = () => {
    onClose();
  };

  return (
    <>
      {/* Overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-sidebar flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <img src={vdeLogo} alt="Agence CI Export" className="w-9 h-9 rounded-lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sidebar-foreground font-semibold text-sm">FORMATION PLATEFORME</h1>
            <p className="text-sidebar-muted text-xs truncate max-w-[140px]">{user?.email}</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-muted hover:text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={isActive ? "sidebar-link-active" : "sidebar-link"}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          <NavLink to="/admin/settings" onClick={handleNavClick} className="sidebar-link">
            <Settings className="w-4 h-4 shrink-0" />
            Paramètres
          </NavLink>
          <button onClick={handleLogout} className="sidebar-link w-full">
            <LogOut className="w-4 h-4 shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
