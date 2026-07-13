import { Router } from "express";
import { healthRouter } from "./health.routes";
import { authRouter } from "../modules/auth";
import { pricingRouter } from "../modules/pricing";
import { orderRouter } from "../modules/order";
import { assignmentRouter } from "../modules/assignment";
import { trackingRouter } from "../modules/tracking";
import { adminRouter } from "../modules/admin";
import { agentRouter } from "./agent.routes";

import { notificationRouter } from "../modules/notification/notification.routes";

/**
 * Single point where every feature module's router gets mounted.
 * Their routers are imported and registered here — nothing else needs to change.
 */
export const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/pricing", pricingRouter);
router.use("/orders", orderRouter);
router.use("/assignments", assignmentRouter);
router.use("/tracking", trackingRouter);
router.use("/admin", adminRouter);
router.use("/agents", agentRouter);
router.use("/notifications", notificationRouter);
