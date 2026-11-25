// Dapur Kilat — entry point. Boots the canvas game, runs the frame loop, and
// stages the deterministic screenshot scenes behind ?shot=cover|rush|serve|end
// (with &seed= to pick the customer deal). In shot mode the clock is frozen so
// the same URL always renders the same frame.

import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { SoundBoard } from './audio.js';
import { bindInput } from './input.js';
import { drawScene } from './render.js';
import { stageShot } from './shots.js';
import {
  EVENT_FAILED,
  EVENT_OVER,
  EVENT_SERVED,
  EVENT_TIMEOUT,
  SCREEN_OVER,
  SCREEN_TITLE,
  createState,
  update,
} from './state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') || '', 10);
const seed = Number.isFinite(seedParam) ? seedParam : 20261125;

const game = {
  state: createState(seed),
  sounds: new SoundBoard(),
  onEvent(events, tag) {
    if (!events) return;
    if (events & EVENT_SERVED) {
      this.sounds.serve();
      window.setTimeout(() => this.sounds.coin(), 160);
    }
    if (events & EVENT_FAILED) this.sounds.error();
    if (events & EVENT_TIMEOUT) this.sounds.error();
    if (events & EVENT_OVER) this.sounds.gameOver();
    void tag;
  },
};

function announce() {
  const state = game.state;
  const lines = [
    `Dapur Kilat: ${state.screen === SCREEN_TITLE ? 'menu utama' : state.screen === SCREEN_OVER ? 'shift selesai' : 'shift berjalan'}`,
    `skor ${state.score}, ${state.coins} koin, kombo x${state.combo}, ${state.hearts} hati`,
    `${state.orders.length} pesanan aktif, ${state.plate.length} bahan di piring`,
    `sisa shift ${Math.ceil(state.shiftLeft)} detik`,
  ];
  statusLine.textContent = lines.join('. ');
}

if (shotName) {
  // Screenshot mode: stage the scene, draw exactly one frame, and stop. The
  // clock never advances, so the frame is byte-stable for a given URL.
  stageShot(shotName, game.state);
  drawScene(ctx, game.state);
  announce();
} else {
  bindInput(canvas, game);
  let last = performance.now();
  let announcedAt = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const state = game.state;
    if (state.screen !== SCREEN_TITLE && state.screen !== SCREEN_OVER) {
      const before = Math.ceil(state.shiftLeft);
      const events = update(state, dt);
      const after = Math.ceil(state.shiftLeft);
      if (before !== after && after <= 10 && after > 0) game.sounds.tick();
      game.onEvent(events, 'loop');
    } else {
      state.time += dt;
    }
    drawScene(ctx, state);
    if (now - announcedAt > 2000) {
      announcedAt = now;
      announce();
    }
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);
}
