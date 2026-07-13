import type { Request, Response } from "express";
import { orderService } from "./order.service";
import type { CreateOrderInput, QuoteInput, ListOrdersQuery, OrderIdParam, RescheduleOrderInput } from "./order.validation";

/**
 * POST /api/v1/orders/quote
 *
 * Get a pricing quote without creating an order.
 */
export async function getQuote(req: Request, res: Response): Promise<void> {
  const input = req.body as QuoteInput;
  const result = await orderService.quote(input);

  res.status(200).json({
    success: true,
    message: "Quote generated successfully",
    data: result,
  });
}

/**
 * POST /api/v1/orders
 *
 * Create a new order. Pricing is recalculated server-side.
 */
export async function createOrder(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateOrderInput;
  // Admin can create orders on behalf of customers
  const customerId = (req.user!.role === "ADMIN" && input.customerId) ? input.customerId : req.user!.id;
  const order = await orderService.create(input, customerId);

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: order,
  });
}

/**
 * GET /api/v1/orders/:id
 *
 * Get complete order details with assignments and tracking timeline.
 * Access-controlled: CUSTOMER sees only their own, AGENT only assigned, ADMIN all.
 */
export async function getOrderById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as OrderIdParam;
  const caller = req.user!;
  const order = await orderService.getById(id, caller);

  res.status(200).json({
    success: true,
    data: order,
  });
}

/**
 * GET /api/v1/orders
 *
 * List orders with pagination and optional filters.
 * Access-controlled: CUSTOMER scoped to own orders, AGENT to assigned orders, ADMIN all.
 */
export async function listOrders(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListOrdersQuery;
  const caller = req.user!;
  const result = await orderService.list(query, caller);

  res.status(200).json({
    success: true,
    data: result,
  });
}

/**
 * POST /api/v1/orders/:id/reschedule
 *
 * Reschedule a failed order and push it back to the assignment engine.
 */
export async function rescheduleOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as OrderIdParam;
  const { requestedDate } = req.body as RescheduleOrderInput;
  const caller = req.user!;
  const result = await orderService.rescheduleOrder(id, requestedDate, caller);

  res.status(200).json({
    success: true,
    message: "Order rescheduled successfully",
    data: result,
  });
}
