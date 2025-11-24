import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export const useEmailNotification = () => {
  const { toast } = useToast();

  const sendOrderConfirmation = async (orderData: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    restaurantName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    total: number;
    deliveryAddress: string;
    estimatedDelivery: number;
  }) => {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: orderData.customerEmail,
          subject: `Order Confirmation - ${orderData.orderNumber}`,
          type: 'order_confirmation',
          data: orderData
        }
      });

      if (error) throw error;

      logger.success('Order confirmation email sent', { orderNumber: orderData.orderNumber });
    } catch (error: any) {
      logger.error('Failed to send order confirmation email:', error);
      // Don't show error to user - email failure shouldn't block order flow
    }
  };

  const sendOrderStatusUpdate = async (orderData: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    status: string;
    statusMessage: string;
  }) => {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: orderData.customerEmail,
          subject: `Order Update - ${orderData.orderNumber}`,
          type: 'order_status',
          data: orderData
        }
      });

      if (error) throw error;

      logger.success('Order status email sent', { orderNumber: orderData.orderNumber });
    } catch (error: any) {
      logger.error('Failed to send order status email:', error);
    }
  };

  const sendRestaurantAlert = async (orderData: {
    restaurantEmail: string;
    restaurantName: string;
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number }>;
    specialInstructions?: string;
    total: number;
    restaurantPayout: number;
    deliveryAddress: string;
  }) => {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: orderData.restaurantEmail,
          subject: `New Order - ${orderData.orderNumber}`,
          type: 'restaurant_alert',
          data: orderData
        }
      });

      if (error) throw error;

      logger.success('Restaurant alert email sent', { orderNumber: orderData.orderNumber });
    } catch (error: any) {
      logger.error('Failed to send restaurant alert email:', error);
    }
  };

  const sendDeliveryAssignment = async (orderData: {
    deliveryPartnerEmail: string;
    deliveryPartnerName: string;
    orderNumber: string;
    restaurantName: string;
    pickupAddress: string;
    deliveryAddress: string;
    distance: number;
    earnings: number;
  }) => {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: orderData.deliveryPartnerEmail,
          subject: `New Delivery Assignment - ${orderData.orderNumber}`,
          type: 'delivery_assignment',
          data: orderData
        }
      });

      if (error) throw error;

      logger.success('Delivery assignment email sent', { orderNumber: orderData.orderNumber });
    } catch (error: any) {
      logger.error('Failed to send delivery assignment email:', error);
    }
  };

  return {
    sendOrderConfirmation,
    sendOrderStatusUpdate,
    sendRestaurantAlert,
    sendDeliveryAssignment,
  };
};
