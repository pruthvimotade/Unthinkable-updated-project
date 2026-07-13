import { prisma } from "../lib/prisma";
import { logger } from "../config/logger.config";
import { haversineKm } from "./geo.utils";

/**
 * Zone saturation utility functions for checking agent capacity in zones.
 */

/**
 * Checks if a zone has saturated agent capacity (>80% of agents at full capacity).
 * Logs a warning if saturation is detected.
 * 
 * @param zoneId - The ID of the zone to check
 * @param zoneName - The name of the zone for logging purposes
 */
export async function checkZoneSaturation(zoneId: string, zoneName: string) {
  try {
    const areas = await prisma.area.findMany({
      select: { id: true, zoneId: true, latitude: true, longitude: true }
    });
    const onlineAgents = await prisma.agentStatus.findMany({
      where: { availability: "ONLINE" }
    });

    const agents = onlineAgents.filter(agent => {
      if (agent.latitude === null || agent.longitude === null) return false;
      let minDistance = Infinity;
      let closestAreaZoneId = null;

      for (const area of areas) {
        if (area.latitude === null || area.longitude === null) continue;
        const dist = haversineKm(
          Number(agent.latitude),
          Number(agent.longitude),
          Number(area.latitude),
          Number(area.longitude)
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestAreaZoneId = area.zoneId;
        }
      }
      return closestAreaZoneId === zoneId;
    });

    if (agents.length === 0) return;

    const overloadedCount = agents.filter(a => a.activeOrders >= a.capacity).length;
    const saturationRatio = overloadedCount / agents.length;

    if (saturationRatio > 0.8) {
      logger.warn({ zoneId, zoneName, saturationRatio }, "ZONE SATURATION DETECTED: >80% agents are overloaded!");
    }
  } catch (error) {
    logger.error({ error, zoneId }, "Error checking zone saturation");
  }
}

/**
 * Calculates zone saturation data for all zones.
 * Returns an array of zones that are saturated (>80% capacity).
 * 
 * @returns Array of saturated zones with their saturation ratios
 */
export async function calculateZoneSaturations(): Promise<Array<{ zoneId: string; zoneName: string; ratio: number; isSaturated: boolean }>> {
  const zones = await prisma.zone.findMany();
  const zoneSaturations: Array<{ zoneId: string; zoneName: string; ratio: number; isSaturated: boolean }> = [];

  const areas = await prisma.area.findMany({
    select: { id: true, zoneId: true, latitude: true, longitude: true }
  });
  const onlineAgents = await prisma.agentStatus.findMany({
    where: { availability: "ONLINE" }
  });

  for (const z of zones) {
    const agents = onlineAgents.filter(agent => {
      if (agent.latitude === null || agent.longitude === null) return false;
      let minDistance = Infinity;
      let closestAreaZoneId = null;

      for (const area of areas) {
        if (area.latitude === null || area.longitude === null) continue;
        const dist = haversineKm(
          Number(agent.latitude),
          Number(agent.longitude),
          Number(area.latitude),
          Number(area.longitude)
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestAreaZoneId = area.zoneId;
        }
      }
      return closestAreaZoneId === z.id;
    });

    if (agents.length > 0) {
      const overloadedCount = agents.filter(a => a.activeOrders >= a.capacity).length;
      const ratio = overloadedCount / agents.length;
      if (ratio > 0.8) {
        zoneSaturations.push({
          zoneId: z.id,
          zoneName: z.name,
          ratio,
          isSaturated: true
        });
      }
    }
  }

  return zoneSaturations;
}
