import { api } from "../../../api/axios";
import type { OrderWithTracking } from "../../tracking/api/trackingApi";
import type { OrderStatus } from "../../tracking/api/trackingApi";

export interface PaginatedOrders {
  orders: { id: string; status: OrderStatus }[];
  total: number;
}

export const agentApi = {
  /**
   * Fetch orders assigned to the agent using the agentId filter.
   */
  getAssignedOrders: async (agentId?: string): Promise<OrderWithTracking[]> => {
    const { data: { data: response } } = await api.get<{ data: PaginatedOrders }>("/orders", {
      params: { limit: 100, page: 1, agentId }
    });
    return (response.orders || []) as unknown as OrderWithTracking[];
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus, description: string): Promise<any> => {
    const { data } = await api.patch(`/tracking/${orderId}/status`, {
      status,
      description,
    });
    return data;
  },

  pingLocation: async (latitude: number, longitude: number): Promise<any> => {
    const { data } = await api.post("/agents/ping", { latitude, longitude });
    return data;
  },

  acceptAssignment: async (assignmentId: string): Promise<any> => {
    const { data } = await api.post(`/assignments/${assignmentId}/accept`);
    return data;
  },

  rejectAssignment: async (assignmentId: string): Promise<any> => {
    const { data } = await api.post(`/assignments/${assignmentId}/reject`);
    return data;
  },

  getNotifications: async (): Promise<any[]> => {
    const { data } = await api.get("/agents/notifications");
    return data.data;
  }
};
