import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-65px)]">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
