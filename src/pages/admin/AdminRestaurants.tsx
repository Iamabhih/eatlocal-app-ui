import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminData } from '@/hooks/useAdminData';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useOutletContext } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminRestaurants() {
  const { isSuperadmin } = useOutletContext<{ isSuperadmin: boolean }>();
  const { restaurants, restaurantsLoading, updateRestaurant } = useAdminData();

  const toggleRestaurantStatus = (restaurantId: string, currentStatus: boolean) => {
    updateRestaurant({ restaurantId, updates: { is_active: !currentStatus } });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar isSuperadmin={isSuperadmin} />
        
        <div className="flex-1">
          <header className="h-16 border-b flex items-center px-6">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold ml-4">Restaurant Management</h1>
          </header>

          <main className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>All Restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                {restaurantsLoading ? (
                  <p className="text-center py-4">Loading restaurants...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Cuisine</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restaurants.map((restaurant) => (
                        <TableRow key={restaurant.id}>
                          <TableCell className="font-medium">{restaurant.name}</TableCell>
                          <TableCell>{restaurant.cuisine_type || 'N/A'}</TableCell>
                          <TableCell>{restaurant.city}</TableCell>
                          <TableCell>
                            <Badge variant={restaurant.is_active ? 'default' : 'secondary'}>
                              {restaurant.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{Number(restaurant.rating).toFixed(1)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRestaurantStatus(restaurant.id, restaurant.is_active)}
                            >
                              {restaurant.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
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
