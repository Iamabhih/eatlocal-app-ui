import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Hotel,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  MapPin,
  Building2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { propertyTypeLabels, Hotel as HotelType } from '@/hooks/useHotels';

export default function AdminHotels() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedHotel, setSelectedHotel] = useState<HotelType | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Fetch all hotels
  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['admin-hotels', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HotelType[];
    },
  });

  // Fetch hotel stats
  const { data: stats } = useQuery({
    queryKey: ['admin-hotel-stats'],
    queryFn: async () => {
      const [
        { count: totalHotels },
        { count: pendingHotels },
        { count: verifiedHotels },
        { count: totalBookings },
      ] = await Promise.all([
        supabase.from('hotels').select('*', { count: 'exact', head: true }),
        supabase.from('hotels').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('hotels').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        supabase.from('hotel_bookings').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalHotels: totalHotels || 0,
        pendingHotels: pendingHotels || 0,
        verifiedHotels: verifiedHotels || 0,
        totalBookings: totalBookings || 0,
      };
    },
  });

  // Update hotel verification status
  const updateVerification = useMutation({
    mutationFn: async ({ hotelId, status }: { hotelId: string; status: string }) => {
      const { error } = await supabase
        .from('hotels')
        .update({ verification_status: status })
        .eq('id', hotelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
      queryClient.invalidateQueries({ queryKey: ['admin-hotel-stats'] });
      toast.success('Hotel status updated');
    },
    onError: () => {
      toast.error('Failed to update hotel status');
    },
  });

  // Toggle hotel active status
  const toggleActive = useMutation({
    mutationFn: async ({ hotelId, isActive }: { hotelId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('hotels')
        .update({ is_active: isActive })
        .eq('id', hotelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
      toast.success('Hotel status updated');
    },
    onError: () => {
      toast.error('Failed to update hotel');
    },
  });

  // Toggle featured status
  const toggleFeatured = useMutation({
    mutationFn: async ({ hotelId, isFeatured }: { hotelId: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from('hotels')
        .update({ is_featured: isFeatured })
        .eq('id', hotelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
      toast.success('Featured status updated');
    },
    onError: () => {
      toast.error('Failed to update featured status');
    },
  });

  const filteredHotels = hotels.filter((hotel) =>
    hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hotel.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      verified: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return <Badge className={styles[status] || styles.pending}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Hotel className="h-8 w-8" />
          Hotel Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage hotel listings, verifications, and bookings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hotels</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHotels || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingHotels || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified Hotels</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.verifiedHotels || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>All Hotels</CardTitle>
              <CardDescription>
                {filteredHotels.length} hotels found
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hotels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading hotels...</div>
          ) : filteredHotels.length === 0 ? (
            <div className="text-center py-12">
              <Hotel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Hotels Found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'No hotels have been registered yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHotels.map((hotel) => (
                  <TableRow key={hotel.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={hotel.main_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100'}
                          alt={hotel.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{hotel.name}</p>
                          {hotel.is_featured && (
                            <Badge variant="secondary" className="text-xs">Featured</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {hotel.city}, {hotel.country}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {propertyTypeLabels[hotel.property_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{hotel.total_rooms}</TableCell>
                    <TableCell>
                      {hotel.rating > 0 ? (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {hotel.rating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(hotel.verification_status)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          hotel.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }
                      >
                        {hotel.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedHotel(hotel);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {hotel.verification_status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateVerification.mutate({
                                    hotelId: hotel.id,
                                    status: 'verified',
                                  })
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateVerification.mutate({
                                    hotelId: hotel.id,
                                    status: 'rejected',
                                  })
                                }
                              >
                                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              toggleFeatured.mutate({
                                hotelId: hotel.id,
                                isFeatured: !hotel.is_featured,
                              })
                            }
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {hotel.is_featured ? 'Remove Featured' : 'Mark Featured'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleActive.mutate({
                                hotelId: hotel.id,
                                isActive: !hotel.is_active,
                              })
                            }
                          >
                            {hotel.is_active ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hotel Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hotel Details</DialogTitle>
            <DialogDescription>
              View and manage hotel information
            </DialogDescription>
          </DialogHeader>

          {selectedHotel && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={selectedHotel.main_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200'}
                  alt={selectedHotel.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedHotel.name}</h3>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {selectedHotel.street_address}, {selectedHotel.city}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">
                      {propertyTypeLabels[selectedHotel.property_type]}
                    </Badge>
                    {getStatusBadge(selectedHotel.verification_status)}
                    {selectedHotel.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p>{selectedHotel.email}</p>
                  <p>{selectedHotel.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rooms & Pricing</p>
                  <p>{selectedHotel.total_rooms} total rooms</p>
                  <p>From R{selectedHotel.base_price}/night</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-in/out</p>
                  <p>In: {selectedHotel.check_in_time}</p>
                  <p>Out: {selectedHotel.check_out_time}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stats</p>
                  <p className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {selectedHotel.rating.toFixed(1)} ({selectedHotel.total_reviews} reviews)
                  </p>
                </div>
              </div>

              {selectedHotel.description && (
                <div>
                  <p className="text-muted-foreground text-sm">Description</p>
                  <p className="text-sm mt-1">{selectedHotel.description}</p>
                </div>
              )}

              {selectedHotel.amenities.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedHotel.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
            {selectedHotel?.verification_status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    updateVerification.mutate({
                      hotelId: selectedHotel.id,
                      status: 'rejected',
                    });
                    setShowDetailDialog(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    updateVerification.mutate({
                      hotelId: selectedHotel.id,
                      status: 'verified',
                    });
                    setShowDetailDialog(false);
                  }}
                >
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
