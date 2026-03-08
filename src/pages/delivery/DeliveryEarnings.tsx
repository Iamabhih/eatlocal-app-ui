import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, Calendar, Download, Clock, Package, Target, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDeliveryEarnings } from "@/hooks/useDeliveryEarnings";
import { useToast } from "@/hooks/use-toast";

const DeliveryEarnings = () => {
  const { earnings, todayEarnings, totalToday, totalTips, deliveriesToday, isLoading } = useDeliveryEarnings();
  const { toast } = useToast();
  const [dailyGoal, setDailyGoal] = useState(500);

  // Weekly earnings
  const weeklyEarnings = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return earnings.filter(e => new Date(e.created_at) >= startOfWeek);
  }, [earnings]);

  const totalWeek = weeklyEarnings.reduce((sum, e) => sum + Number(e.total_earnings), 0);
  const weeklyTips = weeklyEarnings.reduce((sum, e) => sum + Number(e.tip || 0), 0);

  // Monthly earnings
  const monthlyEarnings = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return earnings.filter(e => new Date(e.created_at) >= startOfMonth);
  }, [earnings]);

  const totalMonth = monthlyEarnings.reduce((sum, e) => sum + Number(e.total_earnings), 0);

  // Daily chart data for the past 7 days
  const dailyChartData = useMemo(() => {
    const days: { day: string; earnings: number; deliveries: number; tips: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-ZA', { weekday: 'short' });
      const dayEarnings = earnings.filter(e => e.created_at.startsWith(dateStr));
      days.push({
        day: dayLabel,
        earnings: dayEarnings.reduce((s, e) => s + Number(e.total_earnings), 0),
        deliveries: dayEarnings.length,
        tips: dayEarnings.reduce((s, e) => s + Number(e.tip || 0), 0),
      });
    }
    return days;
  }, [earnings]);

  // Payout history (grouped by week)
  const payoutHistory = useMemo(() => {
    const weeks: Record<string, { start: string; end: string; total: number; deliveries: number; paidOut: boolean }> = {};
    earnings.forEach(e => {
      const d = new Date(e.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      if (!weeks[key]) {
        weeks[key] = {
          start: weekStart.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
          end: weekEnd.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
          total: 0,
          deliveries: 0,
          paidOut: !!e.paid_out,
        };
      }
      weeks[key].total += Number(e.net_payout);
      weeks[key].deliveries++;
    });
    return Object.values(weeks).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()).slice(0, 12);
  }, [earnings]);

  const goalProgress = Math.min((totalToday / dailyGoal) * 100, 100);

  const exportEarnings = () => {
    const headers = ['Date', 'Order #', 'Base Fee', 'Tips', 'Bonus', 'Total', 'Net Payout'];
    const rows = earnings.map(e => [
      new Date(e.created_at).toLocaleDateString(),
      (e as any).order?.order_number || '',
      Number(e.base_fee).toFixed(2),
      Number(e.tip || 0).toFixed(2),
      Number(e.bonus || 0).toFixed(2),
      Number(e.total_earnings).toFixed(2),
      Number(e.net_payout).toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Earnings exported' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Earnings</h1>
          <Button variant="outline" onClick={exportEarnings}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          {/* TODAY TAB */}
          <TabsContent value="today" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
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
              <Card>
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
              <Card>
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

            {/* Daily Goal Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Daily Goal</p>
                  <p className="text-sm text-muted-foreground">R{totalToday.toFixed(0)} / R{dailyGoal}</p>
                </div>
                <Progress value={goalProgress} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  {goalProgress >= 100 ? '🎉 Goal reached!' : `R${(dailyGoal - totalToday).toFixed(0)} to go`}
                </p>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card>
              <CardHeader><CardTitle>Earnings Breakdown</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-4 text-muted-foreground">Loading...</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between"><span>Base Fees</span><span className="font-bold">R{todayEarnings.reduce((s, e) => s + Number(e.base_fee), 0).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Distance Fees</span><span className="font-bold">R{todayEarnings.reduce((s, e) => s + Number(e.distance_fee || 0), 0).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Tips</span><span className="font-bold text-primary">R{totalTips.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Bonuses</span><span className="font-bold">R{todayEarnings.reduce((s, e) => s + Number(e.bonus || 0), 0).toFixed(2)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Platform Fee</span><span>-R{todayEarnings.reduce((s, e) => s + Number(e.platform_fee_amount), 0).toFixed(2)}</span></div>
                    <div className="border-t pt-3 flex justify-between text-lg"><span className="font-bold">Net Payout</span><span className="font-bold text-primary">R{todayEarnings.reduce((s, e) => s + Number(e.net_payout), 0).toFixed(2)}</span></div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Deliveries */}
            <Card>
              <CardHeader><CardTitle>Today's Deliveries</CardTitle></CardHeader>
              <CardContent>
                {todayEarnings.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No deliveries yet today</p>
                ) : (
                  <div className="space-y-3">
                    {todayEarnings.map((earning) => (
                      <div key={earning.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">#{(earning as any).order?.order_number}</span>
                          <p className="text-sm text-muted-foreground">{(earning as any).order?.restaurant?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">R{Number(earning.net_payout).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {Number(earning.tip || 0) > 0 && `+R${Number(earning.tip).toFixed(2)} tip`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WEEK TAB */}
          <TabsContent value="week" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Weekly Earnings</p>
                  <p className="text-3xl font-bold text-primary">R{totalWeek.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Deliveries</p>
                  <p className="text-3xl font-bold">{weeklyEarnings.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Tips</p>
                  <p className="text-3xl font-bold">R{weeklyTips.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Daily Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => `R${v.toFixed(2)}`} />
                    <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Earnings" />
                    <Bar dataKey="tips" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Tips" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GOALS TAB */}
          <TabsContent value="goals" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Set Daily Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={dailyGoal.toString()} onValueChange={(v) => setDailyGoal(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="200">R200 / day</SelectItem>
                    <SelectItem value="350">R350 / day</SelectItem>
                    <SelectItem value="500">R500 / day</SelectItem>
                    <SelectItem value="750">R750 / day</SelectItem>
                    <SelectItem value="1000">R1,000 / day</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Award className="h-12 w-12 mx-auto mb-3 text-primary" />
                  <p className="text-2xl font-bold">{earnings.length}</p>
                  <p className="text-muted-foreground">Total Deliveries</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 text-primary" />
                  <p className="text-2xl font-bold">R{totalMonth.toFixed(2)}</p>
                  <p className="text-muted-foreground">This Month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Weekly Progress</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Weekly target (7 × R{dailyGoal})</span>
                    <span>R{totalWeek.toFixed(0)} / R{dailyGoal * 7}</span>
                  </div>
                  <Progress value={Math.min((totalWeek / (dailyGoal * 7)) * 100, 100)} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAYOUTS TAB */}
          <TabsContent value="payouts" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>Weekly payout summaries</CardDescription>
              </CardHeader>
              <CardContent>
                {payoutHistory.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No payout history yet</p>
                ) : (
                  <div className="space-y-3">
                    {payoutHistory.map((week, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{week.start} – {week.end}</p>
                          <p className="text-sm text-muted-foreground">{week.deliveries} deliveries</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <p className="text-lg font-bold">R{week.total.toFixed(2)}</p>
                          <Badge variant={week.paidOut ? "default" : "secondary"}>
                            {week.paidOut ? "Paid" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DeliveryEarnings;
