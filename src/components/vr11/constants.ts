export const USER_EYE_HEIGHT = 1.6;
export const SCENE_GROUP_POSITION: [number, number, number] = [0, -2, 0];
export const SPAWN_LOCAL: [number, number, number] = [35, 25, -40];

export const WORLD_OFFSET: [number, number, number] = [
  -(SPAWN_LOCAL[0] + SCENE_GROUP_POSITION[0]),
  USER_EYE_HEIGHT - (SPAWN_LOCAL[1] + SCENE_GROUP_POSITION[1]),
  -(SPAWN_LOCAL[2] + SCENE_GROUP_POSITION[2]),
];

export const TIMELINE_START_DATE = new Date(2014, 9, 7, 0, 0, 0, 0);
export const TIMELINE_END_DATE = new Date(2026, 4, 25, 0, 0, 0, 0);

export const MENU_INITIAL_POSITION: [number, number, number] = [0, 1.38, -1.28];
export const MENU_INITIAL_SCALE = 1;

export const DASHBOARD_SLOTS = [
  {
    position: [-1.05, 1.3, -1.55] as [number, number, number],
    rotation: [0, 0.3, 0] as [number, number, number],
  },
  {
    position: [0, 1.28, -1.75] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  {
    position: [1.05, 1.3, -1.55] as [number, number, number],
    rotation: [0, -0.3, 0] as [number, number, number],
  },
] as const;

export const DASHBOARD_INITIAL_SCALE = 0.92;

export const MINIATURE_INITIAL_POSITION: [number, number, number] = [
  0, 0.72, -1.25,
];

export const MINIATURE_MODEL_OPTIONS = [
  { id: "montesinho", label: "MONTESINHO" },
  { id: "aguieira", label: "AGUIEIRA" },
  { id: "gebelim", label: "GEBELIM" },
  { id: "drone", label: "DRONE" },
  { id: "numerical", label: "NUMERICAL" },
] as const;

export type MiniatureModelKey = (typeof MINIATURE_MODEL_OPTIONS)[number]["id"];

export const DEFAULT_MINIATURE_MODEL: MiniatureModelKey = "montesinho";
export const AGUIEIRA_MINIATURE_MODEL_URL = "/aguieiramodel-optimized.glb";
export const GEBELIM_MINIATURE_MODEL_URL = "/countdown.glb";
export const DRONE_MINIATURE_MODEL_URL = "/droner.glb";
export const NUMERICAL_MINIATURE_MODEL_URL = "/numericalmodelanim2.glb";
export const NUMERICAL_ANIMATION_LAST_FRAME = 30;
