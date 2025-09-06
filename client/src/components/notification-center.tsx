import { useState, useEffect } from "react";
import { Bell, BellRing, X, Check, MessageCircle, Heart, Download, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/auth-context";

interface Notification {
  id: string;
  type: 'comment' | 'like' | 'download' | 'rating' | 'follow' | 'upload' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: {
    noteId?: string;
    userId?: string;
    userName?: string;
    rating?: number;
  };
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Simulate real-time notifications (in a real app, this would be WebSocket)
  useEffect(() => {
    if (!user) return;

    // Mock notifications for demonstration
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'comment',
        title: 'New Comment',
        message: 'Sarah Chen commented on your Calculus Notes',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        data: { noteId: 'note1', userId: 'user1', userName: 'Sarah Chen' }
      },
      {
        id: '2',
        type: 'rating',
        title: 'New Rating',
        message: 'Alex Johnson rated your Physics Lab Report 5 stars',
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        data: { noteId: 'note2', userId: 'user2', userName: 'Alex Johnson', rating: 5 }
      },
      {
        id: '3',
        type: 'download',
        title: 'Popular Note',
        message: 'Your Chemistry Notes have reached 100+ downloads!',
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        data: { noteId: 'note3' }
      },
      {
        id: '4',
        type: 'follow',
        title: 'New Follower',
        message: 'Maria Garcia started following you',
        isRead: true,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        data: { userId: 'user4', userName: 'Maria Garcia' }
      },
      {
        id: '5',
        type: 'system',
        title: 'Weekly Summary',
        message: 'Your notes were viewed 247 times this week',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      }
    ];

    setNotifications(mockNotifications);

    // Simulate receiving new notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new notification every 30 seconds
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: ['comment', 'like', 'download', 'rating'][Math.floor(Math.random() * 4)] as any,
          title: 'New Activity',
          message: `Someone ${['commented on', 'liked', 'downloaded', 'rated'][Math.floor(Math.random() * 4)]} your note!`,
          isRead: false,
          createdAt: new Date(),
          data: { noteId: 'new-note' }
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 19)]); // Keep only 20 notifications
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'like': return <Heart className="h-4 w-4 text-red-500" />;
      case 'download': return <Download className="h-4 w-4 text-green-500" />;
      case 'rating': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'follow': return <User className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'comment': return 'bg-blue-50 border-blue-200';
      case 'like': return 'bg-red-50 border-red-200';
      case 'download': return 'bg-green-50 border-green-200';
      case 'rating': return 'bg-yellow-50 border-yellow-200';
      case 'follow': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          data-testid="notification-trigger"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              data-testid="notification-badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="end" 
        sideOffset={5}
        data-testid="notification-popover"
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                  data-testid="mark-all-read"
                >
                  Mark all read
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    You'll see activity updates here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${
                        !notification.isRead ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                      data-testid={`notification-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className={`text-sm mt-1 ${
                            !notification.isRead ? 'text-gray-700' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                            </span>
                            
                            {notification.type === 'rating' && notification.data?.rating && (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: notification.data.rating }).map((_, i) => (
                                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          data-testid={`delete-notification-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Action buttons for specific notification types */}
                      {notification.type === 'comment' && (
                        <div className="mt-3 flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                            data-testid={`reply-comment-${index}`}
                          >
                            Reply
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                            data-testid={`view-note-${index}`}
                          >
                            View Note
                          </Button>
                        </div>
                      )}

                      {notification.type === 'follow' && (
                        <div className="mt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                            data-testid={`view-profile-${index}`}
                          >
                            View Profile
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {notifications.length > 0 && (
              <>
                <Separator />
                <div className="p-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    data-testid="view-all-notifications"
                  >
                    View All Notifications
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}