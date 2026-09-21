/* =====================================================================
   config.js -- ALL THE NUMBERS.
   Change the values in the ENEMIES section to tune enemy difficulty.
   ===================================================================== */
var CONFIG = {
  TILE: 40,
  ROWS: 10,
  PIECE_COLS: 8,
  CANVAS_W: 800,
  CANVAS_H: 400,

  MOVE_SPEED: 0.2,
  JUMP_POWER: 15,
  GRAVITY: 0.5,
  MAX_FALL: 16,
  PLAYER_SIZE: 32,
  PLAYER_RADIUS: 16,

  LINE_WIDTH: 3,
  DOT_DISTANCE: 0.55,

  // --- adjustable enemy variables --------------------------------------
  ENEMY_START_DISTANCE: 280,
  ENEMY_SPAWN_HEIGHT: 100,
  CUOBID_SPEED: 1.05,
  CUOBID_SIZE: 36,
  DRONE_FOLLOW_RATE: 0.035,
  DRONE_HEIGHT_ABOVE_PLAYER: 105,
  DRONE_BULLET_SPEED: 8,
  DRONE_BULLET_LIFE: 100,
  DRONE_SHOT_INTERVAL: 11,
  DRONE_SHOTS: 3,
  DRONE_FIRE_TIME: 45,
  EVIL_SPIKE_WARNING_TIME: 35,
  EVIL_SPIKE_DASH_SPEED: 6,
  EVIL_SPIKE_DASH_TIME: 42,
  EVIL_SPIKE_SIZE: 36,
  GREEN_BALL_COUNT: 4,
  GREEN_BALL_SPEED: 0.045,
  GREEN_BALL_MAX_SPEED: 2.8,
  GREEN_BALL_BOUNCE: 9,
  GREEN_BALL_SIZE: 30,

  START_LEVEL: 0
};
