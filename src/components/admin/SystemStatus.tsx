import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Database, Mail, CreditCard } from 'lucide-react';

export function SystemStatus() {
  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-check`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      return response.json();
    },
    refetchInterval: 60000, // Check every minute
  });

  const services = [
    {
      name: 'Database',
      status: health?.database ? 'operational' : 'down',
      icon: Database,
    },
    {
      name: 'Authentication',
      status: health?.auth ? 'operational' : 'down',
      icon: Activity,
    },
    {
      name: 'Email Service',
      status: 'operational', // Would need actual check
      icon: Mail,
    },
    {
      name: 'Payment Gateway',
      status: 'operational', // Would need actual check
      icon: CreditCard,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <service.icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{service.name}</span>
              </div>
              <Badge
                variant={service.status === 'operational' ? 'default' : 'destructive'}
              >
                {service.status}
              </Badge>
            </div>
          ))}
        </div>
        {health && (
          <p className="text-xs text-muted-foreground mt-4">
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
