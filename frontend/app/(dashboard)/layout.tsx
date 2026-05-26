import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#050505]">
      <Sidebar />
      <main className="flex-1 md:ml-64 ml-0 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
