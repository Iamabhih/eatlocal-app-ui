import { useState } from 'react';
import {
  Building2,
  Bed,
  Calendar,
  DollarSign,
  Users,
  Star,
  TrendingUp,
  Settings,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function HotelPartnerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch owner's hotels
  const { data: hotels = [], isLoading: hotelsLoading } = useQuery({
    queryKey: ['my-hotels', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('owner_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch bookings for owner's hotels
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-hotel-bookings-owner', user?.id],
    queryFn: async () => {
      if (!user || hotels.length === 0) return [];
      const hotelIds = hotels.map(h => h.id);
      const { data, error } = await supabase
        .from('hotel_bookings')
        .select(`
          *,
          hotel:hotels(name),
          room_type:room_types(name)
        `)
        .in('hotel_id', hotelIds)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user && hotels.length > 0,
  });

  // Update booking status
  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();
      if (status === 'checked_in') updates.checked_in_at = new Date().toISOString();
      if (status === 'checked_out') updates.checked_out_at = new Date().toISOString();

      const { error } = await supabase
        .from('hotel_bookings')
        .update(updates)
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-hotel-bookings-owner'] });
      toast({ title: 'Booking Updated', description: 'Booking status has been updated.' });
    },
  });

  // Calculate stats
  const stats = {
    totalHotels: hotels.length,
    totalRooms: hotels.reduce((sum, h) => sum + (h.total_rooms || 0), 0),
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.total || 0), 0),
    avgRating: hotels.length > 0
      ? hotels.reduce((sum, h) => sum + (h.rating || 0), 0) / hotels.length
      : 0,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      checked_in: { variant: 'default', label: 'Checked In' },
      checked_out: { variant: 'outline', label: 'Checked Out' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      no_show: { variant: 'destructive', label: 'No Show' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Hotel Partner Dashboard
              </h1>
              <p className="text-muted-foreground">Manage your properties and bookings</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">Properties</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalHotels}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Bed className="h-4 w-4" />
                <span className="text-sm">Total Rooms</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalRooms}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Bookings</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalBookings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Revenue</span>
              </div>
              <p className="text-2xl font-bold">R{stats.totalRevenue.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Star className="h-4 w-4" />
                <span className="text-sm">Avg Rating</span>
              </div>
              <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Latest reservation requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : bookings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No bookings yet</p>
                  ) : (
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{booking.guest_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.hotel?.name} • {new Date(booking.check_in_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(booking.status)}
                            <p className="text-sm font-medium mt-1">R{booking.total?.toFixed(0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Properties Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Properties</CardTitle>
                  <CardDescription>Manage your hotel listings</CardDescription>
                </CardHeader>
                <CardContent>
                  {hotelsLoading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : hotels.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No properties listed yet</p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Property
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hotels.map((hotel) => (
                        <div key={hotel.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <img
                            src={hotel.main_image || 'https://via.placeholder.com/80'}
                            alt={hotel.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{hotel.name}</p>
                            <p className="text-sm text-muted-foreground">{hotel.city}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={hotel.is_active ? 'default' : 'secondary'}>
                                {hotel.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              {hotel.rating > 0 && (
                                <span className="text-sm flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {hotel.rating}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>Manage your reservations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-sm">{booking.booking_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.guest_name}</p>
                            <p className="text-sm text-muted-foreground">{booking.guest_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{booking.hotel?.name}</p>
                            <p className="text-sm text-muted-foreground">{booking.room_type?.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{new Date(booking.check_in_date).toLocaleDateString()}</p>
                            <p className="text-muted-foreground">
                              to {new Date(booking.check_out_date).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">R{booking.total?.toFixed(0)}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {booking.status === 'pending' && (
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: 'confirmed' })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirm
                                </DropdownMenuItem>
                              )}
                              {booking.status === 'confirmed' && (
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: 'checked_in' })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Check In
                                </DropdownMenuItem>
                              )}
                              {booking.status === 'checked_in' && (
                                <DropdownMenuItem
                                  onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: 'checked_out' })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Check Out
                                </DropdownMenuItem>
                              )}
                              {['pending', 'confirmed'].includes(booking.status) && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => updateBookingStatus.mutate({ bookingId: booking.id, status: 'cancelled' })}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Properties</CardTitle>
                  <CardDescription>Manage your hotel listings</CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Property
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotels.map((hotel) => (
                    <Card key={hotel.id} className="overflow-hidden">
                      <img
                        src={hotel.main_image || 'https://via.placeholder.com/400x200'}
                        alt={hotel.name}
                        className="w-full h-40 object-cover"
                      />
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg">{hotel.name}</h3>
                        <p className="text-sm text-muted-foreground">{hotel.city}, {hotel.country}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={hotel.verification_status === 'verified' ? 'default' : 'secondary'}>
                            {hotel.verification_status}
                          </Badge>
                          <Badge variant="outline">{hotel.property_type}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm">
                            <span className="font-medium">{hotel.total_rooms}</span> rooms
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms">
            <Card>
              <CardHeader>
                <CardTitle>Room Management</CardTitle>
                <CardDescription>Manage room types and availability</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Select a property to manage rooms
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Availability Calendar</CardTitle>
                <CardDescription>View and manage availability across properties</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Calendar view coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
