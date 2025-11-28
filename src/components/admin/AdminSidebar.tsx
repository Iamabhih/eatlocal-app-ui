import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Truck,
  BarChart3,
  Megaphone,
  DollarSign,
  FileText,
  ShieldCheck,
  Settings,
  Rocket,
  Hotel,
  Building2,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface AdminSidebarProps {
  isSuperadmin?: boolean;
}

const adminItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Restaurants', url: '/admin/restaurants', icon: Store },
  { title: 'Hotels', url: '/admin/hotels', icon: Hotel },
  { title: 'Venues', url: '/admin/venues', icon: Building2 },
  { title: 'Orders', url: '/admin/orders', icon: Package },
  { title: 'Delivery Partners', url: '/admin/delivery-partners', icon: Truck },
  { title: 'Revenue', url: '/admin/revenue', icon: DollarSign },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Marketing', url: '/admin/marketing', icon: Megaphone },
  { title: 'System Logs', url: '/admin/logs', icon: FileText },
  { title: 'Launch Checklist', url: '/admin/launch-checklist', icon: Rocket },
];

const superadminItems = [
  { title: 'Super Admin', url: '/admin/superadmin', icon: ShieldCheck },
  { title: 'Platform Settings', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar({ isSuperadmin = false }: AdminSidebarProps) {
  const { state } = useSidebar();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-muted text-primary font-medium' : 'hover:bg-muted/50';

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-60'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {state !== 'collapsed' && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperadmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary">Super Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superadminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end className={getNavCls}>
                        <item.icon className="mr-2 h-4 w-4 text-primary" />
                        {state !== 'collapsed' && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
