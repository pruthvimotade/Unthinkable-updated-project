import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Package } from "lucide-react";
import { notificationApi } from "../api/notificationApi";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationApi.getNotifications,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setIsOpen(false);
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[28rem]">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsReadMutation.mutate()}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
                  <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                  <p>No new notifications</p>
                </div>
              ) : (
                <ul className="divide-y dark:divide-slate-800">
                  {notifications.map((notification) => (
                    <li 
                      key={notification.id} 
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-0.5 rounded-full p-2 h-8 w-8 flex items-center justify-center shrink-0 ${!notification.isRead ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium pt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <button 
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                            className="text-blue-600 hover:text-blue-700 p-1 shrink-0 h-fit"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
