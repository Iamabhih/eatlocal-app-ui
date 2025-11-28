import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Calendar,
  DollarSign,
  Star,
  Users,
  Clock,
  Plus,
  Edit,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  Sparkles,
  MapPin,
  TrendingUp,
  Home,
  LogOut,
  ChevronDown,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  venueTypeLabels,
  experienceTypeLabels,
  formatDuration,
  Venue,
  Experience,
  ExperienceBooking,
} from '@/hooks/useVenues';

export default function VenuePartnerDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showVenueDialog, setShowVenueDialog] = useState(false);
  const [showExperienceDialog, setShowExperienceDialog] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Fetch owner's venues
  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['my-venues', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Venue[];
    },
    enabled: !!user,
  });

  // Fetch owner's experiences
  const { data: experiences = [] } = useQuery({
    queryKey: ['my-experiences', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const venueIds = venues.map((v) => v.id);
      if (venueIds.length === 0) return [];
      const { data, error } = await supabase
        .from('experiences')
        .select('*, venue:venues(id, name)')
        .in('venue_id', venueIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Experience[];
    },
    enabled: venues.length > 0,
  });

  // Fetch experience bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ['venue-experience-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const experienceIds = experiences.map((e) => e.id);
      if (experienceIds.length === 0) return [];
      const { data, error } = await supabase
        .from('experience_bookings')
        .select('*, experience:experiences(id, name, venue:venues(id, name))')
        .in('experience_id', experienceIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ExperienceBooking[];
    },
    enabled: experiences.length > 0,
  });

  // Calculate stats
  const stats = {
    totalVenues: venues.length,
    totalExperiences: experiences.length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === 'pending').length,
    confirmedBookings: bookings.filter((b) => b.status === 'confirmed').length,
    totalRevenue: bookings
      .filter((b) => b.payment_status === 'paid')
      .reduce((sum, b) => sum + b.total, 0),
    averageRating: venues.length > 0
      ? venues.reduce((sum, v) => sum + v.rating, 0) / venues.length
      : 0,
  };

  // Update booking status mutation
  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from('experience_bookings')
        .update({ status })
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue-experience-bookings'] });
      toast.success('Booking status updated');
    },
    onError: () => {
      toast.error('Failed to update booking status');
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      no_show: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return <Badge className={styles[status] || styles.pending}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-purple-600/10 to-pink-500/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo/Home Link */}
              <Link
                to="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-display font-bold hidden sm:inline">Smash</span>
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Venue Partner
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Manage your venues & experiences</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowVenueDialog(true)} className="hidden sm:flex">
                <Plus className="h-4 w-4 mr-2" />
                Add Venue
              </Button>
              <Button size="sm" onClick={() => setShowExperienceDialog(true)} className="hidden sm:flex">
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
              <Button size="icon" variant="outline" className="sm:hidden" onClick={() => setShowVenueDialog(true)}>
                <Plus className="h-4 w-4" />
              </Button>
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-purple-100 text-purple-600 text-xs">
                        {user?.email?.charAt(0).toUpperCase() || 'V'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer">
                      <Home className="h-4 w-4 mr-2" />
                      Go to Home
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="venues">Venues</TabsTrigger>
            <TabsTrigger value="experiences">Experiences</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVenues}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Experiences</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalExperiences}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R{stats.totalRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    {stats.averageRating.toFixed(1)}
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pending</span>
                    <Badge variant="outline" className="text-yellow-600">
                      {stats.pendingBookings}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Confirmed</span>
                    <Badge variant="outline" className="text-green-600">
                      {stats.confirmedBookings}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total</span>
                    <Badge variant="outline">{stats.totalBookings}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No bookings yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {bookings.slice(0, 5).map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{booking.customer_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.experience?.name} - {booking.booking_date}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(booking.status)}
                            <p className="text-sm font-medium mt-1">R{booking.total}</p>
                          </div>
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
                <CardTitle>Experience Bookings</CardTitle>
                <CardDescription>
                  Manage all bookings for your experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Bookings Yet</h3>
                    <p className="text-muted-foreground">
                      Bookings will appear here once customers start booking
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking #</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-sm">
                            {booking.booking_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.experience?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {booking.experience?.venue?.name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.customer_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {booking.customer_email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{booking.booking_date}</p>
                              <p className="text-sm text-muted-foreground">
                                {booking.start_time}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.num_adults} adult{booking.num_adults > 1 ? 's' : ''}
                            {booking.num_children > 0 && `, ${booking.num_children} child`}
                          </TableCell>
                          <TableCell className="font-medium">
                            R{booking.total.toFixed(2)}
                          </TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {booking.status === 'pending' && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateBookingStatus.mutate({
                                        bookingId: booking.id,
                                        status: 'confirmed',
                                      })
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                    Confirm
                                  </DropdownMenuItem>
                                )}
                                {booking.status === 'confirmed' && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateBookingStatus.mutate({
                                        bookingId: booking.id,
                                        status: 'completed',
                                      })
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    updateBookingStatus.mutate({
                                      bookingId: booking.id,
                                      status: 'cancelled',
                                    })
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
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

          {/* Venues Tab */}
          <TabsContent value="venues">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Venues</CardTitle>
                  <CardDescription>Manage your venue listings</CardDescription>
                </div>
                <Button onClick={() => setShowVenueDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Venue
                </Button>
              </CardHeader>
              <CardContent>
                {venuesLoading ? (
                  <p className="text-muted-foreground text-center py-12">Loading...</p>
                ) : venues.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Venues Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first venue to start listing experiences
                    </p>
                    <Button onClick={() => setShowVenueDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Venue
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {venues.map((venue) => (
                      <Card key={venue.id} className="overflow-hidden">
                        <div className="relative">
                          <img
                            src={venue.main_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'}
                            alt={venue.name}
                            className="w-full h-32 object-cover"
                          />
                          <Badge
                            className={`absolute top-2 right-2 ${
                              venue.verification_status === 'verified'
                                ? 'bg-green-500'
                                : venue.verification_status === 'pending'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                          >
                            {venue.verification_status}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold line-clamp-1">{venue.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {venue.city}, {venue.country}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              {venueTypeLabels[venue.venue_type]}
                            </Badge>
                            {venue.rating > 0 && (
                              <span className="text-sm flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {venue.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => navigate(`/venues/${venue.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedVenue(venue);
                                setShowVenueDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experiences Tab */}
          <TabsContent value="experiences">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Experiences</CardTitle>
                  <CardDescription>Manage your experience offerings</CardDescription>
                </div>
                <Button onClick={() => setShowExperienceDialog(true)} disabled={venues.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </CardHeader>
              <CardContent>
                {venues.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Add a Venue First</h3>
                    <p className="text-muted-foreground mb-4">
                      You need to add at least one venue before creating experiences
                    </p>
                    <Button onClick={() => setShowVenueDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Venue
                    </Button>
                  </div>
                ) : experiences.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Experiences Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first experience for customers to book
                    </p>
                    <Button onClick={() => setShowExperienceDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
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
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {experiences.map((experience) => (
                        <TableRow key={experience.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={experience.main_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100'}
                                alt={experience.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                              <div>
                                <p className="font-medium">{experience.name}</p>
                                {experience.rating > 0 && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    {experience.rating.toFixed(1)} ({experience.total_reviews})
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{experience.venue?.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {experienceTypeLabels[experience.experience_type]}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDuration(experience.duration_minutes)}</TableCell>
                          <TableCell>R{experience.base_price}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                experience.is_active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                              }
                            >
                              {experience.is_active ? 'Active' : 'Inactive'}
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
                                  onClick={() => navigate(`/experiences/${experience.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedExperience(experience);
                                    setShowExperienceDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
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
      </main>

      {/* Add/Edit Venue Dialog */}
      <Dialog open={showVenueDialog} onOpenChange={setShowVenueDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedVenue ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
            <DialogDescription>
              Fill in the details to {selectedVenue ? 'update your' : 'create a new'} venue listing
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Venue Name *</Label>
              <Input placeholder="Enter venue name" defaultValue={selectedVenue?.name} />
            </div>
            <div className="space-y-2">
              <Label>Venue Type *</Label>
              <Select defaultValue={selectedVenue?.venue_type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(venueTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe your venue..."
                defaultValue={selectedVenue?.description || ''}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Street Address *</Label>
              <Input placeholder="123 Main Street" defaultValue={selectedVenue?.street_address} />
            </div>
            <div className="space-y-2">
              <Label>City *</Label>
              <Input placeholder="Cape Town" defaultValue={selectedVenue?.city} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="+27 XX XXX XXXX" defaultValue={selectedVenue?.phone || ''} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="contact@venue.com" defaultValue={selectedVenue?.email || ''} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowVenueDialog(false);
              setSelectedVenue(null);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success(selectedVenue ? 'Venue updated' : 'Venue created');
              setShowVenueDialog(false);
              setSelectedVenue(null);
            }}>
              {selectedVenue ? 'Update' : 'Create'} Venue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Experience Dialog */}
      <Dialog open={showExperienceDialog} onOpenChange={setShowExperienceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedExperience ? 'Edit Experience' : 'Add New Experience'}</DialogTitle>
            <DialogDescription>
              Create an engaging experience for your customers
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Experience Name *</Label>
              <Input placeholder="Enter experience name" defaultValue={selectedExperience?.name} />
            </div>
            <div className="space-y-2">
              <Label>Venue *</Label>
              <Select defaultValue={selectedExperience?.venue_id || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Experience Type *</Label>
              <Select defaultValue={selectedExperience?.experience_type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(experienceTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes) *</Label>
              <Input
                type="number"
                placeholder="120"
                defaultValue={selectedExperience?.duration_minutes || 60}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the experience..."
                defaultValue={selectedExperience?.description || ''}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Base Price (ZAR) *</Label>
              <Input
                type="number"
                placeholder="500"
                defaultValue={selectedExperience?.base_price || ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Participants</Label>
              <Input
                type="number"
                placeholder="10"
                defaultValue={selectedExperience?.max_participants || ''}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowExperienceDialog(false);
              setSelectedExperience(null);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success(selectedExperience ? 'Experience updated' : 'Experience created');
              setShowExperienceDialog(false);
              setSelectedExperience(null);
            }}>
              {selectedExperience ? 'Update' : 'Create'} Experience
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
