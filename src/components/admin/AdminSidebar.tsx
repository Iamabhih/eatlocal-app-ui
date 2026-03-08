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

const overviewItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Revenue', url: '/admin/revenue', icon: DollarSign },
];

const operationsItems = [
  { title: 'Orders', url: '/admin/orders', icon: Package },
  { title: 'Restaurants', url: '/admin/restaurants', icon: Store },
  { title: 'Hotels', url: '/admin/hotels', icon: Hotel },
  { title: 'Venues', url: '/admin/venues', icon: Building2 },
  { title: 'Delivery Partners', url: '/admin/delivery-partners', icon: Truck },
];

const managementItems = [
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Marketing', url: '/admin/marketing', icon: Megaphone },
];

const systemItems = [
  { title: 'System Logs', url: '/admin/logs', icon: FileText },
  { title: 'Launch Checklist', url: '/admin/launch-checklist', icon: Rocket },
];

const superadminItems = [
  { title: 'Super Admin', url: '/admin/superadmin', icon: ShieldCheck },
  { title: 'Platform Settings', url: '/admin/settings', icon: Settings },
];

const getNavCls = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50';

function NavGroup({ label, items, collapsed }: { label: string; items: typeof overviewItems; collapsed: boolean }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} end className={getNavCls}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AdminSidebar({ isSuperadmin = false }: AdminSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        {!collapsed && (
          <div className="h-16 flex items-center gap-3 px-6 border-b">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <div>
              <span className="font-display font-bold">Smash</span>
              <span className="text-primary text-xs ml-1">Admin</span>
            </div>
          </div>
        )}

        <NavGroup label="Overview" items={overviewItems} collapsed={collapsed} />
        <NavGroup label="Operations" items={operationsItems} collapsed={collapsed} />
        <NavGroup label="Management" items={managementItems} collapsed={collapsed} />
        <NavGroup label="System" items={systemItems} collapsed={collapsed} />

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
                        {!collapsed && <span>{item.title}</span>}
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
