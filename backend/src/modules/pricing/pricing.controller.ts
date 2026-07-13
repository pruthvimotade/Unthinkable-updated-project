import type { Request, Response } from "express";
import { pricingService } from "./pricing.service";
import type { CalculatePriceInput } from "./pricing.validation";

/**
 * POST /api/v1/pricing/calculate
 *
 * Calculate shipping price without creating an order.
 */
export async function calculatePrice(req: Request, res: Response): Promise<void> {
  const input = req.body as CalculatePriceInput;
  const breakdown = await pricingService.calculate(input);

  res.status(200).json({
    success: true,
    message: "Price calculated successfully",
    data: breakdown,
  });
}
