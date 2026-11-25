/* =====================================================================
   quest-hands.js  —  reads your hands (and controllers) on Meta Quest 3
   You do not need to change this file.

   What it gives you:
   1. Two events on the scene:
        'pinchstart'  and  'pinchend'      e.detail.hand = 'left' or 'right'
   2. Live hand data, updated every frame:
        QuestHands.right.tip       where your right index fingertip is (x, y, z in meters)
        QuestHands.right.tracked   true when the headset can see that hand
        QuestHands.right.pinching  true while you are pinching
        QuestHands.right.rotation  which way your hand is turned (a THREE.Quaternion)
        QuestHands.right.roomTip   the fingertip in your real room (ignores the rig)
      (same for QuestHands.left)

   If your scene has an entity with id="rig" around the camera and hands,
   tip and rotation include where the rig has moved you.

   Controllers work too: the trigger = pinch, the controller tip = fingertip.
   On a computer: hold SPACE = right-hand pinch, so you can test without a headset.
   ===================================================================== */

const QuestHands = {
  left:  { tip: new THREE.Vector3(), roomTip: new THREE.Vector3(), rotation: new THREE.Quaternion(), tracked: false, pinching: false },
  right: { tip: new THREE.Vector3(), roomTip: new THREE.Vector3(), rotation: new THREE.Quaternion(), tracked: false, pinching: false }
};

const PINCH_ON  = 0.02;   // thumb and index closer than 2 cm   = pinch starts
const PINCH_OFF = 0.035;  // further apart than 3.5 cm          = pinch ends

AFRAME.registerComponent('quest-hands', {
  init: function () {
    const scene = this.el;
    this.matrix = new THREE.Matrix4();
    this.rigTurn = new THREE.Quaternion();

    // Browsers keep sound off until the user clicks or presses a key.
    // Clicking "Enter VR" counts, so sound works in the headset.
    const wake = () => THREE.AudioContext.getContext().resume();
    document.addEventListener('click', wake);
    document.addEventListener('keydown', wake);

    // Controllers: the trigger counts as a pinch
    scene.addEventListener('enter-vr', () => {
      const session = scene.xrSession;
      if (!session) return;
      session.addEventListener('selectstart', (e) => {
        if (!e.inputSource.hand) this.setPinch(e.inputSource.handedness, true);
      });
      session.addEventListener('selectend', (e) => {
        if (!e.inputSource.hand) this.setPinch(e.inputSource.handedness, false);
      });
      // If a hand disappears while pinching, end the pinch
      session.addEventListener('inputsourceschange', (e) => {
        e.removed.forEach((s) => this.setPinch(s.handedness, false));
      });
    });

    // Computer: hold SPACE to pinch with the right hand
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) this.setPinch('right', true);
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') this.setPinch('right', false);
    });
  },

  setPinch: function (hand, on) {
    const h = QuestHands[hand];
    if (!h || h.pinching === on) return;
    h.pinching = on;
    this.el.emit(on ? 'pinchstart' : 'pinchend', { hand: hand });
  },

  // Your real room -> the scene. Without a rig they are the same.
  toScene: function (h) {
    h.roomTip.copy(h.tip);
    if (!this.rig) return;
    h.tip.applyMatrix4(this.rig.matrixWorld);
    h.rotation.premultiply(this.rig.getWorldQuaternion(this.rigTurn));
  },

  tick: function () {
    const scene = this.el;
    const session = scene.xrSession, frame = scene.frame;
    QuestHands.left.tracked = false;
    QuestHands.right.tracked = false;
    // Works in VR and in mixed reality (AR / passthrough)
    if (!(scene.is('vr-mode') || scene.is('ar-mode')) || !session || !frame) return;
    const ref = scene.renderer.xr.getReferenceSpace();
    if (!ref) return;

    const rigEl = document.querySelector('#rig');
    this.rig = rigEl ? rigEl.object3D : null;
    if (this.rig) this.rig.updateMatrixWorld();

    for (const source of session.inputSources) {
      const h = QuestHands[source.handedness];
      if (!h) continue;

      if (source.hand) {
        // Tracked hand: read the index fingertip and the thumb tip
        const index = frame.getJointPose(source.hand.get('index-finger-tip'), ref);
        const thumb = frame.getJointPose(source.hand.get('thumb-tip'), ref);
        if (!index || !thumb) continue;
        const a = index.transform.position, b = thumb.transform.position;
        h.tip.set(a.x, a.y, a.z);
        const wrist = frame.getJointPose(source.hand.get('wrist'), ref);
        if (wrist) {
          const o = wrist.transform.orientation;
          h.rotation.set(o.x, o.y, o.z, o.w);
        }
        this.toScene(h);
        h.tracked = true;
        const gap = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
        if (gap < PINCH_ON) this.setPinch(source.handedness, true);
        else if (gap > PINCH_OFF) this.setPinch(source.handedness, false);
      } else {
        // Controller: use a point 5 cm in front of it
        const pose = frame.getPose(source.targetRaySpace, ref);
        if (!pose) continue;
        h.tip.set(0, 0, -0.05).applyMatrix4(this.matrix.fromArray(pose.transform.matrix));
        const o = pose.transform.orientation;
        h.rotation.set(o.x, o.y, o.z, o.w);
        this.toScene(h);
        h.tracked = true;
      }
    }
  }
});
