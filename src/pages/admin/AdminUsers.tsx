import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAdminData } from '@/hooks/useAdminData';

export default function AdminUsers() {
  const { users, usersLoading } = useAdminData();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6 bg-muted/30">
            <h1 className="text-3xl font-bold mb-6">User Management</h1>

            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-center py-4">Loading users...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.phone || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {user.user_roles && user.user_roles.length > 0 ? (
                                user.user_roles.map((userRole) => (
                                  <Badge key={userRole.role} variant="outline">
                                    {userRole.role}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="secondary">customer</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
