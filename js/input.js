/* =====================================================================
   input.js  --  READING THE KEYBOARD.

   Nothing in here decides what happens. It only records which keys are
   being held down right now. js/player.js is what reads these values and
   decides to move.
   ===================================================================== */

var Input = {
  left: false,
  right: false,
  jump: false,
  restart: false,
  ability: false,
  mouseDown: false,
  mouseX: 0,
  mouseY: 0
};

window.addEventListener("keydown", function (event) {
  setKey(event.key, true);
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].indexOf(event.key) >= 0) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", function (event) {
  setKey(event.key, false);
});

window.addEventListener("mousedown", function (event) { if (event.button === 0) Input.mouseDown = true; });
window.addEventListener("mouseup", function (event) { if (event.button === 0) Input.mouseDown = false; });
window.addEventListener("mousemove", function (event) {
  var rect = document.getElementById("game").getBoundingClientRect();
  Input.mouseX = (event.clientX - rect.left) * CONFIG.CANVAS_W / rect.width + Draw.cameraX;
  Input.mouseY = (event.clientY - rect.top) * CONFIG.CANVAS_H / rect.height;
});

function setKey(key, isDown) {
  if (key === "ArrowLeft"  || key === "a" || key === "A") { Input.left  = isDown; }
  if (key === "ArrowRight" || key === "d" || key === "D") { Input.right = isDown; }
  if (key === "ArrowUp"    || key === " " || key === "w" || key === "W") { Input.jump = isDown; }
  if (key === "r" || key === "R") { Input.restart = isDown; }
  if (key === "e" || key === "E") { Input.ability = isDown; }
}
