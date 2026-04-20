/**
 * Custom React hooks
 * Barrel export for hooks
 */

export { useGeolocation } from "./useGeolocation";
export { useMediaQuery } from "./useMediaQuery";
export type {
  GeolocationPosition,
  UseGeolocationResult,
} from "./useGeolocation";
export { useMapStreets } from "./useMapStreets";
export type { UseMapStreetsResult } from "./useMapStreets";
export { useHomepageData } from "./useHomepageData";
export { useLandingTheme } from "./useLandingTheme";
export type { LandingTheme } from "./useLandingTheme";
export { useSyncStatus } from "./useSyncStatus";
export type { UseSyncStatusResult } from "./useSyncStatus";
export { useGpsTraces } from "./useGpsTraces";
export type {
  UseGpsTracesResult,
  UseGpsTracesParams,
  UseGpsTracesAreaParams,
  UseGpsTracesProjectParams,
} from "./useGpsTraces";
