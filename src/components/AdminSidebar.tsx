import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardCheck,
  Bell,
  BarChart3,
  Award,
  Video,
  Settings,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { name: "Sessions", href: "/sessions", icon: Calendar },
  { name: "Participants", href: "/participants", icon: Users },
  { name: "Émargement", href: "/emargement", icon: ClipboardCheck },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Reporting", href: "/reporting", icon: BarChart3 },
  { name: "Attestations", href: "/attestations", icon: Award },
  { name: "Hybride", href: "/hybride", icon: Video },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar flex flex-col">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <span className="text-sidebar-primary-foreground font-bold text-sm">VDE</span>
        </div>
        <div>
          <h1 className="text-sidebar-foreground font-semibold text-sm">VDE Platform</h1>
          <p className="text-sidebar-muted text-xs">Gestion des sessions</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={isActive ? "sidebar-link-active" : "sidebar-link"}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <NavLink to="/settings" className="sidebar-link">
          <Settings className="w-4 h-4 shrink-0" />
          Paramètres
        </NavLink>
        <button className="sidebar-link w-full">
          <LogOut className="w-4 h-4 shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
