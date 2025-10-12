import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DeliverySidebar } from "./DeliverySidebar";

export function DeliveryLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DeliverySidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
