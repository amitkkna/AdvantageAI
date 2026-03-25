'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { Bell, Check, CheckCheck, Wifi, WifiOff } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchNotifications = useCallback(() => {
    api.get('/notifications', { params: { limit: 50 } })
      .then(({ data }) => setNotifications(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Connect WebSocket for real-time updates
    const socket = connectSocket();
    if (socket) {
      socket.on('connect', () => setWsConnected(true));
      socket.on('disconnect', () => setWsConnected(false));
      socket.on('notification', (data: any) => {
        setNotifications((prev) => [data, ...prev]);
        toast({ title: data.title, description: data.message });
      });
      socket.on('refresh', () => fetchNotifications());
    }

    return () => {
      disconnectSocket();
    };
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast({ title: 'All read', description: 'All notifications marked as read.' });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
          <Badge variant="outline" className={wsConnected ? 'text-green-600' : 'text-muted-foreground'}>
            {wsConnected ? <><Wifi className="h-3 w-3 mr-1" />Live</> : <><WifiOff className="h-3 w-3 mr-1" />Offline</>}
          </Badge>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCheck className="mr-2 h-4 w-4" />Mark All Read
        </Button>
      </div>
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-12 bg-muted rounded" /></CardContent></Card>)}</div>
        ) : notifications.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">No notifications</CardContent></Card>
        ) : (
          notifications.map((n) => (
            <Card key={n.id} className={n.isRead ? 'opacity-60' : 'border-l-4 border-l-primary'}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className={`h-5 w-5 ${n.isRead ? 'text-muted-foreground' : 'text-primary'}`} />
                  <div>
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {!n.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}><Check className="h-4 w-4" /></Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
