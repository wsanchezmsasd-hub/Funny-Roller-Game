/* =====================================================================
   config.js  --  ALL THE NUMBERS.

   This is the first file to open if you want to change how the game
   FEELS. Every number here is safe to change. Change one at a time and
   play the game after each change.
   ===================================================================== */

var CONFIG = {

  // --- the world grid -------------------------------------------------
  TILE: 40,           // how many pixels wide and tall one grid square is
  ROWS: 10,           // how many rows tall every level piece is
  PIECE_COLS: 8,      // how many columns wide every level piece is

  // --- the screen -----------------------------------------------------
  CANVAS_W: 800,
  CANVAS_H: 400,

  // --- how the player moves -------------------------------------------
  MOVE_VELOCITY: 0,   // velocity per frame left and right
  MAX_VELOCITY: 8.5,  // How fast the player can move
  MOVE_FRICTION: 0.75,//how the much the player slows down
  JUMP_POWER: 10,     // how hard the jump pushes UP. bigger = higher
  GRAVITY: 0.5,       // how hard the world pulls DOWN. bigger = heavier
  MAX_FALL: 16,       // fastest the player is allowed to fall

  // --- the player's size ----------------------------------------------
  PLAYER_SIZE: 32,    // the player collides as a 32x32 box
  PLAYER_RADIUS: 16,  // ...but is DRAWN as a circle this big

  // --- drawing --------------------------------------------------------
  LINE_WIDTH: 3,      // thickness of every black outline
  DOT_DISTANCE: 0.55, // how far the off-center dot sits from the middle
                      // 0 = dead center, 1 = right on the edge

  // --- rules ----------------------------------------------------------
  START_LEVEL: 0      // which level in data/levels.json to load first
};
