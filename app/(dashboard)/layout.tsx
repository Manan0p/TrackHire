import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { GlobalDialogs } from "@/components/layout/GlobalDialogs";
import { Providers } from "@/app/providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden bg-[var(--background)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
        <GlobalDialogs />
      </div>
    </Providers>
  );
}
