/* Player classes, projectiles, ammo, and class abilities. */
var Weapons = { ammo: 0, reloadTimer: 0, fireCooldown: 0, projectiles: [], explosions: [], abilityWasDown: false, fireWasDown: false };
Weapons.reset = function () {
  var stats = CONFIG.CLASS_STATS[Player.classType];
  Weapons.ammo = stats ? stats.ammo + Game.blessings.ammo * 2 : 0;
  Weapons.reloadTimer = 0;
  Weapons.fireCooldown = 0;
  Weapons.projectiles = [];
  Weapons.explosions = [];
  Weapons.abilityWasDown = false;
  Weapons.fireWasDown = false;
};
Weapons.update = function () {
  if (!Player.classType) return;
  if (Weapons.fireCooldown > 0) Weapons.fireCooldown--;
  if (Weapons.reloadTimer > 0) { Weapons.reloadTimer--; if (Weapons.reloadTimer === 0) Weapons.ammo = CONFIG.CLASS_STATS[Player.classType].ammo + Game.blessings.ammo * 2; }
  if (Input.mouseDown && !Weapons.fireWasDown) Weapons.fire();
  if (Input.ability && !Weapons.abilityWasDown) Weapons.useAbility();
  Weapons.fireWasDown = Input.mouseDown;
  Weapons.abilityWasDown = Input.ability;
  Weapons.updateProjectiles();
  for (var i = Weapons.explosions.length - 1; i >= 0; i--) {
    Weapons.explosions[i].age++;
    if (Weapons.explosions[i].age > CONFIG.BAZOOKA_EXPLOSION_TIME) Weapons.explosions.splice(i, 1);
  }
};
Weapons.fire = function () {
  var stats = CONFIG.CLASS_STATS[Player.classType];
  if (!stats || Weapons.reloadTimer > 0 || Weapons.ammo <= 0 || Weapons.fireCooldown > 0) return;
  Weapons.ammo--;
  var startX = Player.x + CONFIG.PLAYER_SIZE / 2, startY = Player.y + CONFIG.PLAYER_SIZE / 2;
  var dx = Input.mouseX - startX, dy = Input.mouseY - startY, distance = Math.hypot(dx, dy) || 1;
  Weapons.projectiles.push({ kind: Player.classType === "ak47" ? "akBullet" : Player.classType, x: startX, y: startY, vx: dx / distance * CONFIG.WEAPON_PROJECTILE_SPEED, vy: dy / distance * CONFIG.WEAPON_PROJECTILE_SPEED, damage: stats.damage, life: 90 });
  if (Weapons.ammo === 0) Weapons.reloadTimer = CONFIG.WEAPON_RELOAD_FRAMES[Player.classType];
  if (Player.classType === "bazooka") Weapons.fireCooldown = CONFIG.BAZOOKA_FIRE_COOLDOWN;
};
Weapons.useAbility = function () {
  if (Player.classType === "ak47") {
    if (Weapons.projectiles.some(function (p) { return p.kind === "ak"; })) return;
    var throwX = Player.x + CONFIG.PLAYER_SIZE / 2, throwY = Player.y + CONFIG.PLAYER_SIZE / 2;
    var throwDx = Input.mouseX - throwX, throwDy = Input.mouseY - throwY, throwDistance = Math.hypot(throwDx, throwDy) || 1;
    Weapons.projectiles.push({ kind: "ak", x: throwX, y: throwY, vx: throwDx / throwDistance * CONFIG.AK_THROW_SPEED, vy: throwDy / throwDistance * CONFIG.AK_THROW_SPEED, age: 0, returning: false });
    return;
  }
  if (Player.classType !== "pistols" || Player.dashTimer > 0 || Player.dashCooldown > 0) return;
  var dx = Input.mouseX - (Player.x + CONFIG.PLAYER_SIZE / 2), dy = Input.mouseY - (Player.y + CONFIG.PLAYER_SIZE / 2), distance = Math.hypot(dx, dy) || 1;
  Player.vx = dx / distance * CONFIG.PISTOL_DASH_SPEED;
  Player.vy = dy / distance * CONFIG.PISTOL_DASH_SPEED;
  Player.dashTimer = CONFIG.PISTOL_DASH_TIME + Game.blessings.dash * 6;
};
Weapons.updateProjectiles = function () {
  for (var i = Weapons.projectiles.length - 1; i >= 0; i--) {
    var projectile = Weapons.projectiles[i];
    projectile.age++;
    if (projectile.kind === "ak") Weapons.updateAk(projectile, i);
    else Weapons.updateBullet(projectile, i);
  }
};
Weapons.updateBullet = function (projectile, index) {
  projectile.x += projectile.vx; projectile.y += projectile.vy; projectile.life--;
  var hit = projectile.kind === "bazooka" ? Enemy.damageAt(projectile.x, projectile.y, 0, 14) : Enemy.damageAt(projectile.x, projectile.y, projectile.damage, 14);
  if (hit || projectile.life <= 0) {
    if (projectile.kind === "bazooka") Weapons.explode(projectile.x, projectile.y);
    Weapons.projectiles.splice(index, 1);
  } else if (projectile.kind === "bazooka" && Collide.hitsSolid(projectile.x - 4, projectile.y - 4, 8, 8)) {
    Weapons.explode(projectile.x, projectile.y); Weapons.projectiles.splice(index, 1);
  }
};
Weapons.explode = function (x, y) {
  Level.destroyCircle(x, y, CONFIG.BAZOOKA_BLAST_RADIUS);
  Enemy.damageRadius(x, y, CONFIG.BAZOOKA_BLAST_RADIUS, CONFIG.CLASS_STATS.bazooka.damage);
  Weapons.explosions.push({ x: x, y: y, age: 0 });
};
Weapons.updateAk = function (projectile, index) {
  var playerX = Player.x + CONFIG.PLAYER_SIZE / 2, playerY = Player.y + CONFIG.PLAYER_SIZE / 2;
  if (!projectile.returning && (projectile.age > CONFIG.AK_RETURN_TIME || Enemy.damageAt(projectile.x, projectile.y, CONFIG.AK_THROW_DAMAGE, 18))) projectile.returning = true;
  if (projectile.returning) {
    var dx = playerX - projectile.x, dy = playerY - projectile.y, distance = Math.hypot(dx, dy) || 1;
    projectile.vx = dx / distance * CONFIG.AK_THROW_SPEED; projectile.vy = dy / distance * CONFIG.AK_THROW_SPEED;
    if (distance < 22) { Player.vy = -8; Weapons.projectiles.splice(index, 1); return; }
  }
  projectile.x += projectile.vx; projectile.y += projectile.vy;
};