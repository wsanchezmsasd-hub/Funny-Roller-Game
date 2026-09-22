/* =====================================================================
   enemy.js -- ENEMIES AND THEIR PROJECTILES.
   ===================================================================== */
var Enemy = {
  type: null,
  types: [],
  enemies: [],
  bullets: [],
  choices: [
    { type: "cuboid", name: "Cuboid", description: "A group of cubes that follows you through walls and can combine." },
    { type: "drone", name: "Drone", description: "Flies above you and fires short, fast bursts." },
    { type: "drill", name: "Drill", description: "Points at you, warns you with a line, then dashes." },
    { type: "greenBall4", name: "Green ball 4", description: "Four green balls leap toward you every 1.5 seconds." }
  ]
};

Enemy.isType = function (type, wanted) {
  return type === wanted || (wanted === "cuboid" && type === "cuobid") || (wanted === "drill" && type === "evilSpike");
};

Enemy.resetRoster = function () { Enemy.types = []; Enemy.type = null; };

Enemy.reset = function (type, resetRoster) {
  if (resetRoster) { Enemy.resetRoster(); }
  if (type && Enemy.types.indexOf(type) < 0) { Enemy.types.push(type); }
  Enemy.type = Enemy.types.length === 1 ? Enemy.types[0] : (Enemy.types.length ? "mixed" : null);
  Enemy.enemies = [];
  Enemy.bullets = [];
  if (!Enemy.types.length) { return; }

  for (var t = 0; t < Enemy.types.length; t++) {
    var enemyType = Enemy.types[t];
    var x = Math.min(Math.max(Player.x + CONFIG.ENEMY_START_DISTANCE + t * 45, CONFIG.CANVAS_W), Level.pixelWidth() - 80);
    var y = Math.max(0, Player.y - CONFIG.ENEMY_SPAWN_HEIGHT);
    Enemy.spawnType(enemyType, x, y);
  }
};

Enemy.spawnType = function (type, x, y) {
  if (Enemy.isType(type, "greenBall4")) {
    var radius = CONFIG.GREEN_BALL_SIZE / 2;
    for (var i = 0; i < CONFIG.GREEN_BALL_COUNT; i++) {
      Enemy.enemies.push({ type: "greenBall4", x: x + i * 42, y: y - i * 24, vx: 0, vy: 0,
        radius: radius, angle: 0, jumpTimer: CONFIG.GREEN_BALL_JUMP_INTERVAL, grounded: false });
    }
  } else if (Enemy.isType(type, "cuboid")) {
    // Keep the individual cubes well separated until their paths naturally meet.
    for (var j = 0; j < CONFIG.CUOBID_GROUP_SIZE; j++) {
      Enemy.enemies.push({ type: "cuboid", x: x + j * CONFIG.CUOBID_SPAWN_SPACING,
        y: y - (j % 2) * 90, vx: 0, vy: 0, radius: CONFIG.CUOBID_SIZE / 2,
        angle: 0, combined: false });
    }
  } else {
    var actualType = Enemy.isType(type, "drill") ? "drill" : type;
    var size = actualType === "drone" ? CONFIG.CUOBID_SIZE / 2 : CONFIG.EVIL_SPIKE_SIZE / 2;
    Enemy.enemies.push({ type: actualType, x: x, y: y, vx: 0, vy: 0, state: "approach",
      timer: 0, shotTimer: 0, burstShots: 0, radius: size, angle: 0, targetAngle: 0 });
  }
};

Enemy.randomChoices = function () {
  var pool = Enemy.choices.filter(function (choice) { return Enemy.types.indexOf(choice.type) < 0; });
  var result = [];
  while (result.length < 3 && pool.length) { result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); }
  return result;
};

Enemy.update = function () {
  if (!Enemy.types.length) { return; }
  for (var i = 0; i < Enemy.enemies.length; i++) {
    var e = Enemy.enemies[i];
    if (e.type === "cuboid") { Enemy.updateCuboid(e); }
    if (e.type === "drone") { Enemy.updateDrone(e); }
    if (e.type === "drill") { Enemy.updateDrill(e); }
    if (e.type === "greenBall4") { Enemy.updateGreenBall(e); }
  }
  Enemy.tryCombineCuboids();
  Enemy.updateBullets();
};

Enemy.updateCuboid = function (e) {
  var dx = Player.x - e.x, dy = Player.y - e.y, distance = Math.sqrt(dx * dx + dy * dy) || 1;
  var speed = Math.min(CONFIG.CUOBID_MAX_SPEED, CONFIG.CUOBID_SPEED + distance * CONFIG.CUOBID_DISTANCE_SPEED);
  e.x += dx / distance * speed; e.y += dy / distance * speed; e.angle += 0.025;
};

Enemy.tryCombineCuboids = function () {
  var cuboids = Enemy.enemies.filter(function (e) { return e.type === "cuboid" && !e.combined; });
  if (cuboids.length < CONFIG.CUOBID_GROUP_SIZE) { return; }
  var cx = 0, cy = 0;
  cuboids.forEach(function (e) { cx += e.x; cy += e.y; });
  cx /= cuboids.length; cy /= cuboids.length;
  var close = cuboids.every(function (e) { return Math.hypot(e.x - cx, e.y - cy) < CONFIG.CUOBID_MERGE_DISTANCE; });
  if (!close) { return; }
  Enemy.enemies = Enemy.enemies.filter(function (e) { return e.type !== "cuboid" || e.combined; });
  Enemy.enemies.push({ type: "cuboid", x: cx, y: cy, vx: 0, vy: 0,
    radius: CONFIG.CUOBID_SIZE / 2 * Math.sqrt(cuboids.length), angle: 0, combined: true });
};

Enemy.updateDrone = function (e) {
  e.timer++;
  var firing = e.burstShots > 0;
  var followRate = firing ? CONFIG.DRONE_FOLLOW_RATE * CONFIG.DRONE_FIRE_MOVE_FACTOR : CONFIG.DRONE_FAST_FOLLOW_RATE;
  e.x += (Player.x - e.x) * followRate;
  e.y += (Player.y - CONFIG.DRONE_HEIGHT_ABOVE_PLAYER - e.y) * followRate;

  e.shotTimer--;
  if (e.shotTimer <= 0 && e.burstShots > 0) {
    var dx = Player.x + CONFIG.PLAYER_SIZE / 2 - e.x, dy = Player.y + CONFIG.PLAYER_SIZE / 2 - e.y;
    var distance = Math.sqrt(dx * dx + dy * dy) || 1;
    Enemy.bullets.push({ x: e.x, y: e.y, vx: dx / distance * CONFIG.DRONE_BULLET_SPEED,
      vy: dy / distance * CONFIG.DRONE_BULLET_SPEED, life: CONFIG.DRONE_BULLET_LIFE });
    e.burstShots--;
    e.shotTimer = e.burstShots ? CONFIG.DRONE_SHOT_INTERVAL : CONFIG.DRONE_BURST_COOLDOWN;
  } else if (e.shotTimer <= 0 && e.burstShots === 0) {
    e.burstShots = CONFIG.DRONE_SHOTS;
    e.shotTimer = 1;
  }
};

Enemy.updateDrill = function (e) {
  e.timer++;
  var dx = Player.x + CONFIG.PLAYER_SIZE / 2 - e.x;
  var dy = Player.y + CONFIG.PLAYER_SIZE / 2 - e.y;
  e.targetAngle = Math.atan2(dy, dx);
  var turn = e.targetAngle - e.angle;
  while (turn > Math.PI) { turn -= Math.PI * 2; }
  while (turn < -Math.PI) { turn += Math.PI * 2; }
  e.angle += turn * CONFIG.DRILL_TURN_RATE;

  if (e.state === "approach" && e.timer > CONFIG.EVIL_SPIKE_WARNING_TIME) {
    e.vx = Math.cos(e.angle) * CONFIG.EVIL_SPIKE_DASH_SPEED;
    e.vy = Math.sin(e.angle) * CONFIG.EVIL_SPIKE_DASH_SPEED;
    e.state = "dash"; e.timer = 0;
  }
  if (e.state === "dash") {
    e.x += e.vx; e.y += e.vy;
    if (e.timer > CONFIG.EVIL_SPIKE_DASH_TIME) { e.state = "approach"; e.timer = 0; }
  }
};

Enemy.updateGreenBall = function (e) {
  e.jumpTimer--;
  e.vy += CONFIG.GRAVITY;
  if (Collide.hitsSolid(e.x - e.radius, e.y - e.radius + e.vy, e.radius * 2, e.radius * 2)) {
    e.y += e.vy;
    e.vy = 0;
    e.grounded = true;
  } else { e.y += e.vy; e.grounded = false; }

  // Green balls do not roll toward the player: each leap is aimed at them.
  if (e.grounded && e.jumpTimer <= 0) {
    var dx = Player.x + CONFIG.PLAYER_SIZE / 2 - e.x;
    var dy = Player.y + CONFIG.PLAYER_SIZE / 2 - e.y;
    var distance = Math.sqrt(dx * dx + dy * dy) || 1;
    e.vx = dx / distance * CONFIG.GREEN_BALL_JUMP_SPEED;
    e.vy = dy / distance * CONFIG.GREEN_BALL_JUMP_SPEED - 6;
    e.grounded = false;
    e.jumpTimer = CONFIG.GREEN_BALL_JUMP_INTERVAL;
  }
  if (!Collide.hitsSolid(e.x - e.radius + e.vx, e.y - e.radius, e.radius * 2, e.radius * 2)) {
    e.x += e.vx;
  } else { e.vx = 0; }
  e.vx *= 0.96;
  e.angle += e.vx / e.radius;
};

Enemy.updateBullets = function () {
  for (var i = Enemy.bullets.length - 1; i >= 0; i--) {
    var b = Enemy.bullets[i]; b.x += b.vx; b.y += b.vy; b.life--;
    if (b.life <= 0 || Collide.hitsSolid(b.x - 4, b.y - 4, 8, 8)) { Enemy.bullets.splice(i, 1); }
  }
};

Enemy.hitsPlayer = function () {
  var px = Player.x + CONFIG.PLAYER_SIZE / 2, py = Player.y + CONFIG.PLAYER_SIZE / 2;
  for (var i = 0; i < Enemy.enemies.length; i++) {
    var e = Enemy.enemies[i], dx = px - e.x, dy = py - e.y, reach = e.radius + CONFIG.PLAYER_SIZE / 2;
    if (dx * dx + dy * dy < reach * reach) { return true; }
  }
  for (var j = 0; j < Enemy.bullets.length; j++) {
    var b = Enemy.bullets[j], bx = px - b.x, by = py - b.y;
    if (bx * bx + by * by < 18 * 18) { return true; }
  }
  return false;
};
