import { api } from "../../../api/axios";

// Mirroring the backend response types structurally
export type OrderStatus = 
  | "PENDING"
  | "CONFIRMED"
  | "ASSIGNED"
  | "PICKUP_ASSIGNED"
  | "ARRIVED_AT_PICKUP"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "FAILED";

export interface TrackingEvent {
  id: string;
  status: OrderStatus;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  metadata: any | null;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
  } | null;
}

export interface OrderWithTracking {
  id: string;
  orderNumber: string;
  customerId: string;
  pickupAddress: string;
  pickupContact: string;
  dropAddress: string;
  dropContact: string;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  actualWeight: number;
  volumetricWeight: number | null;
  billableWeight: number;
  orderType: string;
  paymentType: string;
  calculatedPrice: number;
  status: OrderStatus;
  description: string | null;
  specialInstructions: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  dropLatitude?: number | null;
  dropLongitude?: number | null;
  distanceKm?: number | string | null;
  estimatedDuration?: number | null;
  pickupArea?: {
    id: string;
    name: string;
    zone: { id: string; name: string };
  } | null;
  dropArea?: {
    id: string;
    name: string;
    zone: { id: string; name: string };
  } | null;
  assignments: {
    id: string;
    status: string;
    agent: {
      id: string;
      name: string;
      phone: string | null;
      agentStatus?: {
        rating: number | string | null;
        vehicleType: string | null;
        availability: string | null;
      } | null;
    }
  }[];
  trackingEvents: TrackingEvent[];
}

export interface OrderResponse {
  success: boolean;
  data: OrderWithTracking;
}

export const trackingApi = {
  getOrderWithTracking: async (orderId: string): Promise<OrderWithTracking> => {
    const response = await api.get<OrderResponse>(`/orders/${orderId}`);
    return response.data.data;
  },

  getTimeline: async (orderId: string): Promise<any> => {
    const response = await api.get(`/tracking/${orderId}`);
    return response.data.data;
  },

  rescheduleDelivery: async (orderId: string, requestedDate: string) => {
    const response = await api.post(`/orders/${orderId}/reschedule`, { requestedDate });
    return response.data;
  },
};
