import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemLogs, useApiCallLogs, useErrorLogs, useInteractionLogs, useLogStats } from '@/hooks/useSystemLogs';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Activity, Database, Bug, MousePointer, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminLogs() {
  const [dateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const { data: systemLogs, isLoading: systemLoading } = useSystemLogs(dateRange);
  const { data: apiLogs, isLoading: apiLoading } = useApiCallLogs(dateRange);
  const { data: errorLogs, isLoading: errorLoading } = useErrorLogs(dateRange);
  const { data: interactionLogs, isLoading: interactionLoading } = useInteractionLogs(dateRange);
  const stats = useLogStats(dateRange);
  const { data: health } = useSystemHealth();

  // Process data for charts
  const logTypeData = systemLogs?.reduce((acc: any, log) => {
    const type = log.log_type;
    const existing = acc.find((item: any) => item.name === type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, []) || [];

  const errorSeverityData = errorLogs?.reduce((acc: any, log) => {
    const severity = log.severity;
    const existing = acc.find((item: any) => item.name === severity);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: severity, value: 1 });
    }
    return acc;
  }, []) || [];

  const apiEndpointData = apiLogs?.reduce((acc: any, log) => {
    const endpoint = log.endpoint.split('?')[0];
    const existing = acc.find((item: any) => item.name === endpoint);
    if (existing) {
      existing.count += 1;
      existing.avgDuration = (existing.avgDuration * (existing.count - 1) + log.duration_ms) / existing.count;
      if (!log.success) existing.failures += 1;
    } else {
      acc.push({
        name: endpoint,
        count: 1,
        avgDuration: log.duration_ms,
        failures: log.success ? 0 : 1,
      });
    }
    return acc;
  }, []).sort((a: any, b: any) => b.count - a.count).slice(0, 10) || [];

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-muted-foreground">Monitor system health and track user interactions</p>
        </div>

        {/* System Health Alert */}
        {health && health.status !== 'healthy' && (
          <Alert variant={health.status === 'critical' ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>System Health: {health.status.toUpperCase()}</AlertTitle>
            <AlertDescription>
              {health.criticalErrors > 0 && `${health.criticalErrors} critical errors detected. `}
              {health.failedApiCalls > 0 && `${health.failedApiCalls} failed API calls. `}
              {health.failedActions > 0 && `${health.failedActions} failed actions. `}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
              <Bug className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalErrors}</div>
              <p className="text-xs text-muted-foreground">Error rate: {stats.errorRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Success Rate</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.apiSuccessRate}%</div>
              <p className="text-xs text-muted-foreground">{stats.failedApiCalls} failed calls</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Actions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedActions}</div>
              <p className="text-xs text-muted-foreground">User actions that failed</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Log Types Distribution</CardTitle>
              <CardDescription>Breakdown of log types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={logTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {logTypeData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Severity</CardTitle>
              <CardDescription>Distribution by severity level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={errorSeverityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Logs */}
        <Tabs defaultValue="system" className="space-y-4">
          <TabsList>
            <TabsTrigger value="system">System Logs</TabsTrigger>
            <TabsTrigger value="api">API Calls</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Recent system events and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemLogs?.slice(0, 50).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.created_at), 'MMM d, HH:mm:ss')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.log_type}</Badge>
                        </TableCell>
                        <TableCell>{log.component || '-'}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>
                          <Badge variant={log.success ? 'default' : 'destructive'}>
                            {log.success ? 'Success' : 'Failed'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Performance</CardTitle>
                <CardDescription>Top 10 endpoints by request count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={apiEndpointData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Requests" />
                    <Bar dataKey="failures" fill="hsl(var(--destructive))" name="Failures" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Call Logs</CardTitle>
                <CardDescription>Recent API requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiLogs?.slice(0, 50).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.created_at), 'MMM d, HH:mm:ss')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.method}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{log.endpoint}</TableCell>
                        <TableCell>{log.duration_ms}ms</TableCell>
                        <TableCell>
                          <Badge variant={log.success ? 'default' : 'destructive'}>
                            {log.status_code || (log.success ? '200' : 'Error')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Logs</CardTitle>
                <CardDescription>Recent errors and exceptions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Component</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorLogs?.slice(0, 50).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.created_at), 'MMM d, HH:mm:ss')}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.severity === 'critical'
                                ? 'destructive'
                                : log.severity === 'high'
                                ? 'default'
                                : 'outline'
                            }
                          >
                            {log.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.error_type}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.error_message}</TableCell>
                        <TableCell>{log.component || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Interactions</CardTitle>
                <CardDescription>Recent user interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>Element</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interactionLogs?.slice(0, 50).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{format(new Date(log.created_at), 'MMM d, HH:mm:ss')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.event_type}</Badge>
                        </TableCell>
                        <TableCell>{log.page_path}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.element_text || log.element_id || log.element_class || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
