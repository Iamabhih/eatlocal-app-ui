import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Hotel,
  Building2,
  Car,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Star,
  Utensils,
  Sparkles,
  Gift,
  Wallet,
  Bell,
  Settings,
  Heart,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

// Mock data for dashboard
const recentOrders = [
  {
    id: '1',
    type: 'food',
    name: "Nando's Sandton",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'delivered',
    total: 245.00,
    image: '/placeholder.svg',
  },
  {
    id: '2',
    type: 'food',
    name: 'Steers Rosebank',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'delivered',
    total: 189.50,
    image: '/placeholder.svg',
  },
];

const upcomingBookings = [
  {
    id: '1',
    type: 'hotel',
    name: 'Cape Grace Hotel',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
    status: 'confirmed',
    location: 'Cape Town, Western Cape',
    image: '/placeholder.svg',
  },
  {
    id: '2',
    type: 'venue',
    name: 'Wine Tasting Experience',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'confirmed',
    location: 'Stellenbosch, Western Cape',
    image: '/placeholder.svg',
  },
  {
    id: '3',
    type: 'ride',
    name: 'Airport Transfer',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: 'scheduled',
    location: 'OR Tambo to Sandton',
    image: '/placeholder.svg',
  },
];

const loyaltyStats = {
  points: 2450,
  tier: 'Gold',
  nextTier: 'Platinum',
  pointsToNext: 550,
  totalSpent: 12500,
};

const quickActions = [
  { icon: Utensils, label: 'Order Food', path: '/restaurants', color: 'text-orange-500' },
  { icon: Hotel, label: 'Book Hotel', path: '/hotels', color: 'text-blue-500' },
  { icon: Building2, label: 'Find Venue', path: '/venues', color: 'text-purple-500' },
  { icon: Car, label: 'Book Ride', path: '/rides/book', color: 'text-green-500' },
  { icon: Sparkles, label: 'Experiences', path: '/experiences', color: 'text-pink-500' },
  { icon: MapPin, label: 'Explore Map', path: '/map', color: 'text-teal-500' },
];

export function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      delivered: { variant: 'default', label: 'Delivered' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      scheduled: { variant: 'secondary', label: 'Scheduled' },
      pending: { variant: 'outline', label: 'Pending' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, typeof Package> = {
      food: Utensils,
      hotel: Hotel,
      venue: Building2,
      ride: Car,
      experience: Sparkles,
    };
    const Icon = icons[type] || Package;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="text-lg">
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Guest'}!
            </h1>
            <p className="text-muted-foreground">
              Manage your bookings, orders, and rewards all in one place
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/profile')}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
        {quickActions.map((action) => (
          <Card
            key={action.label}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(action.path)}
          >
            <CardContent className="p-4 text-center">
              <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2`}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <p className="text-sm font-medium">{action.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Upcoming Bookings */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Upcoming Bookings</CardTitle>
                  <CardDescription>Your scheduled reservations and trips</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('bookings')}>
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        {getTypeIcon(booking.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{booking.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {booking.date.toLocaleDateString('en-ZA', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <MapPin className="h-3 w-3 ml-2" />
                          <span className="truncate">{booking.location}</span>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming bookings</p>
                    <Button variant="link" onClick={() => navigate('/hotels')}>
                      Book something now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loyalty Card */}
            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Smash Rewards</CardTitle>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {loyaltyStats.tier}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">{loyaltyStats.points.toLocaleString()}</p>
                  <p className="text-white/80 text-sm">Available points</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">Progress to {loyaltyStats.nextTier}</span>
                    <span>{loyaltyStats.pointsToNext} points left</span>
                  </div>
                  <Progress value={((3000 - loyaltyStats.pointsToNext) / 3000) * 100} className="h-2 bg-white/20" />
                </div>
                <Button variant="secondary" className="w-full" onClick={() => setActiveTab('rewards')}>
                  <Gift className="mr-2 h-4 w-4" />
                  View Rewards
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest food deliveries</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Utensils className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{order.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(order.date, { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>All your past food orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                      <Utensils className="h-8 w-8 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg">{order.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {order.date.toLocaleDateString('en-ZA')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatCurrency(order.total)}</p>
                      {getStatusBadge(order.status)}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>Hotels, venues, experiences, and rides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                      {getTypeIcon(booking.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg">{booking.name}</p>
                        <Badge variant="outline" className="capitalize">{booking.type}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {booking.date.toLocaleDateString('en-ZA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.location}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rewards Summary</CardTitle>
                <CardDescription>Your loyalty status and points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Tier</p>
                    <p className="text-2xl font-bold text-amber-600">{loyaltyStats.tier}</p>
                  </div>
                  <Star className="h-12 w-12 text-amber-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Available Points</p>
                    <p className="text-2xl font-bold">{loyaltyStats.points.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold">{formatCurrency(loyaltyStats.totalSpent)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to {loyaltyStats.nextTier}</span>
                    <span>{loyaltyStats.pointsToNext} points to go</span>
                  </div>
                  <Progress value={((3000 - loyaltyStats.pointsToNext) / 3000) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Rewards</CardTitle>
                <CardDescription>Redeem your points for these rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'R50 Off Your Next Order', points: 500 },
                  { name: 'Free Delivery (3 orders)', points: 750 },
                  { name: 'R100 Hotel Credit', points: 1000 },
                  { name: 'VIP Lounge Access', points: 2000 },
                ].map((reward) => (
                  <div
                    key={reward.name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Gift className="h-5 w-5 text-primary" />
                      <span className="font-medium">{reward.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={loyaltyStats.points >= reward.points ? 'default' : 'outline'}
                      disabled={loyaltyStats.points < reward.points}
                    >
                      {reward.points} pts
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bottom Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/favorites')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="font-medium">Favorites</span>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/profile')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="h-5 w-5 text-green-500" />
            <span className="font-medium">Payment Methods</span>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/profile')}>
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Saved Addresses</span>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-purple-500" />
            <span className="font-medium">Help & Support</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CustomerDashboard;
