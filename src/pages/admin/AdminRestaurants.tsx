import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminData } from '@/hooks/useAdminData';
import { useState } from 'react';

export default function AdminRestaurants() {
  const { restaurants, restaurantsLoading, updateRestaurant } = useAdminData();
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionValue, setCommissionValue] = useState<string>('');

  const handleEditCommission = (restaurantId: string, currentRate: number) => {
    setEditingCommission(restaurantId);
    setCommissionValue(currentRate.toString());
  };

  const handleSaveCommission = async (restaurantId: string) => {
    const rate = parseFloat(commissionValue);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return;
    }
    await updateRestaurant({
      restaurantId,
      updates: {
        commission_rate: rate,
        custom_commission: rate !== 15.00,
      },
    });
    setEditingCommission(null);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6 bg-muted/30">
            <h1 className="text-3xl font-bold mb-6">Restaurant Management</h1>

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
                        <TableHead>Phone</TableHead>
                        <TableHead>Cuisine</TableHead>
                        <TableHead>Commission Rate</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restaurants.map((restaurant) => (
                        <TableRow key={restaurant.id}>
                          <TableCell className="font-medium">{restaurant.name}</TableCell>
                          <TableCell>{restaurant.phone}</TableCell>
                          <TableCell>{restaurant.cuisine_type || 'N/A'}</TableCell>
                          <TableCell>
                            {editingCommission === restaurant.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  value={commissionValue}
                                  onChange={(e) => setCommissionValue(e.target.value)}
                                  className="w-20"
                                />
                                <span>%</span>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSaveCommission(restaurant.id)}
                                >
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingCommission(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{restaurant.commission_rate}%</span>
                                {restaurant.custom_commission && (
                                  <Badge variant="outline">Custom</Badge>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleEditCommission(restaurant.id, restaurant.commission_rate)}
                                >
                                  Edit
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                              {restaurant.is_active ? "Active" : "Inactive"}
                            </Badge>
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
