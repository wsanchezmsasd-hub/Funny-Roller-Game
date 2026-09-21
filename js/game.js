/* =====================================================================
   game.js -- THE RULES AND THE LOOP.
   ===================================================================== */
var Game = { mode: "playing", levelNumber: 0, nextEnemy: null };

Game.startLevel = function (levelNumber, enemyType) {
  var resetRoster = levelNumber === CONFIG.START_LEVEL && !enemyType;
  Game.levelNumber = levelNumber;
  Level.build(levelNumber);
  Player.reset();
  Enemy.reset(enemyType, resetRoster);
  Game.mode = "playing";
  Game.showMessage("Level " + (levelNumber + 1));
};

Game.nextLevel = function () {
  var nextLevel = Game.levelNumber + 1;
  if (nextLevel < Level.levels.length) { Game.showEnemyChoice(nextLevel); return; }
  Game.mode = "won";
  Game.showMessage("You beat every level! Press R to try again.");
};

Game.showEnemyChoice = function (nextLevel) {
  Game.mode = "choice";
  var panel = document.getElementById("enemy-choice"), cards = document.getElementById("enemy-cards");
  cards.innerHTML = "";
  Game.showMessage("Choose an enemy for level " + (nextLevel + 1));
  Enemy.randomChoices().forEach(function (choice) {
    var button = document.createElement("button");
    button.className = "enemy-card";
    button.innerHTML = "<strong>" + choice.name + "</strong><span>" + choice.description + "</span>";
    button.addEventListener("click", function () { panel.hidden = true; Game.startLevel(nextLevel, choice.type); });
    cards.appendChild(button);
  });
  panel.hidden = false;
};

Game.showMessage = function (text) { document.getElementById("message").textContent = text; };

Game.update = function () {
  if (Input.restart) {
    document.getElementById("enemy-choice").hidden = true;
    Game.startLevel(CONFIG.START_LEVEL);
    return;
  }
  if (Game.mode !== "playing") { return; }
  Player.update();
  Enemy.update();
  if (Player.isDead() || Enemy.hitsPlayer()) {
    // Leave the current enemy objects on screen while the death message is shown.
    // The next restart deliberately returns to level 0 and clears the roster.
    Game.levelNumber = CONFIG.START_LEVEL;
    Game.mode = "dead";
    Game.showMessage("You hit something. Press R to return to level 0.");
    return;
  }
  if (Player.hasWon()) { Game.nextLevel(); }
};

Game.loop = function () {
  Game.update(); Draw.updateCamera(); Draw.everything(); window.requestAnimationFrame(Game.loop);
};
