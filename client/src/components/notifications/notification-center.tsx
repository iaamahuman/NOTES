import { useState, useEffect } from "react";
import { Bell, X, Check, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationCenterProps {
  notifications?: Notification[];
  onNotificationRead?: (id: string) => void;
  onNotificationDismiss?: (id: string) => void;
  onMarkAllRead?: () => void;
}

const typeIcons = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: AlertCircle,
};

const typeColors = {
  info: "text-blue-600 bg-blue-50",
  success: "text-green-600 bg-green-50",
  warning: "text-yellow-600 bg-yellow-50",
  error: "text-red-600 bg-red-50",
};

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Note uploaded successfully",
    message: "Your calculus notes have been uploaded and are now available for download.",
    type: "success",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false,
    actionUrl: "/notes/1",
    actionText: "View Note"
  },
  {
    id: "2",
    title: "New comment on your note",
    message: "Someone commented on your 'Advanced Algorithms' note.",
    type: "info",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    actionUrl: "/notes/2",
    actionText: "View Comment"
  },
  {
    id: "3",
    title: "Profile updated",
    message: "Your profile information has been successfully updated.",
    type: "success",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
  },
  {
    id: "4",
    title: "Storage limit warning",
    message: "You've used 80% of your storage quota. Consider upgrading your plan.",
    type: "warning",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    read: true,
    actionText: "Upgrade Plan"
  }
];

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${days}d ago`;
  }
}

export function NotificationCenter({
  notifications = mockNotifications,
  onNotificationRead,
  onNotificationDismiss,
  onMarkAllRead
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(notifications);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const unreadCount = localNotifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      const updated = localNotifications.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      );
      setLocalNotifications(updated);
      onNotificationRead?.(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = localNotifications.filter(n => n.id !== id);
    setLocalNotifications(updated);
    onNotificationDismiss?.(id);
  };

  const handleMarkAllRead = () => {
    const updated = localNotifications.map(n => ({ ...n, read: true }));
    setLocalNotifications(updated);
    onMarkAllRead?.();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="notifications-button"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-96">
          {localNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {localNotifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 cursor-pointer transition-colors group",
                      !notification.read && "bg-blue-50/30"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "p-2 rounded-full flex-shrink-0",
                        typeColors[notification.type]
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={cn(
                              "text-sm font-medium text-gray-900",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={(e) => handleDismiss(notification.id, e)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {notification.actionText && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-7 text-xs"
                          >
                            {notification.actionText}
                          </Button>
                        )}
                      </div>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {localNotifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
