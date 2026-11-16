import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStickFilterState,
  detectInputMode,
  evaluateLeftStickDirections,
  getControlLabels,
  isXboxControllerId,
} from './controls';

test('detectInputMode returns keyboard when no gamepad is connected', () => {
  assert.equal(detectInputMode([]), 'keyboard');
  const labels = getControlLabels([]);
  assert.equal(labels.mode, 'keyboard');
  assert.equal(labels.confirm, 'ENTER');
  assert.equal(labels.back, 'ESC');
  assert.equal(labels.jump, 'SPACE');
  assert.equal(labels.shoot, 'F');
  assert.equal(labels.tagSwitch, 'TAB');
  assert.equal(labels.weaponCycle, '1–4 · C');
});

test('detectInputMode returns xbox when Xbox/standard gamepad is connected and hides keyboard keys', () => {
  const pads = [
    {
      index: 0,
      id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)',
      connected: true,
    },
  ];
  assert.equal(isXboxControllerId(pads[0].id), true);
  assert.equal(detectInputMode(pads), 'xbox');

  const labels = getControlLabels(pads);
  assert.equal(labels.mode, 'xbox');
  assert.equal(labels.confirm, 'A');
  assert.equal(labels.back, 'B');
  assert.equal(labels.move, 'LS');
  assert.equal(labels.jump, 'A');
  assert.equal(labels.shoot, 'X');
  assert.equal(labels.tagSwitch, 'Y / LB');
  assert.equal(labels.weaponCycle, 'LT');
  assert.equal(labels.pause, 'START');
  assert.ok(!labels.confirm.includes('ENTER'));
  assert.ok(!labels.move.includes('WASD'));
  assert.ok(!labels.tagSwitch.includes('TAB'));
});

test('evaluateLeftStickDirections prevents stick drift and mechanical snapback right turns when shooting', () => {
  const state = createStickFilterState();

  // Centered initial poll -> calibrates neutral cleanly
  assert.deepEqual(evaluateLeftStickDirections(state, 0.04, 0, 100, false), {
    left: false,
    right: false,
    up: false,
    down: false,
  });

  // Positive resting drift up to 0.40 must NOT flip facing right
  assert.deepEqual(evaluateLeftStickDirections(state, 0.39, 0, 120, true), {
    left: false,
    right: false,
    up: false,
    down: false,
  });

  // Player holds left strongly (-0.95), then releases stick to press Shoot -> spring snaps back to +0.58!
  const leftPush = evaluateLeftStickDirections(state, -0.95, 0, 200, false);
  assert.equal(leftPush.left, true);
  assert.equal(leftPush.right, false);

  const snapback = evaluateLeftStickDirections(state, 0.58, 0, 240, true);
  assert.equal(snapback.right, false, 'mechanical thumbstick snapback (+0.58 at +40ms) must NOT turn right');

  // Deliberate full slam right (+0.92) overrides immediately, or holding right past 175ms activates cleanly
  const heldRightLater = evaluateLeftStickDirections(state, 0.58, 0, 400, false);
  assert.equal(heldRightLater.right, true, 'deliberate right hold after snapback window turns right');
});

test('evaluateLeftStickDirections ignores slight horizontal tilt while aiming up and rejects uncentered initial drift', () => {
  const state = createStickFilterState();
  evaluateLeftStickDirections(state, 0, 0, 10, false);

  // Player pushes Up (-0.95) to shoot upward with +0.46 thumb lean -> must not turn right
  const aimUp = evaluateLeftStickDirections(state, 0.46, -0.95, 50, true);
  assert.equal(aimUp.up, true);
  assert.equal(aimUp.right, false);

  // Uncentered drifting controller connected at +0.55 while pressing Shoot -> stays ignored until centered/moved
  const drifted = createStickFilterState();
  assert.equal(evaluateLeftStickDirections(drifted, 0.55, 0, 100, true, true).right, false);
  assert.equal(evaluateLeftStickDirections(drifted, 0.56, 0, 140, true, true).right, false);
  // Once centered near 0, normal right movement works again
  evaluateLeftStickDirections(drifted, 0.05, 0, 200, false, true);
  assert.equal(evaluateLeftStickDirections(drifted, 0.70, 0, 240, false, true).right, true);
});

