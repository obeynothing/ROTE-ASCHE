import test from 'node:test';
import assert from 'node:assert/strict';
import { detectInputMode, getControlLabels, isXboxControllerId } from './controls';

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
