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
  UserCog,
  ExternalLink,
  FileText,
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
  { name: "Formulaires", href: "/admin/formulaires", icon: FileText },
  { name: "Utilisateurs", href: "/admin/utilisateurs", icon: UserCog },
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
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-sidebar flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border/50">
          <div className="w-10 h-10 rounded-xl bg-sidebar-accent flex items-center justify-center overflow-hidden">
            <img src={vdeLogo} alt="Agence CI Export" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sidebar-foreground font-bold text-sm tracking-tight">FORMATION</h1>
            <p className="text-sidebar-muted text-[11px] truncate max-w-[130px]">{user?.email}</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-muted hover:text-sidebar-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted/60">Menu principal</p>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={isActive ? "sidebar-link-active" : "sidebar-link"}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-sidebar-border/50 space-y-0.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link"
            onClick={handleNavClick}
          >
            <ExternalLink className="w-[18px] h-[18px] shrink-0" />
            Portail public
          </a>
          <NavLink to="/admin/settings" onClick={handleNavClick} className="sidebar-link">
            <Settings className="w-[18px] h-[18px] shrink-0" />
            Paramètres
          </NavLink>
          <button onClick={handleLogout} className="sidebar-link w-full text-destructive/80 hover:text-destructive">
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
