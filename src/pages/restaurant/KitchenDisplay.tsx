/**
 * Kitchen Display System (KDS) - Full-screen order management for restaurant kitchens
 * Features: Real-time orders, sound alerts, one-tap status updates, auto-sort by wait time
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CheckCircle,
  Clock,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  ChefHat,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { useRestaurantProfile } from '@/hooks/useRestaurantData';
import { useRestaurantOrders } from '@/hooks/useRestaurantOrders';
import { cn } from '@/lib/utils';

const KitchenDisplay = () => {
  const { data: restaurant } = useRestaurantProfile();
  const { orders, updateOrderStatus, isLoading } = useRestaurantOrders(restaurant?.id);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());
  const prevOrderCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update clock every 30s
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter active orders
  const activeOrders = orders.filter(order =>
    ['pending', 'confirmed', 'preparing', 'ready_for_pickup'].includes(order.status)
  );

  // Sort by wait time (oldest first)
  const sortedOrders = [...activeOrders].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Sound alert for new orders
  useEffect(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    if (pendingCount > prevOrderCountRef.current && soundEnabled) {
      playAlert();
    }
    prevOrderCountRef.current = pendingCount;
  }, [orders, soundEnabled]);

  const playAlert = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
      // Play second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start();
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc2.stop(ctx.currentTime + 0.5);
      }, 200);
    } catch {
      // Audio not available
    }
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getWaitTime = (createdAt: string) => {
    const diff = Math.floor((now - new Date(createdAt).getTime()) / 60000);
    return diff;
  };

  const getWaitColor = (minutes: number) => {
    if (minutes < 5) return 'text-green-400';
    if (minutes < 10) return 'text-yellow-400';
    if (minutes < 15) return 'text-orange-400';
    return 'text-red-400 animate-pulse';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'NEW', color: 'bg-blue-600', nextStatus: 'confirmed', nextLabel: 'Accept' };
      case 'confirmed':
        return { label: 'ACCEPTED', color: 'bg-orange-600', nextStatus: 'preparing', nextLabel: 'Start Prep' };
      case 'preparing':
        return { label: 'PREPARING', color: 'bg-yellow-600', nextStatus: 'ready_for_pickup', nextLabel: 'Ready' };
      case 'ready_for_pickup':
        return { label: 'READY', color: 'bg-green-600', nextStatus: null, nextLabel: null };
      default:
        return { label: status, color: 'bg-muted', nextStatus: null, nextLabel: null };
    }
  };

  const handleNextStatus = (orderId: string, nextStatus: string) => {
    updateOrderStatus({ orderId, status: nextStatus });
  };

  const handlePrint = (order: typeof orders[0]) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;
    
    const items = order.order_items?.map(item => 
      `<div style="margin:4px 0;font-size:14px;">
        <strong>${item.quantity}x</strong> ${item.menu_item?.name || 'Item'}
        ${item.special_instructions ? `<div style="font-size:11px;color:#666;margin-left:20px;">${item.special_instructions}</div>` : ''}
      </div>`
    ).join('') || '';

    printWindow.document.write(`
      <html><head><title>Order #${order.order_number}</title>
      <style>body{font-family:monospace;padding:10px;margin:0;} h2{margin:0;} hr{border:1px dashed #000;}</style>
      </head><body>
      <h2>Order #${order.order_number}</h2>
      <p>${new Date(order.created_at).toLocaleString()}</p>
      <p><strong>${((order as any).fulfillment_type || 'DELIVERY').toUpperCase()}</strong></p>
      <hr/>
      ${items}
      <hr/>
      ${order.special_instructions ? `<p><strong>Notes:</strong> ${order.special_instructions}</p><hr/>` : ''}
      <p><strong>Total: R${Number(order.total).toFixed(2)}</strong></p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-xl">Loading Kitchen Display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* KDS Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <ChefHat className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Kitchen Display</h1>
          <span className="text-gray-400">|</span>
          <span className="text-gray-400">{restaurant?.name}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Order Stats */}
          <div className="flex items-center gap-3 text-sm">
            <Badge className="bg-blue-600 text-white px-3 py-1">
              {orders.filter(o => o.status === 'pending').length} New
            </Badge>
            <Badge className="bg-yellow-600 text-white px-3 py-1">
              {orders.filter(o => o.status === 'preparing').length} Preparing
            </Badge>
            <Badge className="bg-green-600 text-white px-3 py-1">
              {orders.filter(o => o.status === 'ready_for_pickup').length} Ready
            </Badge>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-gray-400 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-gray-400 hover:text-white"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>

          {/* Clock */}
          <div className="text-lg font-mono text-gray-300">
            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="p-4">
        {sortedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-gray-500">
            <ChefHat className="h-24 w-24 mb-6 opacity-30" />
            <p className="text-2xl font-semibold">No active orders</p>
            <p className="text-lg mt-2">Waiting for new orders...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {sortedOrders.map((order) => {
              const config = getStatusConfig(order.status);
              const waitMinutes = getWaitTime(order.created_at);

              return (
                <Card
                  key={order.id}
                  className={cn(
                    'bg-gray-900 border-gray-800 overflow-hidden flex flex-col',
                    order.status === 'pending' && 'ring-2 ring-blue-500 animate-pulse'
                  )}
                >
                  {/* Card Header */}
                  <div className={cn('px-4 py-3 flex items-center justify-between', config.color)}>
                    <div>
                      <span className="font-bold text-lg">#{order.order_number}</span>
                      <Badge variant="outline" className="ml-2 text-white border-white/30 text-xs">
                        {config.label}
                      </Badge>
                    </div>
                    <div className={cn('flex items-center gap-1 font-mono text-sm font-bold', getWaitColor(waitMinutes))}>
                      <Clock className="h-4 w-4" />
                      {waitMinutes}m
                    </div>
                  </div>

                  {/* Order Type */}
                  <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
                    <Badge variant="outline" className="text-gray-300 border-gray-700">
                      {(order.fulfillment_type || 'delivery').toUpperCase()}
                    </Badge>
                    <span className="text-gray-500 text-xs">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="px-4 py-3 flex-1 space-y-2">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-primary min-w-[24px]">{item.quantity}x</span>
                          <div className="flex-1">
                            <span className="text-white">{item.menu_item?.name || 'Item'}</span>
                            {item.special_instructions && (
                              <p className="text-yellow-400 text-xs mt-0.5">
                                ⚠ {item.special_instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {order.special_instructions && (
                      <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-800 rounded text-xs text-yellow-300">
                        <strong>NOTE:</strong> {order.special_instructions}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 border-t border-gray-800 flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => updateOrderStatus({ orderId: order.id, status: 'cancelled' })}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="flex-[2] bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleNextStatus(order.id, 'confirmed')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                      </>
                    )}
                    {config.nextStatus && order.status !== 'pending' && (
                      <Button
                        size="sm"
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={() => handleNextStatus(order.id, config.nextStatus!)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {config.nextLabel}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(order)}
                      className="border-gray-700 text-gray-400 hover:text-white"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;
