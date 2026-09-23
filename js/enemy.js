/* =====================================================================
   enemy.js -- ENEMIES AND THEIR PROJECTILES.
   ===================================================================== */
var Enemy = {
  type: null, types: [], enemies: [], bullets: [],
  choices: [
    { type: "cuboid", name: "Cuboid", description: "Two large, slippery cubes follow you and are knocked back by damage." },
    { type: "drone", name: "Drone", description: "25 HP. Respawns after 3.5 seconds and fires short, slow bursts." },
    { type: "drill", name: "Drill", description: "45 HP. Respawns after 2 seconds, then locks on and dashes." },
    { type: "greenBall4", name: "Green ball 4", description: "Two 15 HP balls respawn after 1.25 seconds and leap toward you." },
    { type: "sentry", name: "Sentry", description: "A stationary enemy that fires aimed shots from across the map." }
  ]
};
Enemy.isType = function (type, wanted) { return type === wanted || (wanted === "cuboid" && type === "cuobid") || (wanted === "drill" && type === "evilSpike"); };
Enemy.resetRoster = function () { Enemy.types = []; Enemy.type = null; };
Enemy.reset = function (type, resetRoster) {
  if (resetRoster) Enemy.resetRoster();
  if (type) Enemy.types.push(type);
  Enemy.type = Enemy.types.length === 1 ? Enemy.types[0] : (Enemy.types.length ? "mixed" : null);
  Enemy.enemies = []; Enemy.bullets = []; if (!Enemy.types.length) return;
  for (var t = 0; t < Enemy.types.length; t++) { var point = Enemy.randomSpawnPoint(24); Enemy.spawnType(Enemy.types[t], point.x, point.y); }
};
Enemy.randomSpawnPoint = function (radius) {
  var point = { x: Math.max(radius, Math.min(Level.pixelWidth() - radius, Player.x + CONFIG.ENEMY_START_DISTANCE)), y: Math.max(radius, Player.y - CONFIG.ENEMY_SPAWN_HEIGHT) };
  for (var attempt = 0; attempt < 20; attempt++) {
    var x = radius + Math.random() * Math.max(1, Level.pixelWidth() - radius * 2), y = radius + Math.random() * (CONFIG.CANVAS_H - radius * 2);
    if (!Collide.hitsSolid(x - radius, y - radius, radius * 2, radius * 2)) return { x: x, y: y };
  }
  return point;
};
Enemy.spawnType = function (type, x, y) {
  if (Enemy.isType(type, "greenBall4")) for (var i = 0; i < CONFIG.GREEN_BALL_COUNT; i++) Enemy.enemies.push(Enemy.makeEnemy("greenBall4", x + i * 42, y - i * 24, CONFIG.GREEN_BALL_SIZE / 2, 15, 30));
  else if (Enemy.isType(type, "cuboid")) for (var j = 0; j < CONFIG.CUOBID_GROUP_SIZE; j++) Enemy.enemies.push(Enemy.makeEnemy("cuboid", x + j * CONFIG.CUOBID_SPAWN_SPACING, y + (Math.random() * 180 - 90), CONFIG.CUOBID_SIZE / 2, Infinity, 0));
  else { var actualType = Enemy.isType(type, "drill") ? "drill" : type, count = actualType === "drone" ? CONFIG.DRONE_COUNT : 1, radius = actualType === "drone" ? CONFIG.CUOBID_SIZE / 2 : actualType === "sentry" ? CONFIG.SENTRY_RADIUS : CONFIG.EVIL_SPIKE_SIZE / 2, hp = actualType === "drone" ? 25 : actualType === "sentry" ? CONFIG.SENTRY_HP : 45; for (var k = 0; k < count; k++) Enemy.enemies.push(Enemy.makeEnemy(actualType, x + k * 70, y - k * 45, radius, hp, actualType === "drone" ? 210 : 120)); }
};
Enemy.makeEnemy = function (type, x, y, radius, hp, respawnFrames) { return { type: type, x: x, y: y, spawnX: x, spawnY: y, vx: 0, vy: 0, state: "windup", timer: 0, shotTimer: 0, burstShots: 0, radius: radius, angle: 0, targetAngle: 0, hp: hp, maxHp: hp, respawnFrames: respawnFrames, deadTimer: 0, jumpTimer: CONFIG.GREEN_BALL_JUMP_INTERVAL, grounded: false, combined: false, windup: CONFIG.ENEMY_WINDUP_FRAMES }; };
Enemy.randomChoices = function () { var pool = Enemy.choices.slice(), result = []; while (result.length < 3 && pool.length) result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); return result; };
Enemy.update = function () { if (!Enemy.types.length) return; for (var i = 0; i < Enemy.enemies.length; i++) { var e = Enemy.enemies[i]; if (e.deadTimer > 0) { e.deadTimer--; if (e.deadTimer === 0) { var point = Enemy.randomSpawnPoint(e.radius); e.hp = e.maxHp; e.x = point.x; e.y = point.y; e.spawnX = e.x; e.spawnY = e.y; e.vx = 0; e.vy = 0; e.state = "windup"; e.timer = 0; e.grounded = false; e.windup = CONFIG.ENEMY_WINDUP_FRAMES; } continue; } if (e.state === "windup") { e.windup--; if (e.windup > 0) continue; e.state = "approach"; } if (e.type === "cuboid") Enemy.updateCuboid(e); if (e.type === "drone") Enemy.updateDrone(e); if (e.type === "drill") Enemy.updateDrill(e); if (e.type === "greenBall4") Enemy.updateGreenBall(e); if (e.type === "sentry") Enemy.updateSentry(e); } if (Game.hasCurse("unknownDimension")) Enemy.tryCombineCuboids(); Enemy.updateBullets(); };
Enemy.updateSentry = function (e) { e.timer++; if (e.timer % CONFIG.SENTRY_SHOT_INTERVAL !== 0) return; var dx = Player.x + CONFIG.PLAYER_SIZE / 2 - e.x, dy = Player.y + CONFIG.PLAYER_SIZE / 2 - e.y, distance = Math.hypot(dx, dy) || 1; Enemy.bullets.push({ x: e.x, y: e.y, vx: dx / distance * CONFIG.SENTRY_BULLET_SPEED, vy: dy / distance * CONFIG.SENTRY_BULLET_SPEED, life: CONFIG.DRONE_BULLET_LIFE }); };
Enemy.tryCombineCuboids = function () { var cuboids = Enemy.enemies.filter(function (e) { return e.type === "cuboid" && !e.combined; }); if (cuboids.length < CONFIG.CUOBID_GROUP_SIZE) return; var cx = 0, cy = 0; cuboids.forEach(function (e) { cx += e.x; cy += e.y; }); cx /= cuboids.length; cy /= cuboids.length; if (!cuboids.every(function (e) { return Math.hypot(e.x - cx, e.y - cy) < CONFIG.CUOBID_MERGE_DISTANCE; })) return; Enemy.enemies = Enemy.enemies.filter(function (e) { return e.type !== "cuboid" || e.combined; }); Enemy.enemies.push({ type: "cuboid", x: cx, y: cy, vx: 0, vy: 0, radius: CONFIG.CUOBID_SIZE / 2 * Math.sqrt(cuboids.length), angle: 0, combined: true, state: "approach", deadTimer: 0, hp: Infinity, maxHp: Infinity, respawnFrames: 0 }); };
Enemy.updateCuboid = function (e) { var dx = Player.x - e.x, dy = Player.y - e.y, distance = Math.sqrt(dx * dx + dy * dy) || 1, speed = Math.min(CONFIG.CUOBID_MAX_SPEED, CONFIG.CUOBID_SPEED + distance * CONFIG.CUOBID_DISTANCE_SPEED); e.x += dx / distance * speed + e.vx; e.y += dy / distance * speed + e.vy; e.vx *= 0.97; e.vy *= 0.97; e.angle += 0.025; };
Enemy.updateDrone = function (e) { e.timer++; var firing = e.burstShots > 0, followRate = firing ? CONFIG.DRONE_FOLLOW_RATE * CONFIG.DRONE_FIRE_MOVE_FACTOR : CONFIG.DRONE_FAST_FOLLOW_RATE; e.x += (Player.x - e.x) * followRate; e.y += (Player.y - CONFIG.DRONE_HEIGHT_ABOVE_PLAYER - e.y) * followRate; e.shotTimer--; if (e.shotTimer <= 0 && e.burstShots > 0) { var dx = Player.x + CONFIG.PLAYER_SIZE / 2 - e.x, dy = Player.y + CONFIG.PLAYER_SIZE / 2 - e.y, distance = Math.sqrt(dx * dx + dy * dy) || 1, bulletSpeed = Game.hasCurse("shotgunSlug") ? 9 : CONFIG.DRONE_BULLET_SPEED; Enemy.bullets.push({ x: e.x, y: e.y, vx: dx / distance * bulletSpeed, vy: dy / distance * bulletSpeed, life: CONFIG.DRONE_BULLET_LIFE }); e.burstShots--; e.shotTimer = Game.hasCurse("shotgunSlug") ? CONFIG.DRONE_BURST_COOLDOWN : (e.burstShots ? CONFIG.DRONE_SHOT_INTERVAL : CONFIG.DRONE_BURST_COOLDOWN); } else if (e.shotTimer <= 0 && e.burstShots === 0) { e.burstShots = Game.hasCurse("shotgunSlug") ? 1 : CONFIG.DRONE_SHOTS; e.shotTimer = 1; } };
Enemy.updateDrill = function (e) {
  e.timer++;
  if (e.state === "approach") {
    var dx = Player.x + CONFIG.PLAYER_SIZE / 2 - e.x, dy = Player.y + CONFIG.PLAYER_SIZE / 2 - e.y;
    e.targetAngle = Math.atan2(dy, dx);
    var turn = e.targetAngle - e.angle;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    e.angle += turn * CONFIG.DRILL_TURN_RATE;
    if (e.timer > CONFIG.EVIL_SPIKE_WARNING_TIME) {
      e.targetX = Player.x + CONFIG.PLAYER_SIZE / 2;
      e.targetY = Player.y + CONFIG.PLAYER_SIZE / 2;
      e.state = "warning";
      e.timer = 0;
    }
  } else if (e.state === "warning") {
    if (e.timer > CONFIG.DRILL_DASH_DELAY) {
      var targetDx = e.targetX - e.x, targetDy = e.targetY - e.y, targetDistance = Math.hypot(targetDx, targetDy) || 1;
      e.vx = targetDx / targetDistance * CONFIG.EVIL_SPIKE_DASH_SPEED;
      e.vy = targetDy / targetDistance * CONFIG.EVIL_SPIKE_DASH_SPEED;
      e.state = "dash";
      e.timer = 0;
    }
  } else if (e.state === "dash") {
    e.x += e.vx;
    e.y += e.vy;
    if (e.timer > CONFIG.EVIL_SPIKE_DASH_TIME) {
      if (Game.hasCurse("batteryLife") && !e.doubleDashUsed) { e.doubleDashUsed = true; e.state = "warning"; e.timer = 0; e.targetX = Player.x + CONFIG.PLAYER_SIZE / 2; e.targetY = Player.y + CONFIG.PLAYER_SIZE / 2; }
      else { e.state = "approach"; e.timer = 0; e.doubleDashUsed = false; }
    }
  }
};
Enemy.updateGreenBall = function (e) {
  e.jumpTimer--;
  e.vy += CONFIG.GRAVITY;
  var nextY = e.y + e.vy, falling = e.vy > 0;
  if (Collide.hitsSolid(e.x - e.radius, nextY - e.radius, e.radius * 2, e.radius * 2)) {
    if (falling) e.y = Math.floor((nextY + e.radius) / CONFIG.TILE) * CONFIG.TILE - e.radius;
    else if (e.vy < 0) e.y = (Math.floor((nextY - e.radius) / CONFIG.TILE) + 1) * CONFIG.TILE + e.radius;
    e.vy = 0;
    e.grounded = falling;
  } else {
    e.y = nextY;
    e.grounded = false;
  }
  if (e.grounded && e.jumpTimer <= 0) {
    var dx = Player.x + CONFIG.PLAYER_SIZE / 2 - e.x, dy = Player.y + CONFIG.PLAYER_SIZE / 2 - e.y, distance = Math.sqrt(dx * dx + dy * dy) || 1;
    e.vx = dx / distance * CONFIG.GREEN_BALL_JUMP_SPEED;
    e.vy = dy / distance * CONFIG.GREEN_BALL_JUMP_SPEED - 6;
    e.grounded = false;
    e.jumpTimer = CONFIG.GREEN_BALL_JUMP_INTERVAL;
  }
  if (!Collide.hitsSolid(e.x - e.radius + e.vx, e.y - e.radius, e.radius * 2, e.radius * 2)) e.x += e.vx; else e.vx = 0;
  e.vx *= 0.96;
  e.angle += e.vx / e.radius;
};
Enemy.updateBullets = function () { for (var i = Enemy.bullets.length - 1; i >= 0; i--) { var b = Enemy.bullets[i]; b.x += b.vx; b.y += b.vy; b.life--; if (b.life <= 0 || Collide.hitsSolid(b.x - 4, b.y - 4, 8, 8)) Enemy.bullets.splice(i, 1); } };
Enemy.damageAt = function (x, y, damage, reach) {
  for (var i = 0; i < Enemy.enemies.length; i++) {
    var e = Enemy.enemies[i]; if (e.deadTimer > 0) continue;
    var dx = x - e.x, dy = y - e.y, hitReach = (reach || 0) + e.radius;
    if (dx * dx + dy * dy < hitReach * hitReach) {
      if (e.hp !== Infinity) e.hp -= damage * (Game.hasCurse("wearAndTear") ? 0.75 : 1);
      if (e.type === "cuboid") { var distance = Math.sqrt(dx * dx + dy * dy) || 1; e.vx -= dx / distance * CONFIG.CUOBID_HIT_KNOCKBACK; e.vy -= dy / distance * CONFIG.CUOBID_HIT_KNOCKBACK; }
      if (e.hp <= 0) e.deadTimer = e.respawnFrames;
      return true;
    }
  }
  return false;
};
Enemy.damageRadius = function (x, y, radius, damage) {
  for (var i = 0; i < Enemy.enemies.length; i++) {
    var e = Enemy.enemies[i]; if (e.deadTimer > 0) continue;
    var dx = x - e.x, dy = y - e.y, distance = Math.hypot(dx, dy);
    if (distance < radius + e.radius) {
      if (e.hp !== Infinity) e.hp -= damage * (1 - Math.min(distance / (radius + e.radius), 1) * 0.5) * (Game.hasCurse("wearAndTear") ? 0.75 : 1);
      var force = CONFIG.BAZOOKA_KNOCKBACK * (1 - Math.min(distance / (radius + e.radius), 1));
      if (distance > 0) { e.vx += -dx / distance * force; e.vy += -dy / distance * force; }
      if (e.hp <= 0) e.deadTimer = e.respawnFrames;
    }
  }
};
Enemy.hitsPlayer = function () { var px = Player.x + CONFIG.PLAYER_SIZE / 2, py = Player.y + CONFIG.PLAYER_SIZE / 2; for (var i = 0; i < Enemy.enemies.length; i++) { var e = Enemy.enemies[i]; if (e.deadTimer > 0 || e.state === "windup") continue; var dx = px - e.x, dy = py - e.y, reach = e.radius + CONFIG.PLAYER_SIZE / 2; if (dx * dx + dy * dy < reach * reach) return true; } for (var j = 0; j < Enemy.bullets.length; j++) { var b = Enemy.bullets[j], bx = px - b.x, by = py - b.y; if (bx * bx + by * by < 18 * 18) return true; } return false; };
