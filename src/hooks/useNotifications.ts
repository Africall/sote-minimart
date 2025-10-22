
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'order' | 'low_stock' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;

    // Subscribe to new orders for notifications
    const orderChannel = supabase.channel('orders-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        if (profile.role === 'cashier' || profile.role === 'admin') {
          toast.info(`New order received: #${payload.new.id.slice(0, 8)}`, {
            description: `From: ${payload.new.guest_name || 'Guest Customer'}`,
            duration: 5000,
          });
          
          // Add to notifications list
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'order',
            title: 'New Order Received',
            message: `Order #${payload.new.id.slice(0, 8)} from ${payload.new.guest_name || 'Guest Customer'}`,
            read: false,
            created_at: payload.new.created_at
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
    };
  }, [profile]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
};
