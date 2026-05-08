export const W = 900;
export const H = 506; // 16:9 logical resolution

export const GROUND_Y = H - 80;
export const GRAVITY = 1800;          // px/s²
export const JUMP_VEL = -680;         // px/s
export const BASE_SPEED = 380;        // px/s
export const SPEED_INCREMENT = 18;    // px/s per 100 score
export const MAX_SPEED = 1100;

export const PLAYER_W = 36;
export const PLAYER_H = 52;
export const PLAYER_X = 120;

// Obstacle types
export const OBS_TYPES = ['low', 'mid', 'high', 'wide'];

// Coin
export const COIN_R = 10;

// Colors
export const COL = {
  sky1:    '#0d0d1a',
  sky2:    '#1a0a2e',
  ground:  '#1e1b4b',
  groundL: '#312e81',
  player:  '#7c3aed',
  playerG: '#06b6d4',
  shadow:  '#0000004d',
  obs:     '#f43f5e',
  obsD:    '#9f1239',
  coin:    '#fbbf24',
  coinG:   '#f59e0b',
  star:    '#ffffff',
  trail:   '#7c3aed88',
};
