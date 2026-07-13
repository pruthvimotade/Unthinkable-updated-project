import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate, authorize } from "../auth";
import { autoAssign, manualAssign, reassign, getCandidates, acceptAssignment, rejectAssignment } from "./assignment.controller";
import { orderIdParamSchema, manualAssignSchema, reassignSchema } from "./assignment.validation";

export const assignmentRouter = Router();

// Routes accessible by delivery agents
assignmentRouter.post("/:id/accept", authenticate, asyncHandler(acceptAssignment));
assignmentRouter.post("/:id/reject", authenticate, asyncHandler(rejectAssignment));

// All subsequent assignment routes require ADMIN role
assignmentRouter.use(authenticate, authorize("ADMIN"));

// GET /api/v1/assignments/candidates/:orderId
assignmentRouter.get(
  "/candidates/:orderId",
  validate(orderIdParamSchema, "params"),
  asyncHandler(getCandidates),
);

// POST /api/v1/assignments/auto/:orderId
assignmentRouter.post(
  "/auto/:orderId",
  validate(orderIdParamSchema, "params"),
  asyncHandler(autoAssign),
);

// POST /api/v1/assignments/manual/:orderId
assignmentRouter.post(
  "/manual/:orderId",
  validate(orderIdParamSchema, "params"),
  validate(manualAssignSchema),
  asyncHandler(manualAssign),
);

// POST /api/v1/assignments/reassign/:orderId
assignmentRouter.post(
  "/reassign/:orderId",
  validate(orderIdParamSchema, "params"),
  validate(reassignSchema),
  asyncHandler(reassign),
);
