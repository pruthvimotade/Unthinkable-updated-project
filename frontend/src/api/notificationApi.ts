import { api } from "./axios";

export interface Notification {
  id: string;
  userId: string;
  orderId?: string;
  title: string;
  message: string;
  channel: "EMAIL" | "SMS" | "IN_APP";
  isRead: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  data: Notification[];
}

export const notificationApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<GetNotificationsResponse>("/notifications");
    return (response.data.data as any[]).map((n: any) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.body, // Map backend body to frontend message
      channel: n.channel,
      isRead: n.status === "READ", // Map backend status to frontend isRead
      metadata: n.metadata,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put("/notifications/read-all");
  }
};
