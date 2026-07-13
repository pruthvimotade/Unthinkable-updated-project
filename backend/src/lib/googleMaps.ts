import { logger } from "../config/logger.config";

export interface DistanceResult {
  distanceKm: number;
  durationSeconds: number;
}

/**
 * Calculates road distance between two lat/lng coordinates using Google Distance Matrix API.
 * Returns distance in kilometers and duration in seconds.
 */
export async function getGoogleRoadDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DistanceResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    logger.error("GOOGLE_MAPS_API_KEY is not configured.");
    return null;
  }

  const origins = `${originLat},${originLng}`;
  const destinations = `${destLat},${destLng}`;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      logger.error({ status: response.status, statusText: response.statusText }, "Google Distance Matrix API request failed");
      return null;
    }

    const data = (await response.json()) as any;
    if (data.status !== "OK") {
      logger.error({ status: data.status, errorMessage: data.error_message }, "Google Distance Matrix API returned non-OK status");
      return null;
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (element?.status !== "OK") {
      logger.error({ elementStatus: element?.status }, "Google Distance Matrix route not found");
      return null;
    }

    const distanceMeters = element.distance.value;
    const durationSeconds = element.duration.value;

    return {
      distanceKm: distanceMeters / 1000,
      durationSeconds: durationSeconds,
    };
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch distance from Google Distance Matrix API");
    return null;
  }
}
