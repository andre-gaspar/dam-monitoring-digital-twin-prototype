export const MODEL_URL = "/montesinholayersDecim.glb";
export const TWO_TILES_MODEL_URL = "/montesinholayersDecim4tiles.glb";
export const LAKEBED_MODEL_URL = "/montesinholayersDecim3.glb";

export const CAMERA_LERP_SPEED = 4.5;
export const PLAYBACK_INTERVAL_MS = 90;

export const CREST_LEVELING_START: [number, number, number] = [
  20.728, 14.378, -75.028,
];

export const CREST_LEVELING_END: [number, number, number] = [
  57.951, 14.374, -76.129,
];

export const WATER_LEVEL_Y = 13.8125;
export const WATER_POSITION: [number, number, number] = [
  45,
  WATER_LEVEL_Y,
  -150,
];
export const WATER_SIZE_X = 90;
export const WATER_SIZE_Z = 150;
export const WATER_ROTATION_Y = 0;

export const RAIN_AREA_SIZE_X = WATER_SIZE_X * 1.6;
export const RAIN_AREA_SIZE_Y = 95;
export const RAIN_AREA_SIZE_Z = WATER_SIZE_Z * 1.35;
export const RAIN_AREA_CENTER_Y_OFFSET = RAIN_AREA_SIZE_Y / 2 - 8;

export const RAIN_CLOUD_Y_OFFSET =
  RAIN_AREA_CENTER_Y_OFFSET + RAIN_AREA_SIZE_Y / 2 + 38;
export const RAIN_CLOUD_BOUNDS: [number, number, number] = [
  RAIN_AREA_SIZE_X * 1.35,
  82,
  RAIN_AREA_SIZE_Z * 1.12,
];

export const WATER_VISUAL_MIN_Y = WATER_LEVEL_Y - 7.0;
export const WATER_VISUAL_MAX_Y = WATER_LEVEL_Y + 0.5;

export const GEO_BOUNDS = {
  minLon: -6.806515,
  maxLon: -6.794082,
  minLat: 41.947846,
  maxLat: 41.965707,
};
