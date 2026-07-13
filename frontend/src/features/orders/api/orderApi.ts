import { api } from "../../../api/axios";

export interface Area {
  id: string;
  name: string;
  code: string;
  pincode: string;
  zoneId: string;
}

export interface CalculatePricePayload {
  pickupAreaId?: string;
  pickupPincode?: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropAreaId?: string;
  dropPincode?: string;
  dropLatitude: number;
  dropLongitude: number;
  length: number;
  width: number;
  height: number;
  actualWeight: number;
  orderType: "B2B" | "B2C";
  paymentType: "PREPAID" | "COD";
}

export interface CalculatePriceResponse {
  success: boolean;
  data: {
    pricing: {
      pickupZone?: { id: string; name: string; code: string };
      dropZone?: { id: string; name: string; code: string };
      zoneType: string;
      actualWeight: number;
      volumetricWeight: number;
      billableWeight: number;
      basePrice: number;
      codCharge: number;
      finalPrice: number;
    }
  }
}

export interface CreateOrderPayload extends CalculatePricePayload {
  pickupAddress: string;
  pickupAddressLine2?: string;
  pickupContact: string;
  pickupPlaceId: string;
  dropAddress: string;
  dropAddressLine2?: string;
  dropContact: string;
  dropPlaceId: string;
  description?: string;
  specialInstructions?: string;
  customerId?: string;
  assignmentMode?: "AUTO" | "MANUAL";
}

export interface CreateOrderResponse {
  success: boolean;
  data: {
    id: string;
    orderNumber: string;
    status: string;
  }
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  orderType: string;
  paymentType: string;
  calculatedPrice: string | number;
  createdAt: string;
}

export interface GetOrdersResponse {
  success: boolean;
  data: {
    orders: OrderItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  orderType?: string;
  paymentType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const orderApi = {
  calculatePrice: async (payload: CalculatePricePayload): Promise<CalculatePriceResponse> => {
    const response = await api.post<CalculatePriceResponse>("/orders/quote", payload);
    return response.data;
  },
  
  createOrder: async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
    const response = await api.post<CreateOrderResponse>("/orders", payload);
    return response.data;
  },

  getOrders: async (params?: GetOrdersParams): Promise<GetOrdersResponse> => {
    const response = await api.get<GetOrdersResponse>("/orders", { params });
    return response.data;
  },

  getAreas: async (zoneId?: string): Promise<{ success: boolean; data: Area[] }> => {
    const response = await api.get<{ success: boolean; data: Area[] }>("/admin/areas", { params: { zoneId } });
    return response.data;
  }
};
