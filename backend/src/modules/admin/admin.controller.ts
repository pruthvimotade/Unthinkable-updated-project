import { Request, Response } from "express";
import { adminService } from "./admin.service";
import * as validation from "./admin.validation";

export const adminController = {
  // Zones
  async getZones(_req: Request, res: Response) {
    const zones = await adminService.getZones();
    res.json({ success: true, data: zones });
  },
  async createZone(req: Request, res: Response) {
    const input = validation.createZoneSchema.parse(req.body);
    const zone = await adminService.createZone(input);
    res.status(201).json({ success: true, data: zone });
  },
  async updateZone(req: Request, res: Response) {
    const input = validation.updateZoneSchema.parse(req.body);
    const zone = await adminService.updateZone(req.params.id as string, input);
    res.json({ success: true, data: zone });
  },

  // Areas
  async getAreas(req: Request, res: Response) {
    const zoneId = req.query.zoneId as string | undefined;
    const areas = await adminService.getAreas(zoneId);
    res.json({ success: true, data: areas });
  },
  async createArea(req: Request, res: Response) {
    const input = validation.createAreaSchema.parse(req.body);
    const area = await adminService.createArea(input);
    res.status(201).json({ success: true, data: area });
  },
  async updateArea(req: Request, res: Response) {
    const input = validation.updateAreaSchema.parse(req.body);
    const area = await adminService.updateArea(req.params.id as string, input);
    res.json({ success: true, data: area });
  },

  // Rate Cards
  async getRateCards(_req: Request, res: Response) {
    const rateCards = await adminService.getRateCards();
    res.json({ success: true, data: rateCards });
  },
  async createRateCard(req: Request, res: Response) {
    const input = validation.createRateCardSchema.parse(req.body);
    const rc = await adminService.createRateCard(input);
    res.status(201).json({ success: true, data: rc });
  },
  async updateRateCard(req: Request, res: Response) {
    const input = validation.updateRateCardSchema.parse(req.body);
    const rc = await adminService.updateRateCard(req.params.id as string, input);
    res.json({ success: true, data: rc });
  },

  // Agents
  async getAgents(_req: Request, res: Response) {
    const agents = await adminService.getAgents();
    res.json({ success: true, data: agents });
  },
  async updateAgentStatus(req: Request, res: Response) {
    const input = validation.updateAgentStatusSchema.parse(req.body);
    const agent = await adminService.updateAgentStatus(req.params.id as string, input.status);
    res.json({ success: true, data: agent });
  },

  // Users
  async getUsers(req: Request, res: Response) {
    const query = validation.getUsersQuerySchema.parse(req.query);
    const result = await adminService.getUsers(query);
    res.json({ success: true, data: result });
  },
  async createStaff(req: Request, res: Response) {
    const input = validation.createUserSchema.parse(req.body);
    const user = await adminService.createStaff(input);
    res.status(201).json({ success: true, data: user });
  },
  async updateUserStatus(req: Request, res: Response) {
    const input = validation.updateAgentStatusSchema.parse(req.body);
    const user = await adminService.updateAgentStatus(req.params.id as string, input.status);
    res.json({ success: true, data: user });
  },

  // Analytics
  async getAnalytics(req: Request, res: Response) {
    const input = validation.getAnalyticsQuerySchema.parse(req.query);
    const analytics = await adminService.getAnalytics(input.dateRange || "today");
    res.json({ success: true, data: analytics });
  },

  // Tracking Override
  async overrideTracking(req: Request, res: Response) {
    const input = validation.overrideTrackingSchema.parse(req.body);
    const order = await adminService.overrideTracking(req.params.orderId as string, input.toStatus, input.reason, req.user!.id);
    res.json({ success: true, data: order });
  }
};
