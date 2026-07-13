import { api } from "../../../api/axios";
import type { GetOrdersResponse } from "../../orders/api/orderApi";

export const dispatcherApi = {
  getPendingOrders: async (): Promise<GetOrdersResponse["data"]> => {
    const response = await api.get<GetOrdersResponse>("/orders", {
      params: { status: "PENDING", limit: 50, page: 1 }
    });
    return response.data.data;
  },
  autoAssign: async (orderId: string) => {
    const response = await api.post(`/assignments/auto/${orderId}`);
    return response.data;
  }
};
