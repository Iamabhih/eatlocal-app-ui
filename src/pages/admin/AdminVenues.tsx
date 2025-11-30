import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  MapPin,
  Users,
  Calendar,
  Sparkles,
  DollarSign,
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
import { venueTypeLabels, Venue } from '@/hooks/useVenues';

export default function AdminVenues() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('venues');

  // Fetch all venues
  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['admin-venues', statusFilter, typeFilter],
    queryFn: async () => {
      let query = (supabase
        .from('venues' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any);

      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('venue_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return (data || []) as Venue[];
    },
  });

  // Fetch all experiences
  const { data: experiences = [], isLoading: experiencesLoading } = useQuery({
    queryKey: ['admin-experiences'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('experiences' as any)
        .select('*, venue:venues(id, name, city)')
        .order('created_at', { ascending: false }) as any);
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return data || [];
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin-venue-stats'],
    queryFn: async () => {
      const results = await Promise.allSettled([
        (supabase.from('venues' as any).select('*', { count: 'exact', head: true }) as any),
        (supabase.from('venues' as any).select('*', { count: 'exact', head: true }).eq('verification_status', 'pending') as any),
        (supabase.from('venues' as any).select('*', { count: 'exact', head: true }).eq('verification_status', 'verified') as any),
        (supabase.from('experiences' as any).select('*', { count: 'exact', head: true }) as any),
        (supabase.from('experience_bookings' as any).select('*', { count: 'exact', head: true }) as any),
      ]);

      const getCounts = (result: PromiseSettledResult<any>) => {
        if (result.status === 'fulfilled') return result.value?.count || 0;
        return 0;
      };

      return {
        totalVenues: getCounts(results[0]),
        pendingVenues: getCounts(results[1]),
        verifiedVenues: getCounts(results[2]),
        totalExperiences: getCounts(results[3]),
        totalBookings: getCounts(results[4]),
      };
    },
  });

  // Update venue verification status
  const updateVerification = useMutation({
    mutationFn: async ({ venueId, status }: { venueId: string; status: string }) => {
      const { error } = await (supabase
        .from('venues' as any)
        .update({ verification_status: status })
        .eq('id', venueId) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
      queryClient.invalidateQueries({ queryKey: ['admin-venue-stats'] });
      toast.success('Venue status updated');
    },
    onError: () => {
      toast.error('Failed to update venue status');
    },
  });

  // Toggle venue active status
  const toggleActive = useMutation({
    mutationFn: async ({ venueId, isActive }: { venueId: string; isActive: boolean }) => {
      const { error } = await (supabase
        .from('venues' as any)
        .update({ is_active: isActive })
        .eq('id', venueId) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
      toast.success('Venue status updated');
    },
    onError: () => {
      toast.error('Failed to update venue');
    },
  });

  // Toggle featured status
  const toggleFeatured = useMutation({
    mutationFn: async ({ venueId, isFeatured }: { venueId: string; isFeatured: boolean }) => {
      const { error } = await (supabase
        .from('venues' as any)
        .update({ is_featured: isFeatured })
        .eq('id', venueId) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
      toast.success('Featured status updated');
    },
    onError: () => {
      toast.error('Failed to update featured status');
    },
  });

  // Toggle experience active status
  const toggleExperienceActive = useMutation({
    mutationFn: async ({ experienceId, isActive }: { experienceId: string; isActive: boolean }) => {
      const { error } = await (supabase
        .from('experiences' as any)
        .update({ is_active: isActive })
        .eq('id', experienceId) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
      toast.success('Experience status updated');
    },
    onError: () => {
      toast.error('Failed to update experience');
    },
  });

  const filteredVenues = venues.filter((venue) =>
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.city.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Building2 className="h-8 w-8" />
          Venue & Experience Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage venue listings, experiences, and bookings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVenues || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingVenues || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.verifiedVenues || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Experiences</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.totalExperiences || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="experiences">Experiences</TabsTrigger>
        </TabsList>

        {/* Venues Tab */}
        <TabsContent value="venues">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>All Venues</CardTitle>
                  <CardDescription>
                    {filteredVenues.length} venues found
                  </CardDescription>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search venues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(venueTypeLabels).slice(0, 10).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {venuesLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading venues...</div>
              ) : filteredVenues.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Venues Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search' : 'No venues have been registered yet'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Venue</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVenues.map((venue) => (
                      <TableRow key={venue.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={venue.main_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100'}
                              alt={venue.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-medium">{venue.name}</p>
                              {venue.is_featured && (
                                <Badge variant="secondary" className="text-xs">Featured</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {venue.city}, {venue.country}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {venueTypeLabels[venue.venue_type] || venue.venue_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {venue.rating > 0 ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {venue.rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(venue.verification_status)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              venue.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }
                          >
                            {venue.is_active ? 'Active' : 'Inactive'}
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
                                  setSelectedVenue(venue);
                                  setShowDetailDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {venue.verification_status === 'pending' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateVerification.mutate({
                                        venueId: venue.id,
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
                                        venueId: venue.id,
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
                                    venueId: venue.id,
                                    isFeatured: !venue.is_featured,
                                  })
                                }
                              >
                                <Star className="h-4 w-4 mr-2" />
                                {venue.is_featured ? 'Remove Featured' : 'Mark Featured'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleActive.mutate({
                                    venueId: venue.id,
                                    isActive: !venue.is_active,
                                  })
                                }
                              >
                                {venue.is_active ? (
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
        </TabsContent>

        {/* Experiences Tab */}
        <TabsContent value="experiences">
          <Card>
            <CardHeader>
              <CardTitle>All Experiences</CardTitle>
              <CardDescription>
                {experiences.length} experiences across all venues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {experiencesLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading experiences...</div>
              ) : experiences.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Experiences Found</h3>
                  <p className="text-muted-foreground">
                    No experiences have been created yet
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Experience</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {experiences.map((exp: any) => (
                      <TableRow key={exp.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={exp.main_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100'}
                              alt={exp.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-medium line-clamp-1">{exp.name}</p>
                              {exp.is_featured && (
                                <Badge variant="secondary" className="text-xs">Featured</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{exp.venue?.name || 'N/A'}</p>
                            <p className="text-muted-foreground">{exp.venue?.city}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{exp.experience_type}</Badge>
                        </TableCell>
                        <TableCell>{exp.duration_minutes} min</TableCell>
                        <TableCell>R{exp.base_price}</TableCell>
                        <TableCell>
                          {exp.rating > 0 ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {exp.rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              exp.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }
                          >
                            {exp.is_active ? 'Active' : 'Inactive'}
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
                                onClick={() =>
                                  toggleExperienceActive.mutate({
                                    experienceId: exp.id,
                                    isActive: !exp.is_active,
                                  })
                                }
                              >
                                {exp.is_active ? (
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
        </TabsContent>
      </Tabs>

      {/* Venue Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Venue Details</DialogTitle>
            <DialogDescription>
              View and manage venue information
            </DialogDescription>
          </DialogHeader>

          {selectedVenue && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={selectedVenue.main_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200'}
                  alt={selectedVenue.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedVenue.name}</h3>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {selectedVenue.street_address}, {selectedVenue.city}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">
                      {venueTypeLabels[selectedVenue.venue_type] || selectedVenue.venue_type}
                    </Badge>
                    {getStatusBadge(selectedVenue.verification_status)}
                    {selectedVenue.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p>{selectedVenue.email}</p>
                  <p>{selectedVenue.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stats</p>
                  <p className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {selectedVenue.rating.toFixed(1)} ({selectedVenue.total_reviews} reviews)
                  </p>
                  <p>{selectedVenue.total_bookings} bookings</p>
                </div>
              </div>

              {selectedVenue.description && (
                <div>
                  <p className="text-muted-foreground text-sm">Description</p>
                  <p className="text-sm mt-1">{selectedVenue.description}</p>
                </div>
              )}

              {selectedVenue.categories.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Categories</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedVenue.categories.map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedVenue.amenities.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedVenue.amenities.map((amenity) => (
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
            {selectedVenue?.verification_status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    updateVerification.mutate({
                      venueId: selectedVenue.id,
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
                      venueId: selectedVenue.id,
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
