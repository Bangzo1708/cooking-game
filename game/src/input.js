// Mouse and keyboard input for Dapur Kilat. The canvas is drawn at a fixed
// 1280x800 logical size and scaled by CSS, so every pointer position is mapped
// back into logical coordinates before hit-testing.

import { INGREDIENTS, LAYOUT } from './config.js';
import {
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  addIngredient,
  binAt,
  chopBoard,
  clearPlate,
  pointInRect,
  serveMatching,
  serveOrder,
  startShift,
  takeOffPlate,
  ticketAt,
} from './state.js';

/** Map a pointer event to logical canvas coordinates. */
export function toLogical(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

/**
 * Wire the canvas and the keyboard to a game object { state, sounds, onEvent }.
 * Returns a detach function. `onEvent` receives the EVENT_* bitmask plus a
 * string tag ('serve', 'fail', 'timeout', 'over', 'chop', 'pick', 'tick').
 */
export function bindInput(canvas, game) {
  const state = () => game.state;
  const sounds = () => game.sounds;

  function clickAt(x, y) {
    const current = state();
    sounds().unlock();
    sounds().resume();
    if (current.screen === SCREEN_TITLE) {
      startShift(current);
      sounds().bell();
      return;
    }
    if (current.screen === SCREEN_OVER) {
      if (current.time - current.overAt > 0.8) {
        current.screen = SCREEN_TITLE;
        sounds().pop();
      }
      return;
    }
    if (current.paused) {
      current.paused = false;
      return;
    }

    // Header buttons: mute (top-right) and pause.
    if (pointInRect(x, y, { x: 1096, y: 10, w: 74, h: 38 })) {
      current.muted = !current.muted;
      sounds().muted = current.muted;
      return;
    }
    if (pointInRect(x, y, { x: 1178, y: 10, w: 74, h: 38 })) {
      current.paused = true;
      return;
    }

    // Serve button.
    if (pointInRect(x, y, LAYOUT.serve)) {
      const events = serveMatching(current);
      game.onEvent(events, 'serve');
      return;
    }
    // Cutting board: chop what is on it.
    if (pointInRect(x, y, LAYOUT.boardZone)) {
      const result = chopBoard(current);
      if (result === 'chop' || result === 'done') sounds().chop();
      if (result === 'done') sounds().plop();
      return;
    }
    // Order ticket: serve the plate to that customer.
    const slot = ticketAt(x, y);
    if (slot >= 0 && slot < current.orders.length) {
      const events = serveOrder(current, current.orders[slot]);
      game.onEvent(events, 'serve');
      return;
    }
    // Ingredient bin: add it to the board or the plate.
    const bin = binAt(x, y);
    if (bin >= 0) {
      const result = addIngredient(current, INGREDIENTS[bin].id);
      if (result === 'board') sounds().pick();
      else if (result === 'plate') sounds().plop();
      else if (result === false) sounds().error();
      return;
    }
    // Plate zone: tap the plate to take the last piece off.
    if (pointInRect(x, y, LAYOUT.plateZone)) {
      if (takeOffPlate(current)) sounds().pop();
    }
  }

  function onPointerDown(event) {
    event.preventDefault();
    clickAt(...Object.values(toLogical(event, canvas)));
  }

  function onContextMenu(event) {
    event.preventDefault();
    const point = toLogical(event, canvas);
    if (state().screen === SCREEN_PLAY && takeOffPlate(state())) sounds().pop();
  }

  function onKeyDown(event) {
    const current = state();
    const key = event.key.toLowerCase();
    sounds().unlock();
    sounds().resume();
    if (current.screen === SCREEN_TITLE && (key === 'enter' || key === ' ')) {
      event.preventDefault();
      startShift(current);
      sounds().bell();
      return;
    }
    if (current.screen === SCREEN_OVER && key === 'r' && current.time - current.overAt > 0.8) {
      current.screen = SCREEN_TITLE;
      return;
    }
    if (current.screen !== SCREEN_PLAY) return;
    if (key === 'p' || key === 'escape') {
      current.paused = !current.paused;
      return;
    }
    if (current.paused) return;
    if (key === 'm') {
      current.muted = !current.muted;
      sounds().muted = current.muted;
      return;
    }
    if (key === ' ') {
      event.preventDefault();
      const result = chopBoard(current);
      if (result === 'chop' || result === 'done') sounds().chop();
      if (result === 'done') sounds().plop();
      return;
    }
    if (key === 'enter' || key === 's') {
      const events = serveMatching(current);
      game.onEvent(events, 'serve');
      return;
    }
    if (key === 'backspace' || key === 'x') {
      if (takeOffPlate(current)) sounds().pop();
      return;
    }
    if (key === 'c') {
      if (clearPlate(current)) sounds().pop();
      return;
    }
    const bin = INGREDIENTS.findIndex((item) => item.key === key);
    if (bin >= 0) {
      const result = addIngredient(current, INGREDIENTS[bin].id);
      if (result === 'board') sounds().pick();
      else if (result === 'plate') sounds().plop();
      else if (result === false) sounds().error();
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('keydown', onKeyDown);
  return function detach() {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('keydown', onKeyDown);
  };
}
