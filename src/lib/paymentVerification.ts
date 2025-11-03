import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

export async function verifyPaymentStatus(orderId: string, maxAttempts: number = 10) {
  let attempts = 0;
  const checkInterval = 2000; // 2 seconds

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const { data: order, error } = await supabase
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .single();

        if (error) throw error;

        logger.log(`Payment verification attempt ${attempts}:`, order.status);

        if (order.status === 'confirmed') {
          clearInterval(interval);
          resolve(order);
        } else if (order.status === 'cancelled') {
          clearInterval(interval);
          reject(new Error('Payment was cancelled or failed'));
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error('Payment verification timeout'));
        }
      } catch (error) {
        logger.error('Payment verification error:', error);
        clearInterval(interval);
        reject(error);
      }
    }, checkInterval);
  });
}

export async function createPaymentBackup(orderData: any) {
  // Store order data in localStorage as backup
  const backupKey = `payment_backup_${orderData.id}`;
  const backup = {
    ...orderData,
    timestamp: Date.now(),
    status: 'pending_verification',
  };
  
  try {
    localStorage.setItem(backupKey, JSON.stringify(backup));
    logger.log('Payment backup created:', backupKey);
  } catch (error) {
    logger.error('Failed to create payment backup:', error);
  }
}

export function getPaymentBackup(orderId: string) {
  const backupKey = `payment_backup_${orderId}`;
  try {
    const backup = localStorage.getItem(backupKey);
    return backup ? JSON.parse(backup) : null;
  } catch (error) {
    logger.error('Failed to retrieve payment backup:', error);
    return null;
  }
}

export function clearPaymentBackup(orderId: string) {
  const backupKey = `payment_backup_${orderId}`;
  try {
    localStorage.removeItem(backupKey);
    logger.log('Payment backup cleared:', backupKey);
  } catch (error) {
    logger.error('Failed to clear payment backup:', error);
  }
}
