import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock, User, Calendar } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Subject, Faculty } from '@/integrations/supabase/types';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'timetable' | 'assignment' | 'reschedule' | 'system';
  read: boolean;
  created_at: string;
  data?: any;
}

interface RealTimeNotificationsProps {
  userId: string;
  userRole: 'admin' | 'faculty' | 'student';
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({ userId, userRole }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscription();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to new notifications
    const notificationsSubscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification
          showToastNotification(newNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          updateUnreadCount();
        }
      )
      .subscribe();

    // Subscribe to timetable changes
    const timetableSubscription = supabase
      .channel('timetable_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subject_assignments'
        },
        (payload) => {
          handleTimetableChange(payload);
        }
      )
      .subscribe();

    // Subscribe to reschedule requests
    const rescheduleSubscription = supabase
      .channel('reschedule_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reschedule_requests'
        },
        (payload) => {
          handleRescheduleRequestChange(payload);
        }
      )
      .subscribe();

    return () => {
      notificationsSubscription.unsubscribe();
      timetableSubscription.unsubscribe();
      rescheduleSubscription.unsubscribe();
    };
  };

  const handleTimetableChange = async (payload: any) => {
    if (payload.eventType === 'INSERT') {
      // New assignment
      const assignment = payload.new;
      await createNotification({
        title: 'New Assignment',
        message: `You have been assigned to ${assignment.subject_name} on ${assignment.day} ${assignment.time_slot}`,
        type: 'info',
        category: 'assignment',
        data: assignment
      });
    } else if (payload.eventType === 'UPDATE') {
      // Assignment updated
      const assignment = payload.new;
      await createNotification({
        title: 'Assignment Updated',
        message: `Your assignment for ${assignment.subject_name} has been updated`,
        type: 'info',
        category: 'assignment',
        data: assignment
      });
    } else if (payload.eventType === 'DELETE') {
      // Assignment removed
      const assignment = payload.old;
      await createNotification({
        title: 'Assignment Removed',
        message: `Your assignment for ${assignment.subject_name} has been removed`,
        type: 'warning',
        category: 'assignment',
        data: assignment
      });
    }
  };

  const handleRescheduleRequestChange = async (payload: any) => {
    if (payload.eventType === 'INSERT') {
      // New reschedule request
      const request = payload.new;
      if (request.faculty_id === userId) {
        await createNotification({
          title: 'Reschedule Request Submitted',
          message: `Your reschedule request for ${request.subject_name} has been submitted`,
          type: 'info',
          category: 'reschedule',
          data: request
        });
      }
    } else if (payload.eventType === 'UPDATE') {
      // Reschedule request status changed
      const request = payload.new;
      if (request.faculty_id === userId) {
        const statusMessage = request.status === 'approved' 
          ? 'Your reschedule request has been approved'
          : request.status === 'rejected'
          ? 'Your reschedule request has been rejected'
          : 'Your reschedule request is under review';

        await createNotification({
          title: `Reschedule Request ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}`,
          message: statusMessage,
          type: request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'error' : 'info',
          category: 'reschedule',
          data: request
        });
      }
    }
  };

  const createNotification = async (notificationData: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: 'timetable' | 'assignment' | 'reschedule' | 'system';
    data?: any;
  }) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          category: notificationData.category,
          read: false,
          data: notificationData.data
        }]);

      if (error) throw error;

    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const showToastNotification = (notification: Notification) => {
    toast({
      title: notification.title,
      description: notification.message,
      duration: 5000,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
        >
          View
        </Button>
      )
    });
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
      updateUnreadCount();

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const updateUnreadCount = () => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <X className="h-5 w-5 text-red-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'timetable':
        return <Calendar className="h-4 w-4" />;
      case 'assignment':
        return <User className="h-4 w-4" />;
      case 'reschedule':
        return <Clock className="h-4 w-4" />;
      case 'system':
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.read ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-gray-50`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1">
                            {getCategoryIcon(notification.category)}
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeNotifications; 