import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { useToast } from './use-toast';

export interface Notification {
  id: string;
  workspaceId: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: any;
  createdAt: string;
}

export function useNotifications() {
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    if (!activeWorkspace) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mappedNotifications = (data || []).map(notification => ({
        id: notification.id,
        workspaceId: notification.workspace_id,
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        metadata: notification.metadata,
        createdAt: notification.created_at
      }));

      setNotifications(mappedNotifications);
      setUnreadCount(mappedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!activeWorkspace) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('workspace_id', activeWorkspace.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'workspaceId'>) => {
    if (!activeWorkspace) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          workspace_id: activeWorkspace.id,
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          read: notification.read,
          metadata: notification.metadata
        });

      if (error) throw error;

      // Show toast for important notifications
      if (['campaign_completed', 'template_rejected', 'webhook_error'].includes(notification.type)) {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'webhook_error' || notification.type === 'template_rejected' ? 'destructive' : 'default'
        });
      }

      await loadNotifications();
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!activeWorkspace) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `workspace_id=eq.${activeWorkspace.id}`
        },
        (payload) => {
          const newNotification = {
            id: payload.new.id,
            workspaceId: payload.new.workspace_id,
            userId: payload.new.user_id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            read: payload.new.read,
            metadata: payload.new.metadata,
            createdAt: payload.new.created_at
          };

          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.read) {
            setUnreadCount(prev => prev + 1);
          }

          // Show toast for real-time notifications
          if (['campaign_completed', 'template_rejected', 'webhook_error'].includes(newNotification.type)) {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.type === 'webhook_error' || newNotification.type === 'template_rejected' ? 'destructive' : 'default'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspace]);

  useEffect(() => {
    loadNotifications();
  }, [activeWorkspace]);

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    createNotification
  };
}