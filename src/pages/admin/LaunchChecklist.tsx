import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function LaunchChecklist() {
  const [checks, setChecks] = useState({
    security: [
      { id: 'env-removed', label: '.env file removed from repository', status: false },
      { id: 'keys-rotated', label: 'All API keys rotated', status: false },
      { id: 'rls-enabled', label: 'RLS policies verified on all tables', status: false },
      { id: 'payfast-prod', label: 'PayFast in production mode', status: false },
      { id: 'secrets-configured', label: 'All secrets configured in Lovable Cloud', status: false },
    ],
    database: [
      { id: 'backup-created', label: 'Production backup created', status: false },
      { id: 'indexes-added', label: 'Production indexes applied', status: false },
      { id: 'migrations-run', label: 'All migrations executed', status: false },
      { id: 'health-check', label: 'Health check endpoint tested', status: false },
    ],
    testing: [
      { id: 'payment-tested', label: 'Payment flow tested end-to-end', status: false },
      { id: 'emails-tested', label: 'Email notifications working', status: false },
      { id: 'mobile-tested', label: 'Mobile responsiveness verified', status: false },
      { id: 'pwa-tested', label: 'PWA installation tested', status: false },
      { id: 'real-time-tested', label: 'Real-time order updates verified', status: false },
    ],
    monitoring: [
      { id: 'health-endpoint', label: 'Health check endpoint working', status: false },
      { id: 'error-tracking', label: 'Error tracking configured', status: false },
      { id: 'uptime-monitor', label: 'Uptime monitoring enabled', status: false },
      { id: 'performance-baseline', label: 'Performance baseline established', status: false },
    ],
  });

  const toggleCheck = (category: keyof typeof checks, id: string) => {
    setChecks(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === id ? { ...item, status: !item.status } : item
      ),
    }));
  };

  const getCategoryProgress = (category: keyof typeof checks) => {
    const items = checks[category];
    const completed = items.filter(item => item.status).length;
    return `${completed}/${items.length}`;
  };

  const getTotalProgress = () => {
    const allItems = Object.values(checks).flat();
    const completed = allItems.filter(item => item.status).length;
    const total = allItems.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const progress = getTotalProgress();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Production Launch Checklist</h1>
          <p className="text-muted-foreground mt-2">
            Complete all items before launching to production
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold">{progress.percentage}%</div>
            <div className="text-sm text-muted-foreground">
              {progress.completed} of {progress.total} complete
            </div>
          </div>
          <Badge variant={progress.percentage === 100 ? "default" : "outline"} className="text-lg px-4 py-2">
            Target: Nov 7, 2025
          </Badge>
        </div>
      </div>

      {Object.entries(checks).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="capitalize text-xl">{category}</CardTitle>
              <Badge variant="secondary">{getCategoryProgress(category as keyof typeof checks)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <Checkbox 
                  id={item.id} 
                  checked={item.status}
                  onCheckedChange={() => toggleCheck(category as keyof typeof checks, item.id)}
                />
                <label
                  htmlFor={item.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {item.label}
                </label>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {progress.percentage === 100 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-primary">🚀 Ready for Launch!</h2>
              <p className="text-muted-foreground">
                All checklist items are complete. You're ready to deploy to production.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
