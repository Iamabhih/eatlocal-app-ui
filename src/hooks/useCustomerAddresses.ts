import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useCustomerAddresses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const createAddress = useMutation({
    mutationFn: async (addressData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('customer_addresses')
        .insert({
          ...addressData,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      toast({ title: 'Address added successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add address',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    addresses: addresses || [],
    isLoading,
    createAddress: createAddress.mutate,
  };
}
