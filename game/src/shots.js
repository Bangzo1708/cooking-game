// Deterministic screenshot scenes for Dapur Kilat, staged through ?shot=.
// Each scene builds a real game state with the normal rules (real recipes,
// real patience values, a real half-assembled plate) and freezes the clock, so
// the frame is exactly what a player sees mid-shift — only the moment is
// chosen, nothing is faked. The cover shows every required element at once:
// the kitchen and order board, ingredients on the counter, one dish
// mid-assembly, a timer, and a plate ready to serve.

import { RECIPES, ingredientById } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, createState, makeOrder } from './state.js';

function recipeByName(name) {
  return RECIPES.find((recipe) => recipe.name === name);
}

function putOnPlate(state, ids) {
  for (const id of ids) {
    const def = ingredientById(id);
    state.plate.push({
      id,
      chopped: true,
      chopsDone: def.chops,
      chopsNeeded: def.chops,
      popAt: state.time - 1,
    });
  }
}

function setOrder(state, slot, name, patience, patienceMax) {
  const recipe = recipeByName(name);
  const order = makeOrder(state, recipe, patience);
  order.patienceMax = patienceMax;
  state.orders[slot] = order;
  return order;
}

/**
 * Stage the named scene on a fresh state and return the screen to draw.
 * Unknown names stage the cover.
 */
export function stageShot(name, state) {
  const fresh = createState(20261125);
  fresh.screen = SCREEN_PLAY;
  fresh.time = 42;
  fresh.shiftLeft = 96;
  fresh.score = 480;
  fresh.coins = 57;
  fresh.combo = 2;
  fresh.bestCombo = 4;
  fresh.hearts = 3;
  fresh.served = 6;
  Object.assign(state, fresh);

  if (name === 'rush') {
    setOrder(state, 0, 'Mie Ayam Geprek', 11, 30);
    setOrder(state, 1, 'Nasi Goreng Kilat', 7, 34);
    setOrder(state, 2, 'Mie Telur Kerupuk', 4, 28);
    state.shiftLeft = 41;
    state.combo = 4;
    state.bestCombo = 5;
    state.coins = 123;
    state.score = 1420;
    state.served = 14;
    putOnPlate(state, ['mie', 'telur', 'kerupuk']);
    state.message = 'Rush hour! Tiga pesanan hampir habis waktu.';
    state.messageKind = 'warn';
    state.messageUntil = state.time + 60;
    return SCREEN_PLAY;
  }

  if (name === 'serve') {
    setOrder(state, 0, 'Nasi Ayam Telur', 26, 36);
    setOrder(state, 1, 'Mie Sayur Tahu', 19, 30);
    state.orders[0].customer.mood = 'happy';
    state.orders[0].customer.moodUntil = state.time + 60;
    state.shiftLeft = 74;
    state.combo = 3;
    state.coins = 96;
    state.score = 980;
    state.served = 10;
    state.floats.push({ x: 814, y: 302, text: '+38 koin', color: '#ffd166', age: 0, life: 60 });
    state.floats.push({ x: 814, y: 340, text: 'KOMBO x3!', color: '#ff8fa3', age: 0, life: 60 });
    // A ring of confetti around the plate rim, clear of the floating texts.
    for (let index = 0; index < 14; index += 1) {
      const angle = (index / 14) * Math.PI * 2;
      state.particles.push({
        x: 814 + Math.cos(angle) * 138,
        y: 400 + Math.sin(angle) * 88,
        vx: 0,
        vy: 0,
        life: 60,
        age: 0,
        color: ['#ffd166', '#f2c14e', '#ffffff', '#e4572e'][index % 4],
        size: 4 + (index % 3),
      });
    }
    state.message = 'Nasi Ayam Telur disajikan — pelanggan senang!';
    state.messageKind = 'good';
    state.messageUntil = state.time + 60;
    return SCREEN_PLAY;
  }

  if (name === 'end') {
    state.screen = SCREEN_OVER;
    state.overAt = state.time;
    state.shiftLeft = 0;
    state.score = 2350;
    state.coins = 187;
    state.combo = 0;
    state.bestCombo = 6;
    state.served = 19;
    state.failed = 2;
    state.timedOut = 1;
    state.hearts = 2;
    return SCREEN_OVER;
  }

  // Cover: the full game at a glance. Three orders on the board (one nearly
  // out of time), a plate mid-assembly for the first order, raw chicken
  // half-chopped on the cutting board, and the serve button lit.
  setOrder(state, 0, 'Nasi Goreng Kilat', 26, 40);
  setOrder(state, 1, 'Mie Ayam Geprek', 17, 32);
  setOrder(state, 2, 'Nasi Tahu Sayur', 8, 30);
  putOnPlate(state, ['nasi', 'telur']);
  state.board = { id: 'sayur', chopsDone: 0, chopsNeeded: 1, wobble: state.time - 1 };
  state.message = 'Sayur di talenan — cincang dulu, lalu sajikan!';
  state.messageKind = 'warn';
  state.messageUntil = state.time + 60;
  return SCREEN_PLAY;
}
