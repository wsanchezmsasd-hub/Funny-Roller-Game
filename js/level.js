/* =====================================================================
   level.js  --  BUILDING THE WORLD OUT OF PIECES.
   ===================================================================== */
var Level = {
  pieces: null, levels: null, grid: [], cols: 0, name: "", startX: 0, startY: 0
};

Level.loadData = function (whenDone) {
  fetch("data/pieces.json").then(function (r) { return r.json(); }).then(function (piecesFile) {
    Level.pieces = piecesFile;
    return fetch("data/levels.json");
  }).then(function (r) { return r.json(); }).then(function (levelsFile) {
    Level.levels = levelsFile.levels;
    whenDone();
  }).catch(function (error) {
    document.getElementById("message").textContent = "Could not load the level files. Check data/pieces.json and data/levels.json.";
    console.error(error);
  });
};

Level.build = function (levelNumber) {
  var level = Level.levels[levelNumber];
  Level.name = level.name; Level.grid = []; Level.cols = level.pieces.length * CONFIG.PIECE_COLS;
  for (var row = 0; row < CONFIG.ROWS; row++) { Level.grid.push(""); }
  for (var p = 0; p < level.pieces.length; p++) {
    var piece = Level.pieces[level.pieces[p]];
    if (!piece) { console.error("No piece named '" + level.pieces[p] + "' in data/pieces.json"); piece = Level.pieces.flat; }
    for (var r = 0; r < CONFIG.ROWS; r++) { Level.grid[r] += piece[r]; }
  }
  Level.findStart();
};

Level.findStart = function () {
  for (var row = 0; row < CONFIG.ROWS; row++) for (var col = 0; col < Level.cols; col++) {
    if (Level.charAt(col, row) === "S") { Level.startX = col * CONFIG.TILE; Level.startY = row * CONFIG.TILE; return; }
  }
  Level.startX = 0; Level.startY = 0;
};
Level.charAt = function (col, row) { if (row < 0 || row >= CONFIG.ROWS || col < 0 || col >= Level.cols) return "."; return Level.grid[row].charAt(col); };
Level.isSolid = function (col, row) { return Level.charAt(col, row) === "#"; };
Level.isSpike = function (col, row) { return Level.charAt(col, row) === "^"; };
Level.isFinish = function (col, row) { return Level.charAt(col, row) === "F"; };
Level.pixelWidth = function () { return Level.cols * CONFIG.TILE; };
