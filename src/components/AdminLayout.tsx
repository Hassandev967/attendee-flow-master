import { useState } from "react";
import { Menu, ChevronRight } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-64 min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border/40 px-4 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                <span>Administration</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">{title}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
