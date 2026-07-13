import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate, authorize } from "../auth";
import { getQuote, createOrder, getOrderById, listOrders, rescheduleOrder } from "./order.controller";
import {
  quoteSchema,
  createOrderSchema,
  orderIdParamSchema,
  listOrdersQuerySchema,
  rescheduleOrderSchema,
} from "./order.validation";

export const orderRouter = Router();

// All order routes require authentication
orderRouter.use(authenticate);

// POST /api/v1/orders/quote — any authenticated user may request a quote
orderRouter.post("/quote", validate(quoteSchema), asyncHandler(getQuote));

// POST /api/v1/orders — CUSTOMER or ADMIN only (AGENT does not create orders)
orderRouter.post("/", authorize("CUSTOMER", "ADMIN"), validate(createOrderSchema), asyncHandler(createOrder));

// GET /api/v1/orders/:id — ownership enforced in the service layer
orderRouter.get(
  "/:id",
  validate(orderIdParamSchema, "params"),
  asyncHandler(getOrderById),
);

// GET /api/v1/orders — ownership enforced in the service layer
orderRouter.get("/", validate(listOrdersQuerySchema, "query"), asyncHandler(listOrders));

// POST /api/v1/orders/:id/reschedule — CUSTOMER or ADMIN (customer reschedules their own)
orderRouter.post(
  "/:id/reschedule",
  authorize("CUSTOMER", "ADMIN"),
  validate(orderIdParamSchema, "params"),
  validate(rescheduleOrderSchema, "body"),
  asyncHandler(rescheduleOrder),
);
