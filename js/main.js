/* =====================================================================
   main.js  --  THE STARTING LINE.

   This is the smallest file in the project and it runs last. All it
   does is: set up the screen, load the data files, build the first
   level, and start the loop.

   You will almost never need to change this file.
   ===================================================================== */

Draw.setup();

window.addEventListener("error", function (event) {
  var message = document.getElementById("message");
  if (message) message.textContent = "Game error: " + event.message;
});

Level.loadData(function () {
  Game.startRound();
  Game.loop();
});
