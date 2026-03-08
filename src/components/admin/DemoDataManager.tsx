import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Database, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function DemoDataManager() {
  const [loading, setLoading] = useState<'seed' | 'reset' | null>(null);

  const handleAction = async (action: 'seed' | 'reset') => {
    setLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke('seed-demo-data', {
        body: { action },
      });

      if (error) throw error;
      toast.success(data.message || `Demo data ${action === 'seed' ? 'seeded' : 'cleared'} successfully`);
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} demo data`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Demo Data Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Seed realistic demo data (restaurants, orders, hotels, venues, promo codes) or clear all demo records.
        </p>
        <div className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={loading !== null}>
                {loading === 'seed' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Database className="h-4 w-4 mr-2" />
                Seed Demo Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Seed Demo Data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will insert demo restaurants, menu items, orders, hotels, venues, and promo codes. Any existing demo data will be replaced.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleAction('seed')}>Seed Data</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={loading !== null}>
                {loading === 'reset' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Trash2 className="h-4 w-4 mr-2" />
                Reset Demo Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove all demo data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all demo restaurants, orders, hotels, venues, and promo codes. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleAction('reset')}>Remove All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
