import type { Request, Response } from "express";
import { assignmentService } from "./assignment.service";
import type { ManualAssignInput, OrderIdParam } from "./assignment.validation";

/**
 * POST /api/v1/assignments/auto/:orderId
 *
 * Automatically assign the best-scoring agent to the order.
 */
export async function autoAssign(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params as unknown as OrderIdParam;
  const assignedById = req.user!.id;

  const assignment = await assignmentService.autoAssign(orderId, assignedById);

  res.status(201).json({
    success: true,
    message: "Order auto-assigned successfully",
    data: assignment,
  });
}

/**
 * POST /api/v1/assignments/manual/:orderId
 *
 * Admin manually assigns a specific agent to the order.
 */
export async function manualAssign(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params as unknown as OrderIdParam;
  const { agentId } = req.body as ManualAssignInput;
  const assignedById = req.user!.id;

  const assignment = await assignmentService.manualAssign(
    orderId,
    agentId,
    assignedById,
  );

  res.status(200).json({
    success: true,
    message: "Order manually assigned successfully",
    data: assignment,
  });
}

/**
 * POST /api/v1/assignments/reassign/:orderId
 *
 * Reassign an order to a new agent or auto-assign if no agentId provided.
 */
export async function reassign(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params as unknown as OrderIdParam;
  const { agentId, reason } = req.body;
  const caller = req.user!;

  const assignment = await assignmentService.reassign(
    orderId,
    { agentId, reason },
    caller.id,
  );

  res.status(200).json({
    success: true,
    message: "Order reassigned successfully",
    data: assignment,
  });
}

/**
 * GET /api/v1/assignments/candidates/:orderId
 *
 * Retrieve scored agent candidates for manual assignment modal.
 */
export async function getCandidates(req: Request, res: Response): Promise<void> {
  const { orderId } = req.params as unknown as OrderIdParam;
  const candidates = await assignmentService.getCandidates(orderId);

  res.status(200).json({
    success: true,
    data: candidates,
  });
}

/**
 * POST /api/v1/assignments/:id/accept
 */
export async function acceptAssignment(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const result = await assignmentService.acceptAssignment(id, req.user!.id as string, req.user!.role as string);

  res.status(200).json({
    success: true,
    message: "Assignment accepted successfully",
    data: result,
  });
}

/**
 * POST /api/v1/assignments/:id/reject
 */
export async function rejectAssignment(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const result = await assignmentService.rejectAssignment(id, req.user!.id as string, req.user!.role as string);

  res.status(200).json({
    success: true,
    message: "Assignment rejected and reassigned successfully",
    data: result,
  });
}
