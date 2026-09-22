var Player={x:0,y:0,vx:0,vy:0,onGround:false,angle:0,invincible:0,dashCooldown:0};
Player.reset=function(){Player.x=Level.startX;Player.y=Level.startY;Player.vx=0;Player.vy=0;Player.onGround=false;Player.angle=0;Player.invincible=0;Player.dashCooldown=0;};
Player.update=function(){var s=CONFIG.PLAYER_SIZE;if(Player.invincible>0)Player.invincible--;if(Player.dashCooldown>0)Player.dashCooldown--;
 if(Input.dash&&Player.dashCooldown<=0){var dir=Input.left?-1:1;Player.vx=dir*13;Player.invincible=18;Player.dashCooldown=CONFIG.PISTOL_COOLDOWN;}
 if(!Input.left&&!Input.right)Player.vx*=.95;if(Input.left)Player.vx-=CONFIG.MOVE_SPEED;if(Input.right)Player.vx+=CONFIG.MOVE_SPEED;Player.vx=Math.max(-7.5,Math.min(7.5,Player.vx));
 if(Input.jump&&Player.onGround){Player.vy=-CONFIG.JUMP_POWER;Player.onGround=false;}Player.vy=Math.min(CONFIG.MAX_FALL,Player.vy+CONFIG.GRAVITY);
 var sx=Player.vx>0?1:-1;for(var i=0;i<Math.abs(Player.vx);i++){if(Collide.hitsSolid(Player.x+sx,Player.y,s,s))break;Player.x+=sx;Player.angle+=sx/CONFIG.PLAYER_RADIUS;}
 var sy=Player.vy>0?1:-1;Player.onGround=false;for(var j=0;j<Math.abs(Player.vy);j++){if(Collide.hitsSolid(Player.x,Player.y+sy,s,s)){if(sy>0)Player.onGround=true;Player.vy=0;break;}Player.y+=sy;}if(Player.x<0)Player.x=0;};
Player.isDead=function(){return Player.invincible<=0&&(Collide.hitsSpike(Player.x,Player.y,32,32)||Player.y>CONFIG.CANVAS_H+200);};
Player.hasWon=function(){return Level.isFinish(Math.floor((Player.x+16)/CONFIG.TILE),Math.floor((Player.y+16)/CONFIG.TILE));};
