import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import type { UserRole } from "@/types/study";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar currentRole={currentRole} onRoleChange={setCurrentRole} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
