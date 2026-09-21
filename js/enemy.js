/* =====================================================================
   enemy.js -- ENEMIES AND THEIR PROJECTILES.
   ===================================================================== */
var Enemy = {
  type: null,
  enemies: [],
  bullets: [],
  choices: [
    { type: "cuobid", name: "Cuobid", description: "A 3D cube that slowly follows you through walls." },
    { type: "drone", name: "Drone", description: "Flies above you, stops, and fires three fast bullets." },
    { type: "evilSpike", name: "More evil spike", description: "Dashes in a straight line toward you." },
    { type: "greenBall4", name: "Green ball 4", description: "Four bouncy green balls roll toward you." }
  ]
};

Enemy.reset = function (type) {
  Enemy.type = type || null;
  Enemy.enemies = [];
  Enemy.bullets = [];
  if (!Enemy.type) { return; }

  var x = Math.min(Math.max(Player.x + CONFIG.ENEMY_START_DISTANCE, CONFIG.CANVAS_W), Level.pixelWidth() - 80);
  var y = Math.max(0, Player.y - CONFIG.ENEMY_SPAWN_HEIGHT);
  var radius = Enemy.type === "greenBall4" ? CONFIG.GREEN_BALL_SIZE / 2 :
    (Enemy.type === "cuobid" ? CONFIG.CUOBID_SIZE / 2 : CONFIG.EVIL_SPIKE_SIZE / 2);

  if (Enemy.type === "greenBall4") {
    for (var i = 0; i < CONFIG.GREEN_BALL_COUNT; i++) {
      Enemy.enemies.push({ x: x + i * 42, y: y - i * 24, vx: 0, vy: 0, radius: radius, angle: 0 });
    }
  } else {
    Enemy.enemies.push({ x: x, y: y, vx: 0, vy: 0, state: "approach", timer: 0, radius: radius, angle: 0 });
  }
};

Enemy.randomChoices = function () {
  var pool = Enemy.choices.slice();
  var result = [];
  while (result.length < 3 && pool.length) {
    result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return result;
};

Enemy.update = function () {
  if (!Enemy.type) { return; }
  if (Enemy.type === "cuobid") { Enemy.updateCuobid(); }
  if (Enemy.type === "drone") { Enemy.updateDrone(); }
  if (Enemy.type === "evilSpike") { Enemy.updateEvilSpike(); }
  if (Enemy.type === "greenBall4") { Enemy.updateGreenBalls(); }
  Enemy.updateBullets();
};

Enemy.updateCuobid = function () {
  var e = Enemy.enemies[0], dx = Player.x - e.x, dy = Player.y - e.y;
  var distance = Math.sqrt(dx * dx + dy * dy) || 1;
  e.x += dx / distance * CONFIG.CUOBID_SPEED;
  e.y += dy / distance * CONFIG.CUOBID_SPEED;
  e.angle += 0.025;
};

Enemy.updateDrone = function () {
  var e = Enemy.enemies[0];
  e.timer++;
  if (e.state === "approach") {
    e.x += (Player.x - e.x) * CONFIG.DRONE_FOLLOW_RATE;
    e.y += (Player.y - CONFIG.DRONE_HEIGHT_ABOVE_PLAYER - e.y) * CONFIG.DRONE_FOLLOW_RATE;
    if (Math.abs(e.x - Player.x) < 12 && Math.abs(e.y - (Player.y - CONFIG.DRONE_HEIGHT_ABOVE_PLAYER)) < 12) {
      e.state = "fire"; e.timer = 0;
    }
  } else if (e.state === "fire") {
    if (e.timer === 1 || e.timer === 1 + CONFIG.DRONE_SHOT_INTERVAL || e.timer === 1 + CONFIG.DRONE_SHOT_INTERVAL * 2) {
      var dx = Player.x + CONFIG.PLAYER_SIZE / 2 - e.x;
      var dy = Player.y + CONFIG.PLAYER_SIZE / 2 - e.y;
      var distance = Math.sqrt(dx * dx + dy * dy) || 1;
      Enemy.bullets.push({ x: e.x, y: e.y, vx: dx / distance * CONFIG.DRONE_BULLET_SPEED, vy: dy / distance * CONFIG.DRONE_BULLET_SPEED, life: CONFIG.DRONE_BULLET_LIFE });
    }
    if (e.timer > CONFIG.DRONE_FIRE_TIME) { e.state = "approach"; e.timer = 0; }
  }
};

Enemy.updateEvilSpike = function () {
  var e = Enemy.enemies[0];
  e.timer++;
  if (e.state === "approach" && e.timer > CONFIG.EVIL_SPIKE_WARNING_TIME) {
    var dx = Player.x - e.x, dy = Player.y - e.y, distance = Math.sqrt(dx * dx + dy * dy) || 1;
    e.vx = dx / distance * CONFIG.EVIL_SPIKE_DASH_SPEED;
    e.vy = dy / distance * CONFIG.EVIL_SPIKE_DASH_SPEED;
    e.state = "dash"; e.timer = 0;
  }
  if (e.state === "dash") {
    e.x += e.vx; e.y += e.vy;
    if (e.timer > CONFIG.EVIL_SPIKE_DASH_TIME) { e.state = "approach"; e.timer = 0; }
  }
};

Enemy.updateGreenBalls = function () {
  for (var i = 0; i < Enemy.enemies.length; i++) {
    var e = Enemy.enemies[i], direction = Player.x > e.x ? 1 : -1;
    e.vx += direction * CONFIG.GREEN_BALL_SPEED;
    if (e.vx > CONFIG.GREEN_BALL_MAX_SPEED) { e.vx = CONFIG.GREEN_BALL_MAX_SPEED; }
    if (e.vx < -CONFIG.GREEN_BALL_MAX_SPEED) { e.vx = -CONFIG.GREEN_BALL_MAX_SPEED; }
    e.vy += CONFIG.GRAVITY;
    if (Collide.hitsSolid(e.x - e.radius, e.y - e.radius + e.vy, e.radius * 2, e.radius * 2)) {
      e.vy = -CONFIG.GREEN_BALL_BOUNCE;
    } else { e.y += e.vy; }
    if (!Collide.hitsSolid(e.x - e.radius + e.vx, e.y - e.radius, e.radius * 2, e.radius * 2)) { e.x += e.vx; }
    else { e.vx *= -0.7; }
    e.angle += e.vx / e.radius;
  }
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
