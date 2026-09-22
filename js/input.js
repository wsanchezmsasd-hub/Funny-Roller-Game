var Input = { left:false,right:false,jump:false,restart:false,fire:false,weapon:1,dash:false };
window.addEventListener("keydown",function(e){
  setKey(e.key,true);
  if(["ArrowLeft","ArrowRight","ArrowUp"," ","z","x","c","1","2","3"].indexOf(e.key)>=0)e.preventDefault();
});
window.addEventListener("keyup",function(e){setKey(e.key,false);});
function setKey(k,d){
  if(k==="ArrowLeft"||k==="a"||k==="A")Input.left=d;
  if(k==="ArrowRight"||k==="d"||k==="D")Input.right=d;
  if(k==="ArrowUp"||k===" "||k==="w"||k==="W")Input.jump=d;
  if(k==="r"||k==="R")Input.restart=d;
  if(k==="z"||k==="Z")Input.fire=d;
  if(k==="x"||k==="X")Input.dash=d;
  if(k==="1")Input.weapon=1;if(k==="2")Input.weapon=2;if(k==="3")Input.weapon=3;
}
