var Level={pieces:null,levels:null,grid:[],cols:0,name:"",startX:0,startY:0,tessaracts:[],exitOpen:false};
Level.loadData=function(done){fetch("data/pieces.json").then(function(r){return r.json();}).then(function(p){Level.pieces=p;return fetch("data/levels.json");}).then(function(r){return r.json();}).then(function(d){Level.levels=d.levels;done();}).catch(function(e){document.getElementById("message").textContent="Could not load level files.";console.error(e);});};
Level.build=function(n){
  var level=Level.levels[n], generated=!level;
  if(generated){level={name:"Procedural Sector "+(n+1),pieces:Level.randomPieces(8+Math.min(6,n-4))};}
  Level.name=level.name;Level.grid=[];Level.cols=level.pieces.length*CONFIG.PIECE_COLS;
  for(var r=0;r<CONFIG.ROWS;r++){Level.grid.push("");for(var p=0;p<level.pieces.length;p++){var piece=Level.pieces[level.pieces[p]]||Level.pieces.flat;Level.grid[r]+=piece[r];}}
  Level.findStart();Level.tessaracts=[];Level.exitOpen=false;
  for(var i=0;i<CONFIG.RED_TESSARACTS_PER_LEVEL;i++){Level.tessaracts.push({x:(2+i*3)*CONFIG.TILE,y:120+(i%2)*80,red:true,collected:false});}
};
Level.randomPieces=function(count){var pool=["flat","gap","spikes","platform","stairs","spikehill","manygap","step"];var a=["start"];for(var i=1;i<count-1;i++)a.push(pool[Math.floor(Math.random()*pool.length)]);a.push("finish");return a;};
Level.findStart=function(){for(var r=0;r<CONFIG.ROWS;r++)for(var c=0;c<Level.cols;c++)if(Level.charAt(c,r)==="S"){Level.startX=c*CONFIG.TILE;Level.startY=r*CONFIG.TILE;return;}Level.startX=0;Level.startY=0;};
Level.charAt=function(c,r){if(r<0||r>=CONFIG.ROWS||c<0||c>=Level.cols)return ".";return Level.grid[r].charAt(c);};
Level.isSolid=function(c,r){return Level.charAt(c,r)==="#";};Level.isSpike=function(c,r){return Level.charAt(c,r)==="^";};
Level.isFinish=function(c,r){return Level.charAt(c,r)==="F"&&Level.exitOpen;};Level.pixelWidth=function(){return Level.cols*CONFIG.TILE;};
Level.destroyAt=function(x,y,r){var c=Math.floor(x/CONFIG.TILE),row=Math.floor(y/CONFIG.TILE);for(var yy=row-r;yy<=row+r;yy++)for(var xx=c-r;xx<=c+r;xx++)if(Level.isSolid(xx,yy)&&Math.hypot(xx-c,yy-row)<=r)Level.grid[yy]=Level.grid[yy].substring(0,xx)+"."+Level.grid[yy].substring(xx+1);};
Level.collect=function(){for(var i=Level.tessaracts.length-1;i>=0;i--){var t=Level.tessaracts[i];if(!t.collected&&Math.hypot(Player.x+16-t.x,Player.y+16-t.y)<28){t.collected=true;Game.redTessaracts++;Game.goldTessaracts++;}}if(Game.redTessaracts>=CONFIG.RED_TESSARACTS_PER_LEVEL)Level.exitOpen=true;};
