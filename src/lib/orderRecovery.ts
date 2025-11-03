import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

interface PendingOrder {
  orderId: string;
  timestamp: number;
  status: string;
}

const PENDING_ORDERS_KEY = 'pending_orders';
const ORDER_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function savePendingOrder(orderId: string, status: string = 'pending') {
  try {
    const pending = getPendingOrders();
    pending[orderId] = {
      orderId,
      timestamp: Date.now(),
      status,
    };
    localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify(pending));
    logger.log('Saved pending order:', orderId);
  } catch (error) {
    logger.error('Failed to save pending order:', error);
  }
}

export function getPendingOrders(): Record<string, PendingOrder> {
  try {
    const data = localStorage.getItem(PENDING_ORDERS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    logger.error('Failed to get pending orders:', error);
    return {};
  }
}

export function removePendingOrder(orderId: string) {
  try {
    const pending = getPendingOrders();
    delete pending[orderId];
    localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify(pending));
    logger.log('Removed pending order:', orderId);
  } catch (error) {
    logger.error('Failed to remove pending order:', error);
  }
}

export async function recoverPendingOrders() {
  const pending = getPendingOrders();
  const now = Date.now();
  const recovered = [];

  for (const [orderId, order] of Object.entries(pending)) {
    // Skip if too old
    if (now - order.timestamp > ORDER_TIMEOUT) {
      removePendingOrder(orderId);
      continue;
    }

    try {
      // Check order status in database
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (error) {
        logger.error(`Failed to recover order ${orderId}:`, error);
        continue;
      }

      if (data.status !== 'pending') {
        // Order has been processed
        removePendingOrder(orderId);
        recovered.push({ orderId, status: data.status });
      }
    } catch (error) {
      logger.error(`Error recovering order ${orderId}:`, error);
    }
  }

  return recovered;
}
