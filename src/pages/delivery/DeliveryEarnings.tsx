import { DollarSign, TrendingUp, Calendar, Download, Clock, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeliveryEarnings } from "@/hooks/useDeliveryEarnings";

const DeliveryEarnings = () => {
  const { todayEarnings, totalToday, totalTips, deliveriesToday, isLoading } = useDeliveryEarnings();

  return (
    <div className="min-h-screen bg-background">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                      <p className="text-3xl font-bold text-primary">R{totalToday.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Deliveries</p>
                      <p className="text-3xl font-bold">{deliveriesToday}</p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tips</p>
                      <p className="text-3xl font-bold">R{totalTips.toFixed(2)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Earnings Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-center py-4 text-muted-foreground">Loading...</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Base Fees ({deliveriesToday} deliveries)</span>
                        <span className="font-bold">
                          R{todayEarnings.reduce((sum, e) => sum + Number(e.base_fee), 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Tips</span>
                        <span className="font-bold text-primary">R{totalTips.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Bonuses</span>
                        <span className="font-bold">
                          R{todayEarnings.reduce((sum, e) => sum + Number(e.bonus || 0), 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-lg">
                          <span className="font-bold">Total</span>
                          <span className="font-bold text-primary">R{totalToday.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Deliveries */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Today's Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                {todayEarnings.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No deliveries yet today</p>
                ) : (
                  <div className="space-y-4">
                    {todayEarnings.map((earning) => (
                      <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-smooth">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium">#{earning.order?.order_number}</span>
                            <Badge variant="secondary">
                              {new Date(earning.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {earning.order?.restaurant?.name || 'Restaurant'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">R{Number(earning.total_earnings).toFixed(2)}</p>
                          <div className="text-xs text-muted-foreground">
                            <span>Base: R{Number(earning.base_fee).toFixed(2)}</span>
                            {Number(earning.tip || 0) > 0 && <span> • Tip: R{Number(earning.tip).toFixed(2)}</span>}
                            {Number(earning.bonus || 0) > 0 && <span> • Bonus: R{Number(earning.bonus).toFixed(2)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="week" className="mt-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Weekly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-12 text-muted-foreground">
                  Weekly earnings data will be available soon
                </p>
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