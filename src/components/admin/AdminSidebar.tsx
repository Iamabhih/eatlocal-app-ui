import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  Truck,
  BarChart3,
  Settings,
  Shield
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

const adminItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Restaurants', url: '/admin/restaurants', icon: Store },
  { title: 'Orders', url: '/admin/orders', icon: Package },
  { title: 'Delivery Partners', url: '/admin/delivery-partners', icon: Truck },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
];

const superadminItems = [
  { title: 'System Settings', url: '/superadmin/settings', icon: Settings },
  { title: 'Role Management', url: '/superadmin/roles', icon: Shield },
];

interface AdminSidebarProps {
  isSuperadmin?: boolean;
}

export function AdminSidebar({ isSuperadmin }: AdminSidebarProps) {
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
            <SidebarGroupLabel>Superadmin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superadminItems.map((item) => (
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
        )}
      </SidebarContent>
    </Sidebar>
  );
}
