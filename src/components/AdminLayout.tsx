import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="ml-64">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-8 py-5">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
