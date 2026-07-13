import { Router } from "express";
import { adminController } from "./admin.controller";
import { authenticate, authorize } from "../auth/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

export const adminRouter = Router();

// Zones (Public/Auth reading, Admin writing)
adminRouter.get("/zones", authenticate, asyncHandler(adminController.getZones));
adminRouter.post("/zones", authenticate, authorize("ADMIN"), asyncHandler(adminController.createZone));
adminRouter.patch("/zones/:id", authenticate, authorize("ADMIN"), asyncHandler(adminController.updateZone));

// Areas
adminRouter.get("/areas", authenticate, asyncHandler(adminController.getAreas));
adminRouter.post("/areas", authenticate, authorize("ADMIN"), asyncHandler(adminController.createArea));
adminRouter.patch("/areas/:id", authenticate, authorize("ADMIN"), asyncHandler(adminController.updateArea));

// Rate Cards
adminRouter.get("/rate-cards", authenticate, authorize("ADMIN"), asyncHandler(adminController.getRateCards));
adminRouter.post("/rate-cards", authenticate, authorize("ADMIN"), asyncHandler(adminController.createRateCard));
adminRouter.patch("/rate-cards/:id", authenticate, authorize("ADMIN"), asyncHandler(adminController.updateRateCard));

// Users & Agents
adminRouter.get("/agents", authenticate, authorize("ADMIN"), asyncHandler(adminController.getAgents));
adminRouter.patch("/agents/:id/status", authenticate, authorize("ADMIN"), asyncHandler(adminController.updateAgentStatus));

adminRouter.get("/users", authenticate, authorize("ADMIN"), asyncHandler(adminController.getUsers));
adminRouter.post("/users", authenticate, authorize("ADMIN"), asyncHandler(adminController.createStaff));
adminRouter.patch("/users/:id/status", authenticate, authorize("ADMIN"), asyncHandler(adminController.updateUserStatus));

// Analytics
adminRouter.get("/analytics", authenticate, authorize("ADMIN"), asyncHandler(adminController.getAnalytics));

// Order Tracking Override
adminRouter.patch("/tracking/:orderId/override", authenticate, authorize("ADMIN"), asyncHandler(adminController.overrideTracking));
