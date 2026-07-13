import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../auth";
import { calculatePrice } from "./pricing.controller";
import { calculatePriceSchema } from "./pricing.validation";

export const pricingRouter = Router();

// POST /api/v1/pricing/calculate (protected — any authenticated user)
pricingRouter.post(
  "/calculate",
  authenticate,
  validate(calculatePriceSchema),
  asyncHandler(calculatePrice),
);
