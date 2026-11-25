LIGHT SWITCH ROOM — Quest 3
===========================

A cozy room made with three.js: wood floor, a window, a door and a ceiling
lamp. It starts dark, lit only by the moon through the window. Walk to the
light switch next to the door and turn the lights on, like at home.

MOVE
  Left stick ...... walk where you are looking
  Right stick ..... turn 45 degrees
  (You can also take real steps inside your Quest boundary.)

THE LIGHT SWITCH
  Pinch the lever and move your hand:
    up   = lights on
    down = lights off
  The lever follows your finger. When it passes the middle it snaps over
  with a click and the lamp fades on or off. Let go before the middle and
  it springs back, like a real switch.
  A small orange light on the switch helps you find it in the dark.
  Controllers: hold the trigger on the lever and move up or down.
  Computer: click the switch.

RUN IT
  Computer: VS Code > right-click index.html > Open with Live Server.
            WASD to walk, drag to look, click the switch.
  Quest 3:  drag this folder into app.netlify.com/drop, open the link in the
            Meta Quest Browser and press Enter VR.

CHANGE IT
  Brighter lamp ......... in cozy-room, change 18 in "this.lamp.intensity = 18 * L"
  Warmer or cooler light  change the lamp color '#FFD9A0'
  Slower fade ........... change 150 in "delta / 150"
  Switch height ......... change 1.2 in the light-switch position
  Stiffer switch ........ change 12 in "(h.tip.y - this.startY) * 12" (smaller = more travel)

FILES
  index.html       The room, the lamp, the light switch and joystick movement.
  quest-hands.js   Reads your hands. You don't need to change it.
  sounds/          click.mp3, original and free to use.
