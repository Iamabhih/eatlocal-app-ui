import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface InventoryItem {
  id: string;
  restaurant_id: string;
  menu_item_id: string | null;
  name: string;
  sku: string | null;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number | null;
  reorder_point: number | null;
  unit_cost: number | null;
  last_cost: number | null;
  average_cost: number | null;
  is_tracked: boolean;
  is_low_stock: boolean;
  last_restocked_at: string | null;
  created_at: string;
}

export interface StockMovement {
  id: string;
  inventory_item_id: string;
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'waste' | 'transfer';
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  unit_cost: number | null;
  total_cost: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MenuImport {
  id: string;
  restaurant_id: string;
  file_name: string;
  file_url: string;
  file_type: 'csv' | 'xlsx' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors: any[];
  warnings: any[];
  items_created: number;
  items_updated: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface OrderBatch {
  id: string;
  restaurant_id: string;
  batch_number: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  order_count: number;
  item_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  target_completion: string | null;
}

/**
 * Get restaurant inventory
 */
export function useInventory(restaurantId: string) {
  return useQuery({
    queryKey: ['inventory', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          menu_item:menu_items(name, image_url)
        `)
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as InventoryItem[];
    },
    enabled: !!restaurantId,
  });
}

/**
 * Get low stock items
 */
export function useLowStockItems(restaurantId: string) {
  return useQuery({
    queryKey: ['inventory', 'low-stock', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_low_stock', true)
        .order('current_stock');

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as InventoryItem[];
    },
    enabled: !!restaurantId,
  });
}

/**
 * Create inventory item
 */
export function useCreateInventoryItem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'is_low_stock' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.restaurant_id] });
      toast({ title: 'Item Added', description: 'Inventory item has been created.' });
    },
  });
}

/**
 * Update inventory item
 */
export function useUpdateInventoryItem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      restaurantId,
      ...updates
    }: {
      id: string;
      restaurantId: string;
    } & Partial<InventoryItem>) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.restaurantId] });
      toast({ title: 'Item Updated' });
    },
  });
}

/**
 * Record stock movement
 */
export function useRecordStockMovement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inventoryItemId,
      restaurantId,
      movementType,
      quantity,
      unitCost,
      notes,
      referenceType,
      referenceId,
    }: {
      inventoryItemId: string;
      restaurantId: string;
      movementType: StockMovement['movement_type'];
      quantity: number;
      unitCost?: number;
      notes?: string;
      referenceType?: string;
      referenceId?: string;
    }) => {
      // Record the movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          inventory_item_id: inventoryItemId,
          movement_type: movementType,
          quantity,
          unit_cost: unitCost,
          total_cost: unitCost ? unitCost * Math.abs(quantity) : null,
          notes,
          reference_type: referenceType,
          reference_id: referenceId,
          created_by: user?.id,
        });

      if (movementError) throw movementError;

      // Update current stock
      const { data: item } = await supabase
        .from('inventory_items')
        .select('current_stock')
        .eq('id', inventoryItemId)
        .single();

      const newStock = (item?.current_stock || 0) + quantity;

      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          current_stock: newStock,
          last_restocked_at: quantity > 0 ? new Date().toISOString() : undefined,
          last_cost: unitCost,
        })
        .eq('id', inventoryItemId);

      if (updateError) throw updateError;

      return { inventoryItemId, newStock };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements', variables.inventoryItemId] });
      toast({ title: 'Stock Updated' });
    },
  });
}

/**
 * Get stock movement history
 */
export function useStockMovements(inventoryItemId: string, limit: number = 50) {
  return useQuery({
    queryKey: ['stock-movements', inventoryItemId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          created_by_user:profiles!stock_movements_created_by_fkey(full_name)
        `)
        .eq('inventory_item_id', inventoryItemId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as StockMovement[];
    },
    enabled: !!inventoryItemId,
  });
}

/**
 * Start menu import
 */
export function useStartMenuImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      restaurantId,
      file,
    }: {
      restaurantId: string;
      file: File;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Upload file
      const fileExt = file.name.split('.').pop()?.toLowerCase() as 'csv' | 'xlsx' | 'json';
      const fileName = `${restaurantId}_${Date.now()}.${fileExt}`;
      const storagePath = `menu-imports/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-files')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('business-files')
        .getPublicUrl(storagePath);

      // Create import job
      const { data, error } = await supabase
        .from('menu_imports')
        .insert({
          restaurant_id: restaurantId,
          uploaded_by: user.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: fileExt,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-imports', variables.restaurantId] });
      toast({
        title: 'Import Started',
        description: 'Your menu import is being processed.',
      });
    },
  });
}

/**
 * Get menu imports
 */
export function useMenuImports(restaurantId: string) {
  return useQuery({
    queryKey: ['menu-imports', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_imports')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as MenuImport[];
    },
    enabled: !!restaurantId,
  });
}

/**
 * Get order batches
 */
export function useOrderBatches(restaurantId: string, status?: OrderBatch['status']) {
  return useQuery({
    queryKey: ['order-batches', restaurantId, status],
    queryFn: async () => {
      let query = supabase
        .from('order_batches')
        .select(`
          *,
          batch_orders(order:orders(id, order_number, total, status))
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }

      return data as OrderBatch[];
    },
    enabled: !!restaurantId,
  });
}

/**
 * Create order batch
 */
export function useCreateOrderBatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      restaurantId,
      orderIds,
      targetCompletion,
    }: {
      restaurantId: string;
      orderIds: string[];
      targetCompletion?: Date;
    }) => {
      // Create batch
      const batchNumber = `B${Date.now().toString(36).toUpperCase()}`;

      const { data: batch, error: batchError } = await supabase
        .from('order_batches')
        .insert({
          restaurant_id: restaurantId,
          batch_number: batchNumber,
          order_count: orderIds.length,
          target_completion: targetCompletion?.toISOString(),
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Add orders to batch
      const batchOrders = orderIds.map((orderId, index) => ({
        batch_id: batch.id,
        order_id: orderId,
        sequence_number: index + 1,
      }));

      const { error: ordersError } = await supabase
        .from('batch_orders')
        .insert(batchOrders);

      if (ordersError) throw ordersError;

      return batch;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-batches', variables.restaurantId] });
      toast({ title: 'Batch Created', description: 'Orders have been batched together.' });
    },
  });
}

/**
 * Update batch status
 */
export function useUpdateBatchStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      batchId,
      restaurantId,
      status,
    }: {
      batchId: string;
      restaurantId: string;
      status: OrderBatch['status'];
    }) => {
      const updates: Record<string, any> = { status };

      if (status === 'preparing') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('order_batches')
        .update(updates)
        .eq('id', batchId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-batches', variables.restaurantId] });
    },
  });
}

/**
 * Predict prep time
 */
export function usePredictPrepTime(restaurantId: string, itemCount: number) {
  return useQuery({
    queryKey: ['prep-time-prediction', restaurantId, itemCount],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('predict_prep_time', {
        p_restaurant_id: restaurantId,
        p_item_count: itemCount,
      });

      if (error) {
        // Default prediction if function doesn't exist
        return 15 + itemCount * 3;
      }

      return data as number;
    },
    enabled: !!restaurantId && itemCount > 0,
  });
}

export const MOVEMENT_TYPES = [
  { value: 'purchase', label: 'Purchase', description: 'Stock received from supplier' },
  { value: 'sale', label: 'Sale', description: 'Sold to customer (automatic)' },
  { value: 'adjustment', label: 'Adjustment', description: 'Stock count correction' },
  { value: 'waste', label: 'Waste', description: 'Expired or damaged stock' },
  { value: 'transfer', label: 'Transfer', description: 'Moved to another location' },
] as const;

export const STOCK_UNITS = [
  { value: 'each', label: 'Each' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'l', label: 'Litre (l)' },
  { value: 'ml', label: 'Millilitre (ml)' },
] as const;
