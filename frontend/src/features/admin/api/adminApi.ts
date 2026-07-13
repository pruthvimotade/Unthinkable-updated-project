import { api } from "../../../api/axios";
import type { OrderWithTracking, TrackingEvent } from "../../tracking/api/trackingApi";

export interface AggregatedAdminData {
  stats: {
    totalOrders: number;
    todaysOrders: number;
    delivered: number;
    deliveredOrders: number;
    pendingOrders: number;
    assignedOrders: number;
    outForDelivery: number;
    failedDeliveries: number;
    activeAgents: number;
    availableAgents: number;
    totalAgents: number;
    totalCustomers: number;
    revenue: number;
    zoneSaturations: Array<{ zoneId: string; zoneName: string; ratio: number; isSaturated: boolean }>;
  };
  recentOrders: OrderWithTracking[];
  recentAssignments: any[];
  recentTracking: TrackingEvent[];
}

export const adminApi = {
  /**
   * Fetches the latest 100 orders and their full payloads to compute analytics
   * strictly using existing backend APIs without any mock data.
   */
  getDashboardData: async (): Promise<AggregatedAdminData> => {
    const { data } = await api.get<{ data: AggregatedAdminData }>("/admin/analytics");
    return data.data;
  },

  autoAssign: async (orderId: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.post(`/assignments/auto/${orderId}`);
    return response.data;
  },

  manualAssign: async (orderId: string, payload: { agentId: string; assignmentScore?: number; reason?: string }): Promise<{ success: boolean; data: any }> => {
    const response = await api.post(`/assignments/manual/${orderId}`, payload);
    return response.data;
  },

  getAgents: async (): Promise<Array<{ id: string; name: string; email: string; phone: string | null; agentStatus: any }>> => {
    const response = await api.get("/admin/agents");
    return response.data.data;
  },

  updateAgentStatus: async (id: string, status: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.patch(`/admin/agents/${id}/status`, { status });
    return response.data.data;
  },

  // Zones
  getZones: async () => {
    const response = await api.get("/admin/zones");
    return response.data.data;
  },
  createZone: async (payload: { name: string; code: string }): Promise<{ success: boolean; data: any }> => {
    const response = await api.post("/admin/zones", payload);
    return response.data.data;
  },
  updateZone: async (id: string, payload: { name?: string; code?: string }): Promise<{ success: boolean; data: any }> => {
    const response = await api.patch(`/admin/zones/${id}`, payload);
    return response.data.data;
  },

  // Areas
  getAreas: async (zoneId?: string) => {
    const response = await api.get("/admin/areas", { params: { zoneId } });
    return response.data.data;
  },
  createArea: async (payload: { name: string; code: string; pincode: string; zoneId: string; latitude: number; longitude: number }): Promise<{ success: boolean; data: any }> => {
    const response = await api.post("/admin/areas", payload);
    return response.data.data;
  },
  updateArea: async (id: string, payload: { name?: string; code?: string; pincode?: string; zoneId?: string; latitude?: number; longitude?: number }): Promise<{ success: boolean; data: any }> => {
    const response = await api.patch(`/admin/areas/${id}`, payload);
    return response.data.data;
  },

  // Rate Cards
  getRateCards: async () => {
    const response = await api.get("/admin/rate-cards");
    return response.data.data;
  },
  createRateCard: async (payload: { name: string; rateType: string; orderType: string; basePrice: number; perUnitPrice?: number; minWeight?: number; maxWeight?: number; codSurcharge?: number; isActive?: boolean }): Promise<{ success: boolean; data: any }> => {
    const response = await api.post("/admin/rate-cards", payload);
    return response.data.data;
  },
  updateRateCard: async (id: string, payload: { name?: string; rateType?: string; orderType?: string; basePrice?: number; perUnitPrice?: number; minWeight?: number; maxWeight?: number; codSurcharge?: number; isActive?: boolean }): Promise<{ success: boolean; data: any }> => {
    const response = await api.patch(`/admin/rate-cards/${id}`, payload);
    return response.data.data;
  },

  // Users
  getUsers: async (params?: { page?: number; limit?: number; role?: string; status?: string }) => {
    const response = await api.get("/admin/users", { params });
    return response.data.data;
  },
  createUser: async (payload: { email: string; password: string; name: string; phone?: string; role: string }): Promise<{ success: boolean; data: any }> => {
    const response = await api.post("/admin/users", payload);
    return response.data.data;
  },
  updateUserStatus: async (id: string, status: string) => {
    const response = await api.patch(`/admin/users/${id}/status`, { status });
    return response.data.data;
  },

  // Customers (legacy reference, keeping just in case)
  getCustomers: async () => {
    const response = await api.get("/admin/users", { params: { role: "CUSTOMER" } });
    return response.data.data.users; // Note: returned from paginated structure
  },

  // Override Tracking
  overrideTracking: async (orderId: string, payload: { toStatus: string; reason: string }): Promise<{ success: boolean; data: any }> => {
    const response = await api.patch(`/admin/tracking/${orderId}/override`, payload);
    return response.data.data;
  }
};
