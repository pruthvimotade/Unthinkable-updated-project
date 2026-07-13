import type { OrderStatus, OrderType, PaymentType } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import type { PricingBreakdown } from "../pricing";

// ─── Service Input ──────────────────────────────────────────────────────────

export interface CreateOrderInput {
  pickupAreaId?: string;
  pickupPincode?: string;
  dropAreaId?: string;
  dropPincode?: string;
  pickupAddress: string;
  pickupAddressLine2?: string;
  pickupContact: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupPlaceId: string;
  dropAddress: string;
  dropAddressLine2?: string;
  dropContact: string;
  dropLatitude: number;
  dropLongitude: number;
  dropPlaceId: string;
  length: number;
  width: number;
  height: number;
  actualWeight: number;
  orderType: "B2B" | "B2C";
  paymentType: "PREPAID" | "COD";
  description?: string;
  specialInstructions?: string;
}

export interface ListOrdersQuery {
  page: number;
  limit: number;
  status?: OrderStatus;
  customerId?: string;
  agentId?: string;
  zoneId?: string;
  orderType?: string;
  paymentType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── Repository Types ───────────────────────────────────────────────────────

export interface OrderCreateData {
  orderNumber: string;
  customerId: string;
  pickupAreaId?: string | null;
  dropAreaId?: string | null;
  distanceKm?: Decimal | null;
  estimatedDuration?: number | null;
  pickupAddress: string;
  pickupAddressLine2?: string;
  pickupContact: string;
  pickupLatitude: Decimal;
  pickupLongitude: Decimal;
  pickupPlaceId: string;
  dropAddress: string;
  dropAddressLine2?: string;
  dropContact: string;
  dropLatitude: Decimal;
  dropLongitude: Decimal;
  dropPlaceId: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeight: Decimal;
  volumetricWeight: Decimal;
  billableWeight: Decimal;
  orderType: OrderType;
  paymentType: PaymentType;
  calculatedPrice: Decimal;
  description?: string;
  specialInstructions?: string;
}

// ─── Service Output ─────────────────────────────────────────────────────────

export interface QuoteResponse {
  pricing: PricingBreakdown;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  paymentType: PaymentType;
  calculatedPrice: Decimal;
  actualWeight: Decimal;
  billableWeight: Decimal;
  createdAt: Date;
  updatedAt: Date;
  pickupAddress?: string;
  dropAddress?: string;
  distanceKm?: Decimal | null;
  customer?: { id: string; name: string; phone: string | null };
  assignments?: any[];
}

export interface PaginatedOrders {
  orders: OrderSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
