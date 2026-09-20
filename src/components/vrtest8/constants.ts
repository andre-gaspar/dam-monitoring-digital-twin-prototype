export const USER_EYE_HEIGHT = 1.6;
export const SCENE_GROUP_POSITION: [number, number, number] = [0, -2, 0];
export const SPAWN_LOCAL: [number, number, number] = [35, 25, -40];

export const WORLD_OFFSET: [number, number, number] = [
  -(SPAWN_LOCAL[0] + SCENE_GROUP_POSITION[0]),
  USER_EYE_HEIGHT - (SPAWN_LOCAL[1] + SCENE_GROUP_POSITION[1]),
  -(SPAWN_LOCAL[2] + SCENE_GROUP_POSITION[2]),
];

export const TIMELINE_START_DATE = new Date(2023, 0, 12, 0, 0, 0, 0);
export const TIMELINE_END_DATE = new Date(2025, 0, 8, 0, 0, 0, 0);

export const DASHBOARD_INITIAL_POSITION: [number, number, number] = [
  -0.58,
  1.18,
  -1.25,
];
export const DASHBOARD_INITIAL_SCALE = 1;

export const CHART_INITIAL_POSITION: [number, number, number] = [
  0.62,
  1.18,
  -1.42,
];
export const CHART_INITIAL_SCALE = 0.58;
