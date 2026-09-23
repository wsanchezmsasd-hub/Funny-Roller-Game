/* =====================================================================
   level.js  --  BUILDING THE WORLD OUT OF PIECES.
   ===================================================================== */
var Level = {
  pieces: null, levels: null, grid: [], cols: 0, name: "", startX: 0, startY: 0,
  redTesseracts: [], goldTesseracts: [], fakeTesseracts: [], goldActive: false, collapseActive: false, collapseTimer: 0, collapseWarning: 0, collapseColumn: -1
};

Level.loadData = function (whenDone) {
  fetch("data/pieces.json").then(function (r) { if (!r.ok) throw new Error("Could not load data/pieces.json"); return r.json(); }).then(function (piecesFile) {
    Level.pieces = piecesFile;
    return fetch("data/levels.json");
  }).then(function (r) { if (!r.ok) throw new Error("Could not load data/levels.json"); return r.json(); }).then(function (levelsFile) {
    Level.levels = levelsFile.levels;
    whenDone();
  }).catch(function (error) {
    document.getElementById("message").textContent = "Could not load the level files. Check data/pieces.json and data/levels.json.";
    console.error(error);
  });
};

Level.build = function (levelNumber) {
  var level = Level.getDefinition(levelNumber);
  Level.name = level.name; Level.grid = []; Level.redTesseracts = []; Level.goldTesseracts = []; Level.fakeTesseracts = []; Level.goldActive = false; Level.collapseActive = false; Level.collapseTimer = 0; Level.collapseWarning = 0; Level.collapseColumn = -1; Level.cols = level.pieces.length * CONFIG.PIECE_COLS;
  for (var row = 0; row < CONFIG.ROWS; row++) { Level.grid.push(""); }
  for (var p = 0; p < level.pieces.length; p++) {
    var piece = Level.pieces[level.pieces[p]];
    if (!piece) { console.error("No piece named '" + level.pieces[p] + "' in data/pieces.json"); piece = Level.pieces.flat; }
    for (var r = 0; r < CONFIG.ROWS; r++) { Level.grid[r] += piece[r]; }
  }
  Level.findStart();
  Level.placeTesseracts(level.pieces);
};

Level.getDefinition = function (levelNumber) {
  if (levelNumber < Level.levels.length) return Level.levels[levelNumber];
  var source = Level.levels[levelNumber % Level.levels.length], pieces = source.pieces.slice(1, -1);
  var extraRounds = Math.floor(levelNumber / Level.levels.length) + 1;
  var generatedPieces = ["start"];
  for (var i = 0; i < extraRounds + 1; i++) generatedPieces = generatedPieces.concat(pieces);
  generatedPieces.push("finish");
  return { name: "Endless Level " + (levelNumber + 1), pieces: generatedPieces };
};

Level.placeTesseracts = function (pieceNames) {
  var authored = [];
  pieceNames.forEach(function (pieceName, pieceIndex) {
    var spots = Level.pieces._tesseracts && Level.pieces._tesseracts[pieceName];
    if (!spots) return;
    spots.forEach(function (spot) { authored.push({ x: (pieceIndex * CONFIG.PIECE_COLS + spot[0]) * CONFIG.TILE + CONFIG.TILE / 2, y: spot[1] * CONFIG.TILE + CONFIG.TILE / 2 }); });
  });
  if (authored.length) {
    Level.addTesseractSlots(authored.slice(0, CONFIG.RED_TESSERACTS_PER_LEVEL));
    Level.placeFakeTesseracts();
    return;
  }
  var candidates = [];
  for (var col = 2; col < Level.cols - 2; col++) for (var row = 1; row < CONFIG.ROWS - 1; row++) {
    if (Level.charAt(col, row) === "." && Level.charAt(col, row - 1) === "." && !Level.isSpike(col, row + 1) && !Level.isSpike(col, row)) candidates.push({ x: col * CONFIG.TILE + CONFIG.TILE / 2, y: row * CONFIG.TILE + CONFIG.TILE / 2 });
  }
  var step = Math.max(1, Math.floor(candidates.length / CONFIG.RED_TESSERACTS_PER_LEVEL)), selected = [];
  for (var i = 0; i < CONFIG.RED_TESSERACTS_PER_LEVEL && candidates.length; i++) {
    var red = candidates[Math.min(i * step, candidates.length - 1)];
    if (!selected.some(function (tesseract) { return tesseract.x === red.x && tesseract.y === red.y; })) selected.push(red);
  }
  Level.addTesseractSlots(selected);
  Level.placeFakeTesseracts();
};

Level.addTesseractSlots = function (spots) {
  var fakeCount = Game.hasCurse("fiveCube") ? Math.min(5, spots.length) : 0;
  for (var i = 0; i < spots.length; i++) {
    if (i < fakeCount) Level.fakeTesseracts.push({ x: spots[i].x, y: spots[i].y });
    else {
      Level.redTesseracts.push({ x: spots[i].x, y: spots[i].y, collected: false });
      Level.goldTesseracts.push({ x: spots[i].x, y: spots[i].y, collected: false });
    }
  }
};
Level.placeFakeTesseracts = function () {};

Level.updateTesseracts = function () {
  var playerX = Player.x + CONFIG.PLAYER_SIZE / 2, playerY = Player.y + CONFIG.PLAYER_SIZE / 2;
  Level.fakeTesseracts.forEach(function (tesseract) { if (Math.hypot(playerX - tesseract.x, playerY - tesseract.y) < 24) Player.fakeTesseractHit = true; });
  var collectionRange = 24 + Game.blessings.magnet * 20;
  if (Game.hasCurse("unstablePlain")) collectionRange *= 2;
  Level.redTesseracts.forEach(function (tesseract) {
    if (!tesseract.collected && Math.hypot(playerX - tesseract.x, playerY - tesseract.y) < collectionRange) tesseract.collected = true;
  });
  if (!Level.goldActive && Level.redTesseracts.every(function (tesseract) { return tesseract.collected; })) { Level.goldActive = true; Level.collapseActive = true; Level.collapseTimer = Game.hasCurse("unstablePlain") ? 24 : 150; }
  if (Level.goldActive) Level.goldTesseracts.forEach(function (tesseract) {
    if (!tesseract.collected && Math.hypot(playerX - tesseract.x, playerY - tesseract.y) < collectionRange) { tesseract.collected = true; Game.goldTesseracts++; }
  });
};

Level.updateCollapse = function () {
  if (!Level.collapseActive) return;
  Level.collapseTimer--;
  if (Level.collapseTimer > 0) return;
  Level.collapseTimer = Game.hasCurse("unstablePlain") ? 24 : 150;
  var column = Math.floor(Player.x / CONFIG.TILE) - 7;
  while (column >= 0 && Level.columnHasTesseract(column)) column--;
  if (column < 0 || column >= Level.cols) return;
  Level.collapseColumn = column;
  Level.collapseWarning = 18;
};
Level.columnHasTesseract = function (column) {
  return Level.redTesseracts.concat(Level.goldTesseracts).concat(Level.fakeTesseracts).some(function (tesseract) { return Math.floor(tesseract.x / CONFIG.TILE) === column && !tesseract.collected; });
};
Level.finishCollapse = function () {
  if (Level.collapseWarning <= 0 || Level.collapseColumn < 0) return;
  Level.collapseWarning--;
  if (Level.collapseWarning > 0) return;
  var column = Level.collapseColumn;
  for (var row = 0; row < CONFIG.ROWS; row++) if (Level.isSolid(column, row)) Level.grid[row] = Level.grid[row].substring(0, column) + "." + Level.grid[row].substring(column + 1);
  Level.collapseColumn = -1;
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
Level.isFinish = function (col, row) { return Level.goldActive && Level.charAt(col, row) === "F"; };
Level.destroyCircle = function (x, y, radius) {
  var firstCol = Math.floor((x - radius) / CONFIG.TILE), lastCol = Math.floor((x + radius) / CONFIG.TILE);
  var firstRow = Math.floor((y - radius) / CONFIG.TILE), lastRow = Math.floor((y + radius) / CONFIG.TILE);
  for (var row = firstRow; row <= lastRow; row++) for (var col = firstCol; col <= lastCol; col++) {
    var centerX = col * CONFIG.TILE + CONFIG.TILE / 2, centerY = row * CONFIG.TILE + CONFIG.TILE / 2;
    if (Math.hypot(centerX - x, centerY - y) <= radius && Level.charAt(col, row) === "#") {
      if (row >= 0 && row < CONFIG.ROWS && col >= 0 && col < Level.cols) Level.grid[row] = Level.grid[row].substring(0, col) + "." + Level.grid[row].substring(col + 1);
    }
  }
  var playerX = Player.x + CONFIG.PLAYER_SIZE / 2, playerY = Player.y + CONFIG.PLAYER_SIZE / 2;
  var dx = playerX - x, dy = playerY - y, distance = Math.hypot(dx, dy) || 1;
  if (distance < radius + CONFIG.PLAYER_RADIUS) {
    var force = CONFIG.BAZOOKA_KNOCKBACK * (1 - Math.min(distance / radius, 1));
    Player.vx += dx / distance * force;
    Player.vy += dy / distance * force;
  }
};
Level.pixelWidth = function () { return Level.cols * CONFIG.TILE; };
