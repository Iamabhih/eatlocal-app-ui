import { DollarSign, TrendingUp, Calendar, Download, Clock, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/shared/Navbar";

const DeliveryEarnings = () => {
  // Mock earnings data
  const todayStats = {
    totalEarnings: 127.50,
    deliveries: 8,
    tips: 23.50,
    baseEarnings: 96.00,
    bonuses: 8.00,
    hoursWorked: 6.5,
    avgPerDelivery: 15.94
  };

  const weeklyStats = {
    totalEarnings: 742.25,
    deliveries: 45,
    tips: 142.75,
    baseEarnings: 540.00,
    bonuses: 59.50,
    hoursWorked: 32.5,
    avgPerDelivery: 16.49
  };

  const recentEarnings = [
    {
      id: "#D12348",
      restaurant: "Healthy Bowls",
      customer: "Lisa J.",
      time: "3:45 PM",
      distance: "1.5 mi",
      duration: "22 min",
      baseEarning: 8.50,
      tip: 4.00,
      bonus: 0,
      total: 12.50
    },
    {
      id: "#D12347",
      restaurant: "Pizza Corner", 
      customer: "Mike R.",
      time: "3:15 PM",
      distance: "2.1 mi",
      duration: "28 min",
      baseEarning: 12.75,
      tip: 6.00,
      bonus: 0,
      total: 18.75
    },
    {
      id: "#D12346",
      restaurant: "Sushi Express",
      customer: "Sarah M.",
      time: "2:45 PM", 
      distance: "0.8 mi",
      duration: "15 min",
      baseEarning: 9.25,
      tip: 6.00,
      bonus: 0,
      total: 15.25
    },
    {
      id: "#D12345",
      restaurant: "Burger Palace",
      customer: "John D.",
      time: "2:20 PM",
      distance: "1.2 mi", 
      duration: "20 min",
      baseEarning: 7.50,
      tip: 3.00,
      bonus: 2.00,
      total: 12.50
    },
    {
      id: "#D12344",
      restaurant: "Taco Fiesta",
      customer: "Emma W.",
      time: "1:50 PM",
      distance: "1.8 mi",
      duration: "25 min",
      baseEarning: 10.00,
      tip: 5.50,
      bonus: 0,
      total: 15.50
    }
  ];

  const weeklyBreakdown = [
    { day: "Monday", deliveries: 6, earnings: 89.25 },
    { day: "Tuesday", deliveries: 8, earnings: 127.50 },
    { day: "Wednesday", deliveries: 7, earnings: 103.75 },
    { day: "Thursday", deliveries: 9, earnings: 145.25 },
    { day: "Friday", deliveries: 8, earnings: 128.00 },
    { day: "Saturday", deliveries: 4, earnings: 78.50 },
    { day: "Sunday", deliveries: 3, earnings: 70.00 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar type="delivery" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Earnings</h1>
          <div className="flex items-center gap-4">
            <Select defaultValue="today">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="mt-6">
            {/* Today's Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                      <p className="text-3xl font-bold uber-green">${todayStats.totalEarnings}</p>
                    </div>
                    <DollarSign className="h-8 w-8 uber-green" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Deliveries</p>
                      <p className="text-3xl font-bold">{todayStats.deliveries}</p>
                    </div>
                    <Package className="h-8 w-8 uber-green" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tips</p>
                      <p className="text-3xl font-bold">${todayStats.tips}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 uber-green" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Hours Worked</p>
                      <p className="text-3xl font-bold">{todayStats.hoursWorked}h</p>
                    </div>
                    <Clock className="h-8 w-8 uber-green" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Earnings Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Base Earnings ({todayStats.deliveries} deliveries)</span>
                      <span className="font-bold">${todayStats.baseEarnings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tips</span>
                      <span className="font-bold uber-green">${todayStats.tips}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Bonuses & Incentives</span>
                      <span className="font-bold">${todayStats.bonuses}</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-bold">Total</span>
                        <span className="font-bold uber-green">${todayStats.totalEarnings}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Avg per Delivery</span>
                        <span className="font-bold">${todayStats.avgPerDelivery}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-uber-green h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Hourly Rate</span>
                        <span className="font-bold">${(todayStats.totalEarnings / todayStats.hoursWorked).toFixed(2)}/hr</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-uber-green h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Tip Rate</span>
                        <span className="font-bold">{((todayStats.tips / todayStats.totalEarnings) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-uber-green h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Deliveries */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Today's Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentEarnings.map((delivery) => (
                    <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-smooth">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium">{delivery.id}</span>
                          <Badge variant="secondary">{delivery.time}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {delivery.restaurant} → {delivery.customer}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {delivery.distance} • {delivery.duration}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg uber-green">${delivery.total}</p>
                        <div className="text-xs text-muted-foreground">
                          <span>Base: ${delivery.baseEarning}</span>
                          {delivery.tip > 0 && <span> • Tip: ${delivery.tip}</span>}
                          {delivery.bonus > 0 && <span> • Bonus: ${delivery.bonus}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="week" className="mt-6">
            {/* Weekly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                      <p className="text-3xl font-bold uber-green">${weeklyStats.totalEarnings}</p>
                    </div>
                    <DollarSign className="h-8 w-8 uber-green" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Deliveries</p>
                      <p className="text-3xl font-bold">{weeklyStats.deliveries}</p>
                    </div>
                    <Package className="h-8 w-8 uber-green" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg/Day</p>
                      <p className="text-3xl font-bold">${(weeklyStats.totalEarnings / 7).toFixed(0)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 uber-green" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Hours Worked</p>
                      <p className="text-3xl font-bold">{weeklyStats.hoursWorked}h</p>
                    </div>
                    <Clock className="h-8 w-8 uber-green" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Breakdown */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Daily Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyBreakdown.map((day) => (
                    <div key={day.day} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-medium w-20">{day.day}</span>
                        <Badge variant="secondary">{day.deliveries} deliveries</Badge>
                      </div>
                      <span className="font-bold text-lg uber-green">${day.earnings}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Earnings History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">Historical Data</h3>
                  <p className="text-muted-foreground">
                    Your complete earnings history will be displayed here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DeliveryEarnings;