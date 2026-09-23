/* =====================================================================
   classes.js -- ROUND CLASS SELECTION AND PLAYER WEAPONS
   ===================================================================== */
var Classes = {
  selected: null,
  weapons: {
    bazooka: { name: "Bazooka", damage: 85, ammo: 3, reload: 500, description: "Heavy shots. Destroys terrain and launches you." },
    ak47: { name: "AK-47", damage: 7, ammo: 20, reload: 270, description: "Rapid fire. Throw it with right click; it returns and can deal 65 damage." },
    pistols: { name: "Pistols", damage: 4, ammo: 24, reload: 180, description: "Rapid fire. Right click to dash toward the mouse." }
  },
  ammo: 0, reloadTimer: 0, mouse: { x: 0, y: 0, down: false }, bullets: [], thrown: null, dashTimer: 0,
  originalStart: null, originalUpdate: null, originalDraw: null
};

Classes.showChoice = function () {
  var panel = document.getElementById("class-choice"), cards = document.getElementById("class-cards");
  if (!panel || !cards) return;
  cards.innerHTML = "";
  Object.keys(Classes.weapons).forEach(function (key) {
    var w = Classes.weapons[key], button = document.createElement("button");
    button.className = "class-card";
    button.innerHTML = "<strong>" + w.name + "</strong><span>" + w.description + "</span><span>" + w.damage + " DMG · " + w.ammo + " ammo · " + (w.reload / 60).toFixed(1) + "s reload</span>";
    button.onclick = function () { Classes.choose(key); };
    cards.appendChild(button);
  });
  panel.hidden = false;
};
Classes.choose = function (key) {
  Classes.selected = key; Classes.ammo = Classes.weapons[key].ammo; Classes.reloadTimer = 0;
  Classes.bullets = []; Classes.thrown = null; Classes.dashTimer = 0;
  document.getElementById("class-choice").hidden = true;
  Game.mode = "playing";
  if (Classes.pendingStart) { var start = Classes.pendingStart; Classes.pendingStart = null; start(); }
  Game.showMessage(Classes.weapons[key].name + " selected — click to fire, right click for its ability.");
};
Classes.worldMouse = function () { return { x: Classes.mouse.x + (typeof Draw !== "undefined" ? Draw.cameraX : 0), y: Classes.mouse.y }; };
Classes.refill = function () { if (Classes.reloadTimer > 0 && --Classes.reloadTimer === 0) Classes.ammo = Classes.weapons[Classes.selected].ammo; };
Classes.fire = function () {
  if (!Classes.selected || Classes.reloadTimer || Classes.ammo <= 0) { if (Classes.ammo <= 0 && !Classes.reloadTimer) Classes.reloadTimer = Classes.weapons[Classes.selected].reload; return; }
  var w = Classes.weapons[Classes.selected], target = Classes.worldMouse(), cx = Player.x + 16, cy = Player.y + 16;
  var dx = target.x - cx, dy = target.y - cy, length = Math.sqrt(dx * dx + dy * dy) || 1;
  Classes.bullets.push({ x: cx, y: cy, vx: dx / length * (Classes.selected === "bazooka" ? 10 : 12), vy: dy / length * (Classes.selected === "bazooka" ? 10 : 12), damage: w.damage, life: 90, explosive: Classes.selected === "bazooka" });
  Classes.ammo--; if (!Classes.ammo) Classes.reloadTimer = w.reload;
};
Classes.ability = function () {
  if (!Classes.selected) return;
  var target = Classes.worldMouse(), cx = Player.x + 16, cy = Player.y + 16, dx = target.x - cx, dy = target.y - cy, len = Math.sqrt(dx * dx + dy * dy) || 1;
  if (Classes.selected === "pistols") { Player.vx = dx / len * 18; Player.vy = dy / len * 18; Classes.dashTimer = 14; return; }
  if (Classes.selected === "ak47" && !Classes.thrown) { Classes.thrown = { x: cx, y: cy, phase: "out", vx: dx / len * 13, vy: dy / len * 13, life: 30 }; }
};
Classes.hitEnemy = function (b) {
  for (var i = 0; i < Enemy.enemies.length; i++) {
    var e = Enemy.enemies[i], size = e.radius ? e.radius : (e.type === "drone" ? 24 : 36), ex = e.x, ey = e.y;
    if (Math.abs(b.x - ex) < size + 8 && Math.abs(b.y - ey) < size + 8) {
      if (e.type === "cuboid") { e.vx = (ex - b.x) * 0.25; e.vy = -7; return true; }
      e.hp = (e.hp == null ? (e.type === "drill" ? 125 : e.type === "drone" ? 75 : 50) : e.hp) - b.damage;
      if (e.hp <= 0) { e.deadTimer = e.type === "drill" ? 120 : e.type === "drone" ? 210 : 30; e.dead = true; }
      return true;
    }
  }
  return false;
};
Classes.update = function () {
  if (!Classes.selected) return;
  Classes.refill();
  if (Classes.mouse.down) Classes.fire();
  if (Classes.dashTimer > 0) { Classes.dashTimer--; Player.vx *= .98; Player.vy *= .98; }
  for (var i = Classes.bullets.length - 1; i >= 0; i--) {
    var b = Classes.bullets[i]; b.x += b.vx; b.y += b.vy; b.vy += Classes.selected === "bazooka" ? .08 : 0; b.life--;
    if (Classes.hitEnemy(b) || b.life <= 0 || Collide.hitsSolid(b.x - 2, b.y - 2, 4, 4)) {
      if (Classes.selected === "bazooka" && Collide.hitsSolid(b.x - 8, b.y - 8, 16, 16)) Classes.destroyTerrain(b.x, b.y);
      Classes.bullets.splice(i, 1);
    }
  }
  if (Classes.thrown) {
    var t = Classes.thrown; t.x += t.vx; t.y += t.vy; t.life--;
    if (t.phase === "out" && t.life <= 0) { t.phase = "back"; t.life = 100; }
    if (t.phase === "back") { var dx = Player.x + 16 - t.x, dy = Player.y + 16 - t.y, l = Math.sqrt(dx * dx + dy * dy) || 1; t.vx = dx / l * 14; t.vy = dy / l * 14; if (l < 25) { Player.vy = -9; Classes.thrown = null; } }
    if (t.phase === "out") Classes.hitEnemy({ x: t.x, y: t.y, damage: 65 });
  }
};
Classes.destroyTerrain = function (x, y) {
  var col = Math.floor(x / CONFIG.TILE), row = Math.floor(y / CONFIG.TILE);
  for (var r = row - 1; r <= row + 1; r++) for (var c = col - 1; c <= col + 1; c++) if (Level.charAt(c, r) === "#") Level.grid[r] = Level.grid[r].substring(0, c) + "." + Level.grid[r].substring(c + 1);
  Player.vx += (Player.x + 16 < x ? -1 : 1) * 13; Player.vy = -10;
};
Classes.draw = function () {
  var ctx = Draw.ctx; ctx.save(); ctx.translate(-Draw.cameraX, 0); ctx.fillStyle = Classes.selected === "bazooka" ? "#ff0" : "#0ff";
  Classes.bullets.forEach(function (b) { ctx.beginPath(); ctx.arc(b.x, b.y, Classes.selected === "bazooka" ? 7 : 3, 0, Math.PI * 2); ctx.fill(); });
  if (Classes.thrown) { ctx.fillStyle = "#0f0"; ctx.fillRect(Classes.thrown.x - 10, Classes.thrown.y - 4, 20, 8); }
  ctx.restore();
  ctx.fillStyle = "#fff"; ctx.font = "14px monospace"; var w = Classes.weapons[Classes.selected]; ctx.fillText(w ? w.name + "  " + Classes.ammo + "/" + w.ammo + (Classes.reloadTimer ? "  RELOADING" : "") : "", 12, 22);
};

(function install() {
  var canvas = document.getElementById("game");
  canvas.addEventListener("mousemove", function (e) { var r = canvas.getBoundingClientRect(); Classes.mouse.x = (e.clientX - r.left) * canvas.width / r.width; Classes.mouse.y = (e.clientY - r.top) * canvas.height / r.height; });
  canvas.addEventListener("mousedown", function (e) { if (e.button === 0) Classes.mouse.down = true; if (e.button === 2) Classes.ability(); });
  window.addEventListener("mouseup", function () { Classes.mouse.down = false; });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  Classes.originalStart = Game.startLevel; Game.startLevel = function (level, enemyType) { if (!Classes.selected) { Classes.pendingStart = function () { Classes.originalStart.call(Game, level, enemyType); }; Game.mode = "choice"; Classes.showChoice(); return; } Classes.originalStart.call(Game, level, enemyType); };
  Classes.originalUpdate = Game.update; Game.update = function () { if (Game.mode === "playing") { Classes.update(); Classes.originalUpdate.call(Game); } };
  Classes.originalDraw = Draw.everything; Draw.everything = function () { Classes.originalDraw.call(Draw); Classes.draw(); };
})();
