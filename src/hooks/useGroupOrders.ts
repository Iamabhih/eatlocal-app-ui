import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface GroupOrder {
  id: string;
  host_id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  invite_code: string;
  deadline: string;
  delivery_address: Record<string, unknown> | null;
  split_type: 'individual' | 'host_pays' | 'equal_split' | 'proportional';
  status: 'open' | 'locked' | 'ordered' | 'delivered' | 'cancelled';
  order_id: string | null;
  subtotal: number;
  delivery_fee: number;
  service_fee: number;
  total: number;
  created_at: string;
  restaurant?: {
    name: string;
    image_url: string;
  };
  participants?: GroupOrderParticipant[];
}

export interface GroupOrderParticipant {
  id: string;
  group_order_id: string;
  user_id: string;
  status: 'invited' | 'joined' | 'submitted' | 'paid' | 'removed';
  subtotal: number;
  share_amount: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  items?: GroupOrderItem[];
}

export interface GroupOrderItem {
  id: string;
  group_order_id: string;
  participant_id: string;
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  special_instructions: string | null;
  total_price: number;
}

/**
 * Get user's group orders (as host or participant)
 */
export function useGroupOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get orders where user is host
      const { data: hostOrders, error: hostError } = await (supabase as any)
        .from('group_orders')
        .select(`
          *,
          restaurant:restaurants(name, image_url),
          participants:group_order_participants(
            id, user_id, status, subtotal, share_amount,
            profile:profiles(full_name, avatar_url)
          )
        `)
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });

      if (hostError && hostError.code !== '42P01') {
        throw hostError;
      }

      // Get orders where user is participant
      const { data: participantData } = await (supabase as any)
        .from('group_order_participants')
        .select('group_order_id')
        .eq('user_id', user.id);

      const participantOrderIds = participantData?.map((p: any) => p.group_order_id) || [];

      let participantOrders: any[] = [];
      if (participantOrderIds.length > 0) {
        const { data } = await (supabase as any)
          .from('group_orders')
          .select(`
            *,
            restaurant:restaurants(name, image_url),
            participants:group_order_participants(
              id, user_id, status, subtotal, share_amount,
              profile:profiles(full_name, avatar_url)
            )
          `)
          .in('id', participantOrderIds)
          .neq('host_id', user.id)
          .order('created_at', { ascending: false });
        participantOrders = data || [];
      }

      // Combine and deduplicate
      const allOrders = [...(hostOrders || []), ...participantOrders];
      const uniqueOrders = Array.from(new Map(allOrders.map((o: any) => [o.id, o])).values());

      return uniqueOrders as GroupOrder[];
    },
    enabled: !!user,
  });
}

/**
 * Get a single group order with full details
 */
export function useGroupOrder(groupOrderId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group-order', groupOrderId],
    queryFn: async () => {
      if (!groupOrderId) return null;

      const { data, error } = await (supabase as any)
        .from('group_orders')
        .select(`
          *,
          restaurant:restaurants(id, name, image_url, street_address, city),
          participants:group_order_participants(
            id, user_id, status, subtotal, share_amount, payment_status,
            profile:profiles(full_name, avatar_url),
            items:group_order_items(*)
          )
        `)
        .eq('id', groupOrderId)
        .single();

      if (error) throw error;
      return data as GroupOrder;
    },
    enabled: !!groupOrderId && !!user,
    refetchInterval: 10000, // Refresh every 10 seconds for live updates
  });
}

/**
 * Create a new group order
 */
export function useCreateGroupOrder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      restaurantId,
      name,
      description,
      deadline,
      deliveryAddress,
      splitType = 'individual',
      deliveryFee = 0,
    }: {
      restaurantId: string;
      name: string;
      description?: string;
      deadline: Date;
      deliveryAddress?: Record<string, unknown>;
      splitType?: GroupOrder['split_type'];
      deliveryFee?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('group_orders')
        .insert({
          host_id: user.id,
          restaurant_id: restaurantId,
          name,
          description,
          deadline: deadline.toISOString(),
          delivery_address: deliveryAddress,
          split_type: splitType,
          delivery_fee: deliveryFee,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-add host as participant
      await (supabase as any).from('group_order_participants').insert({
        group_order_id: data.id,
        user_id: user.id,
        status: 'joined',
      });

      return data as GroupOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['group-orders'] });
      toast({
        title: 'Group Order Created!',
        description: `Share code: ${data.invite_code}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Group Order',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Join a group order using invite code
 */
export function useJoinGroupOrder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any).rpc('join_group_order', {
        p_invite_code: inviteCode.toUpperCase(),
        p_user_id: user.id,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['group-orders'] });
      queryClient.invalidateQueries({ queryKey: ['group-order', data.group_order_id] });
      toast({
        title: 'Joined Group Order!',
        description: 'You can now add your items.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Join',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Add item to group order
 */
export function useAddGroupOrderItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupOrderId,
      participantId,
      menuItemId,
      itemName,
      itemPrice,
      quantity = 1,
      specialInstructions,
    }: {
      groupOrderId: string;
      participantId: string;
      menuItemId: string;
      itemName: string;
      itemPrice: number;
      quantity?: number;
      specialInstructions?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('group_order_items')
        .insert({
          group_order_id: groupOrderId,
          participant_id: participantId,
          menu_item_id: menuItemId,
          item_name: itemName,
          item_price: itemPrice,
          quantity,
          special_instructions: specialInstructions,
          total_price: itemPrice * quantity,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-order', variables.groupOrderId] });
    },
  });
}

/**
 * Remove item from group order
 */
export function useRemoveGroupOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, groupOrderId }: { itemId: string; groupOrderId: string }) => {
      const { error } = await (supabase as any)
        .from('group_order_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return { itemId, groupOrderId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['group-order', data.groupOrderId] });
    },
  });
}

/**
 * Lock group order (stop accepting items)
 */
export function useLockGroupOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupOrderId: string) => {
      const { error } = await (supabase as any)
        .from('group_orders')
        .update({ status: 'locked', locked_at: new Date().toISOString() })
        .eq('id', groupOrderId);

      if (error) throw error;
      return groupOrderId;
    },
    onSuccess: (groupOrderId) => {
      queryClient.invalidateQueries({ queryKey: ['group-order', groupOrderId] });
      queryClient.invalidateQueries({ queryKey: ['group-orders'] });
      toast({
        title: 'Group Order Locked',
        description: 'No more items can be added. Ready to place order.',
      });
    },
  });
}

/**
 * Get invite link for sharing
 */
export function getGroupOrderInviteLink(inviteCode: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://eatlocal.co.za';
  return `${baseUrl}/group-order/join?code=${inviteCode}`;
}

/**
 * Check if current user is host
 */
export function useIsGroupOrderHost(groupOrder: GroupOrder | null | undefined) {
  const { user } = useAuth();
  return groupOrder?.host_id === user?.id;
}
